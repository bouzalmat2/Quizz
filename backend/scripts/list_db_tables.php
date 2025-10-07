<?php
// Quick script to show which DB Laravel is using and list tables in public schema (Postgres)
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Laravel DB default connection: " . config('database.default') . PHP_EOL;
$default = config('database.default');
echo "Connection config (database): " . config("database.connections.$default.database") . PHP_EOL;

try {
    $conn = DB::connection();
    echo "Connected database name (via PDO): " . $conn->getDatabaseName() . PHP_EOL;
    if ($default === 'pgsql') {
        $tables = DB::select("SELECT tablename FROM pg_tables WHERE schemaname='public'");
        echo "Tables in public schema:\n";
        foreach ($tables as $t) {
            echo " - " . $t->tablename . PHP_EOL;
        }
    } else {
        // generic sqlite/mysql listing
        $tables = [];
        if ($default === 'sqlite') {
            $rows = DB::select("SELECT name FROM sqlite_master WHERE type='table'");
            echo "SQLite tables:\n";
            foreach ($rows as $r) echo " - " . ($r->name ?? '') . PHP_EOL;
        } else {
            echo "Non-pgsql driver, unable to list via pg_tables.\n";
        }
    }
} catch (Exception $e) {
    echo "Error connecting to DB: " . $e->getMessage() . PHP_EOL;
}
