<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // add bank-related columns to questions table and make qcm_id nullable
        Schema::table('questions', function (Blueprint $table) {
            // Add bank-specific columns to questions. qcm_id is left as-is (already created by questions migration).
            if (! Schema::hasColumn('questions', 'teacher_id')) {
                $table->foreignId('teacher_id')->nullable()->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('questions', 'difficulty')) {
                $table->string('difficulty')->nullable();
            }
            if (! Schema::hasColumn('questions', 'image_url')) {
                $table->string('image_url')->nullable();
            }
        });

        // If a bank_questions table exists, migrate its rows into questions then drop it
        if (Schema::hasTable('bank_questions')) {
            // Ensure qcm_id accepts NULLs so we can insert bank items with qcm_id = NULL.
            try {
                if (Schema::hasColumn('questions', 'qcm_id')) {
                    // PostgreSQL: DROP NOT NULL
                    DB::statement('ALTER TABLE questions ALTER COLUMN qcm_id DROP NOT NULL');
                }
            } catch (\Exception $e) {
                // If this fails, fallback to attempting inserts and let DB report errors.
                // We don't abort the migration here explicitly.
            }
            $bankRows = DB::table('bank_questions')->get();
            foreach ($bankRows as $row) {
                DB::table('questions')->insert([
                    'qcm_id' => null,
                    'text' => $row->text,
                    'options' => $row->options,
                    'correct_answer' => $row->correct_answer,
                    'explanation' => $row->explanation,
                    'teacher_id' => $row->teacher_id,
                    'difficulty' => $row->difficulty ?? null,
                    'image_url' => $row->image_url ?? null,
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                ]);
            }

            Schema::dropIfExists('bank_questions');
        }
    }

    public function down(): void
    {
        // Recreate bank_questions table and move bank rows back, then remove added columns
        if (! Schema::hasTable('bank_questions')) {
            Schema::create('bank_questions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
                $table->text('text');
                $table->json('options');
                $table->string('correct_answer');
                $table->text('explanation')->nullable();
                $table->string('difficulty')->nullable();
                $table->string('image_url')->nullable();
                $table->timestamps();
            });
        }

        // Move questions that look like bank items (qcm_id IS NULL and have teacher_id) back into bank_questions
        $bankRows = DB::table('questions')->whereNull('qcm_id')->whereNotNull('teacher_id')->get();
        foreach ($bankRows as $row) {
            DB::table('bank_questions')->insert([
                'teacher_id' => $row->teacher_id,
                'text' => $row->text,
                'options' => $row->options,
                'correct_answer' => $row->correct_answer,
                'explanation' => $row->explanation,
                'difficulty' => $row->difficulty ?? null,
                'image_url' => $row->image_url ?? null,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        // Remove the bank-specific columns from questions
        Schema::table('questions', function (Blueprint $table) {
            if (Schema::hasColumn('questions', 'teacher_id')) {
                $table->dropForeign(['teacher_id']);
                $table->dropColumn('teacher_id');
            }
            if (Schema::hasColumn('questions', 'difficulty')) {
                $table->dropColumn('difficulty');
            }
            if (Schema::hasColumn('questions', 'image_url')) {
                $table->dropColumn('image_url');
            }

            // try to revert qcm_id to not-nullable
            if (Schema::hasColumn('questions', 'qcm_id')) {
                try {
                    $table->foreignId('qcm_id')->nullable(false)->constrained('qcms')->cascadeOnDelete()->change();
                } catch (\Exception $e) {
                    // best-effort
                }
            }
        });
    }
};
