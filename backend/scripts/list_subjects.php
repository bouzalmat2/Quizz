<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$items = Illuminate\Support\Facades\DB::table('subjects')->pluck('name')->toArray();
foreach ($items as $i) echo $i . PHP_EOL;
