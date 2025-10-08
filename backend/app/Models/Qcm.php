<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Qcm extends Model
{
    protected $table = 'qcms';
    protected $fillable = ['title','subject','description','teacher_id','published'];

    public function questions() {
        return $this->hasMany(Question::class, 'qcm_id');
    }

    public function teacher() {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
