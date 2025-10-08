<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        if ($request->getMethod() === 'OPTIONS') {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'nullable|in:student,teacher',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'], // Laravel will hash via cast
            'role' => $data['role'] ?? 'student',
            'api_token' => Str::random(60),
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'api_token' => $user->api_token,
            ]
        ], 201)
        ->header('Access-Control-Allow-Origin', '*');
    }

    public function login(Request $request)
    {
        if ($request->getMethod() === 'OPTIONS') {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        }

        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();
        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['success' => false, 'message' => 'Invalid credentials'], 401);
        }

        // generate new token
        $user->api_token = Str::random(60);
        $user->save();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'api_token' => $user->api_token,
            ]
        ])
        ->header('Access-Control-Allow-Origin', '*');
    }

    protected function userFromToken(Request $request)
    {
        $token = $request->header('Authorization');
        if (!$token) return null;
        $token = preg_replace('/^Bearer\s+/i', '', $token);
        return User::where('api_token', $token)->first();
    }

    public function profile(Request $request)
    {
        $user = $this->userFromToken($request);
        if (!$user) return response()->json(['error' => 'Unauthorized'], 401);
        return response()->json(['data' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'avatar' => $user->avatar,
        ]]);
    }

    public function updateProfile(Request $request)
    {
        $user = $this->userFromToken($request);
        if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

        // Basic name validation. Do not require 'avatar' to be a string because
        // clients may send multipart/form-data with a file. We'll validate file
        // uploads separately below.
        $data = $request->validate([
            'name' => 'nullable|string|max:255',
            'avatar' => 'nullable', // may be string (legacy) or a file in the request
        ]);

        if (isset($data['name'])) $user->name = $data['name'];

        try {
            // If client uploaded a file, validate and store it
            if ($request->hasFile('avatar')) {
                $request->validate([
                    'avatar' => 'file|image|mimes:jpg,jpeg,png,gif,webp|max:2048', // max 2MB
                ]);

                $file = $request->file('avatar');
                $path = $file->store('avatars', 'public');
                if (!$path) {
                    return response()->json(['error' => 'Failed to store uploaded file'], 500);
                }
                $user->avatar = '/storage/' . $path;
            } elseif (!empty($data['avatar'])) {
                // legacy base64 or URL handling
                if (preg_match('/^data:\w+\/\w+;base64,/', $data['avatar'])) {
                    $parts = explode(',', $data['avatar']);
                    $meta = $parts[0];
                    $content = base64_decode($parts[1]);
                    $ext = 'png';
                    if (preg_match('/image\/(\w+)/', $meta, $m)) $ext = $m[1];
                    $filename = 'avatars/' . uniqid() . '.' . $ext;
                    Storage::disk('public')->put($filename, $content);
                    $user->avatar = '/storage/' . $filename;
                } else {
                    $user->avatar = $data['avatar'];
                }
            }
        } catch (\Illuminate\Validation\ValidationException $ve) {
            return response()->json(['error' => 'Invalid avatar file: ' . $ve->getMessage()], 422);
        } catch (\Exception $e) {
            // log exception
            Log::error('Profile update failed: ' . $e->getMessage());
            return response()->json(['error' => 'Server error while updating profile'], 500);
        }

        $user->save();
        return response()->json(['success' => true, 'data' => ['id' => $user->id, 'name' => $user->name, 'avatar' => $user->avatar]]);
    }

    public function changePassword(Request $request)
    {
        $user = $this->userFromToken($request);
        if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

        $data = $request->validate([
            'old_password' => 'required|string',
            'new_password' => 'required|string|min:6',
        ]);

        if (!Hash::check($data['old_password'], $user->password)) {
            return response()->json(['error' => 'Old password incorrect'], 422);
        }

        $user->password = $data['new_password'];
        $user->save();

        return response()->json(['success' => true]);
    }
}
