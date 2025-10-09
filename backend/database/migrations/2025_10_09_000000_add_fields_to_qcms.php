<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds duration (minutes), difficulty, max_attempts, start_at, end_at, passing_score to qcms.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('qcms', function (Blueprint $table) {
            $table->integer('duration')->nullable()->after('description')->comment('Duration in minutes');
            $table->string('difficulty')->nullable()->after('duration');
            $table->integer('max_attempts')->nullable()->after('difficulty');
            $table->dateTime('start_at')->nullable()->after('max_attempts');
            $table->dateTime('end_at')->nullable()->after('start_at');
            $table->integer('passing_score')->nullable()->after('end_at');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('qcms', function (Blueprint $table) {
            $table->dropColumn(['duration','difficulty','max_attempts','start_at','end_at','passing_score']);
        });
    }
};
