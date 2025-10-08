<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Qcm;
use App\Models\Question;
use App\Models\Answer;
use App\Models\Result;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class QcmController extends Controller
{
    public function index(Request $request)
    {
        // list published QCMs for students, or all for teacher
        $user = $this->userFromRequest($request);
        if ($user && $user->role === 'teacher') {
            return Qcm::with('questions')->where('teacher_id', $user->id)->get();
        }
        return Qcm::with('questions')->where('published', true)->get();
    }

    public function store(Request $request)
    {
        try {
            $user = $this->userFromRequest($request);
            Log::info('QCM store called', ['user' => $user?->id, 'headers' => $request->headers->all()]);
            if (!$user || $user->role !== 'teacher') {
                Log::warning('QCM store forbidden', ['user' => $user?->id ?? null]);
                return response()->json(['error' => 'Forbidden'], 403);
            }

            $data = $request->validate([
                'title' => 'required|string',
                'subject' => 'nullable|string',
                'description' => 'nullable|string',
            ]);

            Log::info('QCM store payload', ['user' => $user->id, 'payload' => $data]);

            $qcm = Qcm::create(array_merge($data, ['teacher_id' => $user->id]));
            return response()->json($qcm, 201);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            Log::warning('QCM store validation failed', ['errors' => $ve->errors()]);
            return response()->json(['error' => 'Validation failed', 'details' => $ve->errors()], 422);
        } catch (\Exception $e) {
            Log::error('QCM store error: ' . $e->getMessage());
            return response()->json(['error' => 'Server error while creating QCM'], 500);
        }
    }

    public function show($id)
    {
        $qcm = Qcm::with('questions')->findOrFail($id);
        return $qcm;
    }

    public function update(Request $request, $id)
    {
        $user = $this->userFromRequest($request);
        $qcm = Qcm::findOrFail($id);
        if (!$user || $user->id !== $qcm->teacher_id) return response()->json(['error' => 'Forbidden'], 403);

        $qcm->update($request->only(['title','subject','description','published']));
        return $qcm;
    }

    public function destroy($id)
    {
        // Accept token-based auth from headers
        $request = request();
        $user = $this->userFromRequest($request);
        $qcm = Qcm::findOrFail($id);
        if (!$user || $user->id !== $qcm->teacher_id) return response()->json(['error' => 'Forbidden'], 403);
        $qcm->delete();
        return response()->json(['success' => true]);
    }

    public function addQuestion(Request $request, $id)
    {
        $user = $this->userFromRequest($request);
        $qcm = Qcm::findOrFail($id);
        if (!$user || $user->id !== $qcm->teacher_id) return response()->json(['error' => 'Forbidden'], 403);

        $data = $request->validate([
            'text' => 'required|string',
            'options' => 'required|array|min:3|max:5',
            'correct_answer' => 'required|string',
            'explanation' => 'nullable|string'
        ]);

        $question = Question::create(array_merge($data, ['qcm_id' => $qcm->id]));
        return response()->json($question, 201);
    }

    public function submit(Request $request, $id)
    {
        $user = $this->userFromRequest($request);
        if (!$user || $user->role !== 'student') return response()->json(['error' => 'Forbidden'], 403);

        $qcm = Qcm::with('questions')->findOrFail($id);
        $answers = $request->input('answers', []); // [{question_id, chosen_option}]

        $correct = 0;
        $feedback = [];
        foreach ($qcm->questions as $question) {
            $qid = $question->id;
            $submitted = collect($answers)->firstWhere('question_id', $qid);
            $chosen = $submitted['chosen_option'] ?? null;

            // store answer
            Answer::create(['student_id' => $user->id, 'question_id' => $qid, 'chosen_option' => $chosen]);

            $isCorrect = $chosen !== null && (string)$chosen === (string)$question->correct_answer;
            if ($isCorrect) $correct++;

            $feedback[] = [
                'question_id' => $qid,
                'correct' => $isCorrect,
                'correct_answer' => $question->correct_answer,
                'chosen' => $chosen,
                'explanation' => $question->explanation,
            ];
        }

        $score = count($qcm->questions) ? intval(round($correct / count($qcm->questions) * 100)) : 0;

        $result = Result::create([
            'student_id' => $user->id,
            'qcm_id' => $qcm->id,
            'score' => $score,
            'feedback' => $feedback,
        ]);

        return response()->json(['score' => $score, 'feedback' => $feedback, 'result_id' => $result->id]);
    }

    public function studentResults($studentId)
    {
        return Result::where('student_id', $studentId)->with('qcm')->get();
    }

    public function qcmResults($qcmId)
    {
        return Result::where('qcm_id', $qcmId)->with('student')->get();
    }

    protected function userFromRequest(Request $request)
    {
        $token = $request->header('Authorization');
        if (!$token) return null;
        $token = preg_replace('/^Bearer\s+/i', '', $token);
        return User::where('api_token', $token)->first();
    }
}
