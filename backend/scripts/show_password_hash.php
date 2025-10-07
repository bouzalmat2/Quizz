<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
try {
    $user = DB::selectOne('SELECT id, email, password FROM users ORDER BY id DESC LIMIT 1');
    if (!$user) {
        echo "No users found\n";
        exit(0);
    }
    echo "Latest user password field:\n";
    echo "id: " . $user->id . PHP_EOL;
    echo "email: " . $user->email . PHP_EOL;
    echo "password: " . $user->password . PHP_EOL;
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}
