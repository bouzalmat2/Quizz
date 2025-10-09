<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    protected $table = 'subjects';
    // slug removed — subjects now only expose name
    protected $fillable = ['name'];
}
