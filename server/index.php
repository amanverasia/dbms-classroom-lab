<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function reply(array $body, int $status = 200): never {
    http_response_code($status);
    echo json_encode($body, JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
function connectDb(string $database): mysqli {
    $db = new mysqli('mariadb', 'classroom_console', getenv('CONSOLE_PASSWORD') ?: 'console-local-demo', $database);
    $db->set_charset('utf8mb4');
    $db->query('SET SESSION max_statement_time=3');
    return $db;
}
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
try {
    if ($path === '/api/health') {
        $db = connectDb('college_demo');
        reply(['ok' => true, 'engine' => 'MariaDB', 'version' => $db->server_info]);
    }
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(['error' => 'POST required.'], 405);
    // Requests come through the same-origin console proxy. Reject cross-site form submissions.
    if (!str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) reply(['error' => 'JSON required.'], 415);
    if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') reply(['error' => 'Use the local classroom console.'], 403);
    $input = json_decode(file_get_contents('php://input'), true, 16, JSON_THROW_ON_ERROR);
    $database = $input['database'] ?? 'college_demo';
    if (!in_array($database, ['college_demo', 'classroom_practice'], true)) reply(['error' => 'Choose a classroom database.'], 400);
    $db = connectDb($database);
    if ($path === '/api/reset-practice') {
        // Only this disposable lesson table is reset; unrelated tables and seed data remain intact.
        $db = connectDb('classroom_practice');
        $db->query('DROP TABLE IF EXISTS lab_students');
        reply(['ok' => true, 'message' => 'lab_students removed. Ready to repeat the CREATE TABLE step.']);
    }
    if ($path !== '/api/query') reply(['error' => 'Unknown endpoint.'], 404);
    $sql = trim((string)($input['sql'] ?? ''));
    if ($sql === '' || strlen($sql) > 12000) reply(['error' => 'Enter one SQL statement (up to 12,000 characters).'], 400);
    // mysqli::query executes one statement. Database grants enforce access even for qualified names.
    $started = microtime(true);
    $result = $db->query($sql);
    $elapsed = round((microtime(true) - $started) * 1000, 2);
    if ($result instanceof mysqli_result) {
        $columns = array_map(fn($field) => $field->name, $result->fetch_fields());
        $rows = [];
        while (count($rows) < 200 && ($row = $result->fetch_row()) !== null) $rows[] = $row;
        reply(['columns' => $columns, 'rows' => $rows, 'count' => $result->num_rows, 'truncated' => $result->num_rows > 200, 'ms' => $elapsed]);
    }
    reply(['columns' => [], 'rows' => [], 'affected' => $db->affected_rows, 'ms' => $elapsed, 'message' => 'Statement completed.']);
} catch (mysqli_sql_exception $error) {
    reply(['error' => $error->getMessage(), 'code' => $error->getCode()], 400);
} catch (Throwable $error) {
    reply(['error' => 'The classroom service could not handle this request. Check that the Docker lab is ready.'], 500);
}
