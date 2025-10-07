<?php
$data = [
    'email' => 'e2e_direct_user@example.com',
    'password' => 'Secret123!'
];
$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
        'ignore_errors' => true,
    ],
];
$context  = stream_context_create($options);
$url = 'http://127.0.0.1:8000/api/login';
$result = @file_get_contents($url, false, $context);
if ($result === false) {
    echo "Request failed.\n";
    if (!empty($http_response_header)) {
        echo implode("\n", $http_response_header) . "\n";
    }
    exit(1);
}
// Print response headers and body
if (!empty($http_response_header)) {
    echo "RESPONSE_HEADERS:\n";
    echo implode("\n", $http_response_header) . "\n\n";
}
echo "RESPONSE_BODY:\n";
echo $result . "\n";
