<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\QcmController;
use App\Models\Subject;

echo "Starting smoke test: teacher -> create QCM -> add question -> student -> submit\n";

$mode = getenv('MODE') ?: 'full';

// Register teacher
$auth = new AuthController();
$unique = time();
$req = Request::create('/api/register', 'POST', [
    'name' => 'Smoke Teacher',
    'email' => "smoke.teacher+{$unique}@example.test",
    'password' => 'password',
    'role' => 'teacher'
]);
$res = $auth->register($req);
$data = json_decode($res->getContent(), true);
if (empty($data['data']['api_token'])) {
    echo "Failed to register teacher:\n" . $res->getContent() . PHP_EOL;
    exit(1);
}
$teacherToken = $data['data']['api_token'];
echo "Teacher registered, token: " . substr($teacherToken,0,8) . "...\n";

// find a subject id
$subject = Subject::first();
if (!$subject) {
    echo "No subject found, aborting.\n";
    exit(1);
}

// Create QCM as teacher
$qcmController = new QcmController();
$payload = [
    'title' => 'Smoke Test QCM',
    'subject_id' => $subject->id,
    'description' => 'QCM created by smoke test',
    'published' => true,
    'duration' => 10,
    'difficulty' => 'easy',
    'max_attempts' => 3,
    'passing_score' => 50
];
$req = Request::create('/api/qcms', 'POST', $payload);
$req->headers->set('Authorization', 'Bearer ' . $teacherToken);
$res = $qcmController->store($req);
$created = json_decode($res->getContent(), true);
if (empty($created['id']) && empty($created['data'])) {
    // controller returns the model or json depending on context
    $qcm = is_array($created) && isset($created['data']) ? $created['data'] : $created;
} else {
    $qcm = isset($created['data']) ? $created['data'] : $created;
}

// Handle model return (when controller returned model directly)
if (is_numeric($qcm) || is_null($qcm)) {
    echo "Unexpected QCM create response: ";
    var_export($created);
    exit(1);
}

$qcmId = $qcm['id'] ?? $qcm->id ?? null;
echo "QCM created with id: $qcmId\n";

// Add a question to the QCM
$questionData = [
    'text' => 'What is 1+1?',
    'options' => ['1','2','3','4'],
    'correct_answer' => '2',
    'explanation' => 'Basic math',
    'difficulty' => 'easy'
];
$req = Request::create("/api/qcms/{$qcmId}/questions", 'POST', $questionData);
$req->headers->set('Authorization', 'Bearer ' . $teacherToken);
$questionRes = $qcmController->addQuestion($req, $qcmId);
$question = json_decode($questionRes->getContent(), true);
$questionId = $question['id'] ?? $question['data']['id'] ?? ($question->id ?? null);
echo "Question added with id: $questionId\n";

$req = Request::create('/api/register', 'POST', [
    'name' => 'Smoke Student',
    'email' => "smoke.student+{$unique}@example.test",
    'password' => 'password',
    'role' => 'student'
]);
$res = $auth->register($req);
$data = json_decode($res->getContent(), true);
$studentToken = $data['data']['api_token'] ?? null;
echo "Student registered, token: " . substr($studentToken,0,8) . "...\n";

// Student fetches available qcms
$req = Request::create('/api/qcms', 'GET');
$req->headers->set('Authorization', 'Bearer ' . $studentToken);
$qcmsRes = $qcmController->index($req);
echo "Available QCMs for student:\n";
print_r(is_string($qcmsRes) ? $qcmsRes : (is_array($qcmsRes) ? $qcmsRes : (method_exists($qcmsRes,'toArray') ? $qcmsRes->toArray() : $qcmsRes)));

$mode = $mode ?? 'full';
// Student submits answers
if ($mode === 'empty') {
    // simulate timeout / no answers
    $answers = [];
} else if ($mode === 'partial') {
    // simulate unanswered questions mixed in - for single question QCM this is same as empty
    $answers = [];
} else if ($mode === 'double') {
    // default payload for double submit test
    $answers = [ ['question_id' => $questionId, 'chosen_option' => '2'] ];
} else {
    // default: choose the correct answer
    $answers = [ ['question_id' => $questionId, 'chosen_option' => '2'] ];
}
$req = Request::create("/api/qcms/{$qcmId}/submit", 'POST', ['answers' => $answers]);
$req->headers->set('Authorization', 'Bearer ' . $studentToken);
$submitRes = $qcmController->submit($req, $qcmId);
$submitData = json_decode($submitRes->getContent(), true);
echo "Student submission result:\n";
print_r($submitData);

if ($mode === 'double') {
    echo "--- Performing second immediate submit to simulate duplicate auto-submit...\n";
    $req2 = Request::create("/api/qcms/{$qcmId}/submit", 'POST', ['answers' => $answers]);
    $req2->headers->set('Authorization', 'Bearer ' . $studentToken);
    $submitRes2 = $qcmController->submit($req2, $qcmId);
    $submitData2 = json_decode($submitRes2->getContent(), true);
    echo "Second submission result:\n";
    print_r($submitData2);
}

echo "Smoke test completed.\n";
