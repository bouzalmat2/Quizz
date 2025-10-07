<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

$email = 'e2e_direct_user@example.com';
$name = 'E2E Direct User';
$password = 'Secret123!';
$role = 'teacher';

// Check if user exists
$existing = User::where('email', $email)->first();
if ($existing) {
    echo "User already exists.\n";
    echo "id: {$existing->id}\n";
    echo "email: {$existing->email}\n";
    echo "role: {$existing->role}\n";
    echo "api_token: {$existing->api_token}\n";
} else {
    $user = User::create([
        'name' => $name,
        'email' => $email,
        'password' => $password,
        'role' => $role,
        'api_token' => Str::random(60),
    ]);
    echo "Created user:\n";
    echo "id: {$user->id}\n";
    echo "email: {$user->email}\n";
    echo "role: {$user->role}\n";
    echo "api_token: {$user->api_token}\n";

    // Simulate login
    $found = User::where('email', $email)->first();
    $ok = Hash::check($password, $found->password);
    echo "\nSimulated login check: " . ($ok ? 'SUCCESS' : 'FAIL') . "\n";
    if ($ok) {
        echo "Login response (simulated):\n";
        echo json_encode(['success' => true, 'data' => ['id' => $found->id, 'email' => $found->email, 'role' => $found->role, 'api_token' => $found->api_token]], JSON_PRETTY_PRINT) . PHP_EOL;
    }
}
