<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update existing results to set `passed` based on qcm.passing_score (fallback 50)
        // Works across sqlite/mysql/postgres using a correlated subquery
        DB::statement(
            "UPDATE results SET passed = (score >= COALESCE((SELECT passing_score FROM qcms WHERE qcms.id = results.qcm_id), 50)) WHERE qcm_id IS NOT NULL"
        );
    }

    public function down(): void
    {
        // Revert to false for safety
        DB::statement("UPDATE results SET passed = 0");
    }
};
