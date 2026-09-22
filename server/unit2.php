<?php
declare(strict_types=1);

function prepareUnit2(mysqli $db, bool $reset = false): string {
    $locked = (int)$db->query("SELECT GET_LOCK('classroom_unit2_setup', 5)")->fetch_row()[0];
    if ($locked !== 1) throw new RuntimeException('Unit 2 preparation is busy. Try again.');
    try {
        $marker = $db->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='sql_lab' AND TABLE_NAME='lesson_state'")->fetch_row()[0];
        if (!$reset && $marker && (int)$db->query('SELECT COUNT(*) FROM lesson_state WHERE fixture_version=1')->fetch_row()[0] === 1) {
            return 'Unit 2 dataset is ready. Existing edits were preserved.';
        }
        $existing = (int)$db->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='sql_lab'")->fetch_row()[0];
        if (!$reset && $existing > 0) throw new RuntimeException('An incomplete or existing SQL dataset was found. Use Reset Unit 2 data to rebuild the named lesson tables.');
        $db->multi_query(file_get_contents(__DIR__ . '/unit2-fixture.sql'));
        do { if ($result = $db->store_result()) $result->free(); } while ($db->more_results() && $db->next_result());
        return $reset ? 'Unit 2 lesson tables restored to their original sample records.' : 'Unit 2 sample tables are ready.';
    } finally {
        $db->query("SELECT RELEASE_LOCK('classroom_unit2_setup')");
    }
}

// CLI setup is used by start.command and is intentionally non-destructive.
if (PHP_SAPI === 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $db = new mysqli('mariadb', 'classroom_console', getenv('CONSOLE_PASSWORD') ?: 'console-local-demo', 'sql_lab');
    $db->set_charset('utf8mb4');
    echo prepareUnit2($db) . PHP_EOL;
}
