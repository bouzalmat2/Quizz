<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SubjectSeeder extends Seeder
{
    public function run()
    {
        $subjects = [
            'Computer Science Fundamentals',
            'Data Structures & Algorithms',
            'Databases & SQL',
            'Computer Networks',
            'Network Security',
            'Operating Systems',
            'Distributed Systems',
            'Machine Learning & AI',
            'Web Development',
            'Cloud Computing'
        ];

        foreach ($subjects as $name) {
            DB::table('subjects')->updateOrInsert(['name' => $name], []);
        }
    }
}
