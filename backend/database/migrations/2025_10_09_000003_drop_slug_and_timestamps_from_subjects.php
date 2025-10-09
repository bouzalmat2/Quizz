<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('subjects', function (Blueprint $table) {
            // only drop columns if they exist (safe for multiple environments)
            if (Schema::hasColumn('subjects', 'slug')) {
                $table->dropColumn('slug');
            }

            // Drop timestamps columns if present
            if (Schema::hasColumn('subjects', 'created_at') || Schema::hasColumn('subjects', 'updated_at')) {
                // Use dropTimestamps when available
                try {
                    $table->dropTimestamps();
                } catch (\Exception $e) {
                    // fallback: drop columns individually
                    if (Schema::hasColumn('subjects', 'created_at')) {
                        $table->dropColumn('created_at');
                    }
                    if (Schema::hasColumn('subjects', 'updated_at')) {
                        $table->dropColumn('updated_at');
                    }
                }
            }
        });
    }

    public function down()
    {
        Schema::table('subjects', function (Blueprint $table) {
            // restore columns
            if (!Schema::hasColumn('subjects', 'slug')) {
                $table->string('slug')->nullable()->after('name');
            }

            if (!Schema::hasColumn('subjects', 'created_at') && !Schema::hasColumn('subjects', 'updated_at')) {
                $table->timestamps();
            }
        });
    }
};
