<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Qcm extends Model
{
    protected $table = 'qcms';
    protected $fillable = ['title','subject_id','subject','description','teacher_id','published','duration','difficulty','max_attempts','start_at','end_at','passing_score'];

    public function subject() {
        return $this->belongsTo(\App\Models\Subject::class, 'subject_id');
    }

    public function questions() {
        return $this->hasMany(Question::class, 'qcm_id');
    }

    public function teacher() {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
