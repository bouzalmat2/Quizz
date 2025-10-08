<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankQuestion extends Model
{
    protected $table = 'bank_questions';
    protected $fillable = ['teacher_id','text','options','correct_answer','explanation','difficulty','image_url'];

    protected $casts = [
        'options' => 'array',
    ];

    public function teacher() {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
