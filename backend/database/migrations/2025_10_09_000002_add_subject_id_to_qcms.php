<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // add nullable subject_id
        Schema::table('qcms', function (Blueprint $table) {
            $table->unsignedBigInteger('subject_id')->nullable()->after('title');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('set null');
        });

        // migrate existing subject names to subject_id when possible
        // this runs raw SQL joining subjects by name
    // Postgres-compatible update joining subjects by name
    DB::statement("UPDATE qcms SET subject_id = subjects.id FROM subjects WHERE qcms.subject = subjects.name");

        // drop the old subject column if exists
        if (Schema::hasColumn('qcms', 'subject')) {
            Schema::table('qcms', function (Blueprint $table) {
                $table->dropColumn('subject');
            });
        }
    }

    public function down()
    {
        // add subject back and populate from subject_id
        Schema::table('qcms', function (Blueprint $table) {
            $table->string('subject')->nullable()->after('title');
        });

    DB::statement("UPDATE qcms SET subject = subjects.name FROM subjects WHERE qcms.subject_id = subjects.id");

        Schema::table('qcms', function (Blueprint $table) {
            $table->dropForeign(['subject_id']);
            $table->dropColumn('subject_id');
        });
    }
};
