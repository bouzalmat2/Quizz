<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Qcm;
use App\Models\Question;
use App\Models\Answer;
use App\Models\Result;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class QcmController extends Controller
{
    public function index(Request $request)
    {
        // list published QCMs for students, or all for teacher
        $user = $this->userFromRequest($request);
        if ($user && $user->role === 'teacher') {
            return Qcm::with(['questions','subject'])->where('teacher_id', $user->id)->get();
        }
        return Qcm::with(['questions','subject'])->where('published', true)->get();
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

            $rules = [
                'title' => 'required|string',
                'subject_id' => 'nullable|exists:subjects,id',
                'description' => 'nullable|string',
                'published' => 'nullable|boolean',
                'duration' => 'nullable|integer|min:1',
                'difficulty' => 'nullable|string|in:easy,medium,hard',
                'max_attempts' => 'nullable|integer|min:1',
                'start_at' => 'nullable|date',
                'end_at' => 'nullable|date',
                'passing_score' => 'nullable|integer|min:0|max:100'
            ];

            $validator = Validator::make($request->all(), $rules);
            if ($validator->fails()) {
                return response()->json(['error' => 'Validation failed', 'details' => $validator->errors()], 422);
            }

            $data = $validator->validated();

            // additional check: if both dates provided, ensure end_at is after start_at
            if (!empty($data['start_at']) && !empty($data['end_at'])) {
                if (strtotime($data['end_at']) <= strtotime($data['start_at'])) {
                    return response()->json(['error' => 'Validation failed', 'details' => ['end_at' => ['End date must be after start date']]] , 422);
                }
            }

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

        // validate update payload similarly to store
        $rules = [
            'title' => 'sometimes|required|string',
            'subject_id' => 'nullable|exists:subjects,id',
            'description' => 'nullable|string',
            'published' => 'nullable|boolean',
            'duration' => 'nullable|integer|min:1',
            'difficulty' => 'nullable|string|in:easy,medium,hard',
            'max_attempts' => 'nullable|integer|min:1',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date',
            'passing_score' => 'nullable|integer|min:0|max:100'
        ];

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['error' => 'Validation failed', 'details' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        if (!empty($data['start_at']) && !empty($data['end_at'])) {
            if (strtotime($data['end_at']) <= strtotime($data['start_at'])) {
                return response()->json(['error' => 'Validation failed', 'details' => ['end_at' => ['End date must be after start date']]] , 422);
            }
        }

        $qcm->update($data);
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
            'explanation' => 'nullable|string',
            'difficulty' => 'nullable|string',
        ]);

        // Persist teacher_id and difficulty on questions created inside a QCM
        $question = Question::create(array_merge($data, [
            'qcm_id' => $qcm->id,
            'teacher_id' => $qcm->teacher_id,
            'difficulty' => $data['difficulty'] ?? null,
        ]));
        return response()->json($question, 201);
    }

    public function submit(Request $request, $id)
    {
        $user = $this->userFromRequest($request);
        if (!$user || $user->role !== 'student') return response()->json(['error' => 'Forbidden'], 403);

        $qcm = Qcm::with('questions')->findOrFail($id);
        $answers = $request->input('answers', []); // [{question_id, chosen_option}]

        // Prevent duplicate submissions: if a result for this student and qcm was created very recently,
        // return it instead of creating a new one. This avoids double-counting when auto-submit triggers
        // twice (client + timer race) or the student accidentally re-submits quickly.
        $recentWindowSeconds = 10;
        $recent = Result::where('student_id', $user->id)
            ->where('qcm_id', $qcm->id)
            ->where('created_at', '>=', now()->subSeconds($recentWindowSeconds))
            ->orderByDesc('created_at')
            ->first();

        if ($recent) {
            // Return the existing recent result to the client
            return response()->json([
                'score' => $recent->score,
                'feedback' => $recent->feedback,
                'result_id' => $recent->id,
                'passed' => $recent->passed ?? ($recent->score >= ($qcm->passing_score ?? 50)),
                'duration' => $recent->duration,
            ]);
        }

        $correct = 0;
        $feedback = [];
        foreach ($qcm->questions as $question) {
            $qid = $question->id;
            $submitted = collect($answers)->firstWhere('question_id', $qid);
            // normalize chosen option: treat empty string or missing as null for grading
            $chosen = isset($submitted['chosen_option']) && trim((string)$submitted['chosen_option']) !== '' ? $submitted['chosen_option'] : null;

            // store answer - persist non-null or empty string to satisfy non-null DB column
            $storedChosen = $chosen !== null ? $chosen : '';
            Answer::create(['student_id' => $user->id, 'question_id' => $qid, 'chosen_option' => $storedChosen]);

            // correct only when a non-empty choice equals the correct answer
            $isCorrect = $chosen !== null && (string)trim((string)$chosen) === (string)$question->correct_answer;
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

        // Determine pass/fail using qcm.passing_score (fallback to 50 if not set)
        $passing = isset($qcm->passing_score) && $qcm->passing_score !== null ? intval($qcm->passing_score) : 50;
        $passed = $score >= $passing;

        $duration = $request->input('duration', null); // seconds

        $result = Result::create([
            'student_id' => $user->id,
            'qcm_id' => $qcm->id,
            'score' => $score,
            'feedback' => $feedback,
            'passed' => $passed,
            'duration' => $duration,
        ]);

        return response()->json([
            'score' => $score,
            'feedback' => $feedback,
            'result_id' => $result->id,
            'passed' => $passed,
            'duration' => $duration,
        ]);
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
