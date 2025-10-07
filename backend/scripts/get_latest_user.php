<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    $user = DB::selectOne('SELECT id, name, email, role, api_token, created_at FROM users ORDER BY id DESC LIMIT 1');
    if (!$user) {
        echo "No users found\n";
        exit(0);
    }
    echo "Latest user:\n";
    echo "id: " . $user->id . PHP_EOL;
    echo "name: " . $user->name . PHP_EOL;
    echo "email: " . $user->email . PHP_EOL;
    echo "role: " . $user->role . PHP_EOL;
    echo "api_token: " . $user->api_token . PHP_EOL;
    echo "created_at: " . $user->created_at . PHP_EOL;
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}
