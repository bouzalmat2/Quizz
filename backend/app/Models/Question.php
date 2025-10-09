<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    protected $fillable = ['qcm_id','text','options','correct_answer','explanation','teacher_id','difficulty','image_url'];

    protected $casts = [
        'options' => 'array',
    ];

    public function qcm() {
        return $this->belongsTo(Qcm::class, 'qcm_id');
    }

    public function teacher() {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
