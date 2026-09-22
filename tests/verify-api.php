<?php
// Run inside the classroom-api container, never on the host runtime.
declare(strict_types=1);
function request(string $path, ?array $body = null): array {
    $curl = curl_init('http://127.0.0.1:8080/api/' . $path);
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15]);
    if ($body !== null) curl_setopt_array($curl, [CURLOPT_POST => true, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_POSTFIELDS => json_encode($body)]);
    $raw = curl_exec($curl);
    if ($raw === false) throw new RuntimeException(curl_error($curl));
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    return [$status, json_decode($raw, true, 512, JSON_THROW_ON_ERROR)];
}
function sql(string $sql, string $db = 'classroom_practice'): array { return request('query', ['sql' => $sql, 'database' => $db]); }
function check(bool $condition, string $message): void { if (!$condition) throw new RuntimeException('FAIL: ' . $message); echo "PASS: $message\n"; }
$table = 'verify_' . bin2hex(random_bytes(5));
$created = false;
try {
    [$status, $health] = request('health');
    check($status === 200 && $health['ok'], 'MariaDB health through the lesson service');
    [$status, $baseline] = sql('SELECT COUNT(*) FROM students', 'college_demo');
    check($status === 200 && (int)$baseline['rows'][0][0] === 5, 'College seed contains five students');
    [$status, $empty] = sql('SELECT id, name FROM students WHERE id < 0', 'college_demo');
    check($status === 200 && $empty['columns'] === ['id', 'name'] && $empty['rows'] === [], 'Empty results retain their column names');
    [$status, $result] = sql('SELECT 1 AS same, 2 AS same');
    check($status === 200 && $result['columns'] === ['same','same'] && array_map('intval', $result['rows'][0]) === [1,2], 'Duplicate result labels preserve both values');
    [$status] = sql('SELECT 1; SELECT 2;');
    check($status === 400, 'Multiple SQL statements are rejected in one request');
    [$status] = sql('UPDATE college_demo.students SET age=25 WHERE id=-1');
    check($status === 400, 'Console cannot update seed tables through qualified names');
    [$status] = sql('SELECT User FROM mysql.user');
    check($status === 400, 'Console cannot read system accounts');
    [$status] = sql("CREATE TABLE $table (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL, email VARCHAR(120) UNIQUE, age INT CHECK(age >= 16))");
    check($status === 200, 'Practice table creation');
    $created = true;
    [$status] = sql("INSERT INTO $table (name,email,age) VALUES ('Aman','test@example.com',25),('Riya','second@example.com',19)");
    check($status === 200, 'Practice row insertion');
    [$status, $filtered] = sql("SELECT name FROM $table WHERE age > 20 ORDER BY id");
    check($status === 200 && $filtered['rows'] === [['Aman']], 'Filtering runs against inserted records');
    foreach (["('Duplicate','test@example.com',25)", "('Invalid age','age@example.com',12)", "(NULL,'null@example.com',22)"] as $values) {
        [$status] = sql("INSERT INTO $table (name,email,age) VALUES $values");
        check($status === 400, 'Constraint rejects ' . $values);
    }
    [$status, $count] = sql("SELECT COUNT(*) FROM $table");
    check($status === 200 && (int)$count['rows'][0][0] === 2, 'Rejected rows were not inserted');
    if (getenv('RUN_RESET_CHECK') === '1') {
        // Opt-in reset of the designated disposable lesson table.
        [$status] = request('reset-practice', ['database' => 'classroom_practice']);
        check($status === 200, 'Scoped reset completes');
        [$status] = sql('SELECT * FROM lab_students');
        check($status === 400, 'Reset removes the designated lesson table');
        [$status, $guard] = sql("SELECT COUNT(*) FROM $table");
        check($status === 200 && (int)$guard['rows'][0][0] === 2, 'Other practice tables survive reset');
        [$status, $after] = sql('SELECT COUNT(*) FROM students', 'college_demo');
        check($status === 200 && $after['rows'] === $baseline['rows'], 'College seed survives reset');
    }
    echo "API verification complete.\n";
} finally {
    // Only the unique table created by this test run is cleaned up.
    if ($created) sql("DROP TABLE $table");
}
