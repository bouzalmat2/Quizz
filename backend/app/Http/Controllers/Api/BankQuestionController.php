<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\BankQuestion;
use App\Models\Qcm;
use App\Models\Question;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class BankQuestionController extends Controller
{
    protected function userFromRequest(Request $request)
    {
        $token = $request->header('Authorization');
        if (!$token) return null;
        $token = preg_replace('/^Bearer\s+/i', '', $token);
        return User::where('api_token', $token)->first();
    }

    public function index(Request $request)
    {
        $user = $this->userFromRequest($request);
        if (!$user || $user->role !== 'teacher') return response()->json(['error' => 'Forbidden'], 403);
        return BankQuestion::where('teacher_id', $user->id)->get();
    }

    public function store(Request $request)
    {
        $user = $this->userFromRequest($request);
        if (!$user || $user->role !== 'teacher') return response()->json(['error' => 'Forbidden'], 403);

        $data = $request->validate([
            'text' => 'required|string',
            'options' => 'required|array|min:2|max:6',
            'correct_answer' => 'required|string',
            'explanation' => 'nullable|string',
            'difficulty' => 'nullable|string',
            'image_url' => 'nullable|url',
        ]);

        $data['teacher_id'] = $user->id;
        $bq = BankQuestion::create($data);
        return response()->json($bq, 201);
    }

    public function show(Request $request, $id)
    {
        $user = $this->userFromRequest($request);
        $bq = BankQuestion::findOrFail($id);
        if (!$user || $user->id !== $bq->teacher_id) return response()->json(['error' => 'Forbidden'], 403);
        return $bq;
    }

    public function update(Request $request, $id)
    {
        $user = $this->userFromRequest($request);
        $bq = BankQuestion::findOrFail($id);
        if (!$user || $user->id !== $bq->teacher_id) return response()->json(['error' => 'Forbidden'], 403);

        $data = $request->validate([
            'text' => 'nullable|string',
            'options' => 'nullable|array|min:2|max:6',
            'correct_answer' => 'nullable|string',
            'explanation' => 'nullable|string',
            'difficulty' => 'nullable|string',
            'image_url' => 'nullable|url',
        ]);

        $bq->update($data);
        return $bq;
    }

    public function destroy(Request $request, $id)
    {
        $user = $this->userFromRequest($request);
        $bq = BankQuestion::findOrFail($id);
        if (!$user || $user->id !== $bq->teacher_id) return response()->json(['error' => 'Forbidden'], 403);
        $bq->delete();
        return response()->json(['success' => true]);
    }

    // copy a bank question into a given QCM as a real question
    public function attachToQcm(Request $request, $bankQuestionId, $qcmId)
    {
        $user = $this->userFromRequest($request);
        if (!$user || $user->role !== 'teacher') return response()->json(['error' => 'Forbidden'], 403);

        $bq = BankQuestion::findOrFail($bankQuestionId);
        $qcm = Qcm::findOrFail($qcmId);
        if ($qcm->teacher_id !== $user->id) return response()->json(['error' => 'Forbidden'], 403);

        $question = Question::create([
            'qcm_id' => $qcm->id,
            'text' => $bq->text,
            'options' => $bq->options,
            'correct_answer' => $bq->correct_answer,
            'explanation' => $bq->explanation,
        ]);

        return response()->json($question, 201);
    }
}
