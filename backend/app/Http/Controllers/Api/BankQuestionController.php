<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Qcm;
use App\Models\Question;
use Illuminate\Support\Facades\Schema;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class BankQuestionController extends Controller
{
    protected function userFromRequest(Request $request)
    {
        $token = $request->header('Authorization');
        if (!$token) return null;
        $token = preg_replace('/^Bearer\s+/i', '', $token);
        return User::where('api_token', $token)->first();
    }

    public function index(Request $request)
    {
        $user = $this->userFromRequest($request);
        if (!$user || $user->role !== 'teacher') return response()->json(['error' => 'Forbidden'], 403);
        return Question::whereNull('qcm_id')->where('teacher_id', $user->id)->get();
    }

    public function store(Request $request)
    {
        $user = $this->userFromRequest($request);
        if (!$user || $user->role !== 'teacher') return response()->json(['error' => 'Forbidden'], 403);

        $data = $request->validate([
            'text' => 'required|string',
            'options' => 'required|array|min:2|max:6',
            'correct_answer' => 'required|string',
            'explanation' => 'nullable|string',
            'difficulty' => 'nullable|string',
            'image_url' => 'nullable|url',
        ]);

        $data['teacher_id'] = $user->id;
        // create a question row that acts as a bank item (qcm_id = NULL)
        $data['teacher_id'] = $user->id;
        $data['qcm_id'] = null;
        $q = Question::create($data);
        return response()->json($q, 201);
    }

    public function show(Request $request, $id)
    {
        $user = $this->userFromRequest($request);
        $q = Question::findOrFail($id);

        if (!$user || $q->teacher_id !== $user->id) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        return response()->json($q, 200);
    }

    public function update(Request $request, $id)
    {
        $user = $this->userFromRequest($request);
        $q = Question::findOrFail($id);
        if (!$user || $q->teacher_id !== $user->id) return response()->json(['message' => 'Not authorized'], 403);

        $data = $request->validate([
            'text' => 'nullable|string',
            'options' => 'nullable|array|min:2|max:6',
            'correct_answer' => 'nullable|string',
            'explanation' => 'nullable|string',
            'difficulty' => 'nullable|string',
            'image_url' => 'nullable|url',
        ]);

        $q->update($data);
        return response()->json($q, 200);
    }

    public function destroy(Request $request, $id)
    {
        $user = $this->userFromRequest($request);
        $q = Question::findOrFail($id);
        if (!$user || $q->teacher_id !== $user->id) return response()->json(['message' => 'Not authorized'], 403);

        $attachedTo = $q->qcm_id;
        $q->delete();

        if ($attachedTo !== null) {
            return response()->json(['message' => 'Question deleted from QCM and bank'], 200);
        }

        return response()->json(['message' => 'Question deleted'], 200);
    }

    // copy a bank question into a given QCM as a real question
    public function attachToQcm(Request $request, $bankQuestionId, $qcmId)
    {
        $user = $this->userFromRequest($request);
        if (!$user || $user->role !== 'teacher') return response()->json(['error' => 'Forbidden'], 403);

        // Attach by updating the existing bank question's qcm_id so it's moved into the QCM
        $bq = Question::findOrFail($bankQuestionId);
        // allow attaching even if already attached (it will move). If you want to prevent re-attaching, check is_null(qcm_id)
        $qcm = Qcm::findOrFail($qcmId);
        if ($qcm->teacher_id !== $user->id) return response()->json(['error' => 'Forbidden'], 403);
        if ($bq->teacher_id !== $user->id) return response()->json(['error' => 'Forbidden'], 403);

        $bq->qcm_id = $qcm->id;
        $bq->save();

        return response()->json($bq, 200);
    }

    // Unassign a question from its QCM (set qcm_id = NULL)
    public function unassignFromQcm(Request $request, $bankQuestionId)
    {
        $user = $this->userFromRequest($request);
        if (!$user || $user->role !== 'teacher') return response()->json(['error' => 'Forbidden'], 403);

        $bq = Question::findOrFail($bankQuestionId);
        if ($bq->teacher_id !== $user->id) return response()->json(['error' => 'Forbidden'], 403);

        // allow unassign only if currently attached
        if (is_null($bq->qcm_id)) return response()->json(['error' => 'Question is not assigned to a QCM'], 400);

        $bq->qcm_id = null;
        $bq->save();

        return response()->json($bq, 200);
    }
}
