<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\QcmController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// profile routes (token-based auth in headers)
Route::get('/profile', [AuthController::class, 'profile']);
Route::put('/profile', [AuthController::class, 'updateProfile']);
// Allow POST for multipart/form-data file uploads from clients
Route::post('/profile', [AuthController::class, 'updateProfile']);
Route::post('/profile/password', [AuthController::class, 'changePassword']);

// QCM endpoints
Route::get('/qcms', [QcmController::class, 'index']);
Route::post('/qcms', [QcmController::class, 'store']);
Route::get('/qcms/{id}', [QcmController::class, 'show']);
Route::put('/qcms/{id}', [QcmController::class, 'update']);
Route::delete('/qcms/{id}', [QcmController::class, 'destroy']);
Route::post('/qcms/{id}/questions', [QcmController::class, 'addQuestion']);
Route::post('/qcms/{id}/submit', [QcmController::class, 'submit']);
Route::get('/results/student/{id}', [QcmController::class, 'studentResults']);
Route::get('/results/qcm/{id}', [QcmController::class, 'qcmResults']);
