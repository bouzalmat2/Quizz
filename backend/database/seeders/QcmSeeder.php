<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Qcm;
use App\Models\Question;
use App\Models\User;
use Illuminate\Support\Str;

class QcmSeeder extends Seeder
{
    public function run(): void
    {
        // ensure a teacher exists
        $teacher = User::firstWhere('role', 'teacher');
        if (!$teacher) {
            $teacher = User::create([
                'name' => 'Seed Teacher',
                'email' => 'teacher@example.com',
                'password' => 'Secret123!',
                'role' => 'teacher',
                'api_token' => Str::random(60),
            ]);
        }

        $qcm = Qcm::create([
            'title' => 'IP Addressing Basics',
            'subject' => 'Networking',
            'description' => 'Fundamentals of IPv4 addressing and subnetting.',
            'teacher_id' => $teacher->id,
            'published' => true,
        ]);

        Question::create([
            'qcm_id' => $qcm->id,
            'text' => 'Which class of IPv4 address does 192.168.1.1 belong to?',
            'options' => json_encode(['A', 'B', 'C', 'D']),
            'correct_answer' => 'C',
            'explanation' => '192.168.1.1 is a Class C private address.',
        ]);

        Question::create([
            'qcm_id' => $qcm->id,
            'text' => 'What is the default subnet mask for a Class C network?',
            'options' => json_encode(['255.0.0.0','255.255.0.0','255.255.255.0','255.255.255.255']),
            'correct_answer' => '255.255.255.0',
            'explanation' => 'Class C default mask is 255.255.255.0',
        ]);
    }
}
