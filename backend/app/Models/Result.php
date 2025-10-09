<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Result extends Model
{
    protected $fillable = ['student_id','qcm_id','score','feedback','passed','duration'];

    protected $casts = ['feedback' => 'array', 'passed' => 'boolean', 'duration' => 'integer'];

    public function student() { return $this->belongsTo(User::class, 'student_id'); }
    public function qcm() { return $this->belongsTo(Qcm::class, 'qcm_id'); }
}
