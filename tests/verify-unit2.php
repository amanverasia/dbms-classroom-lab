<?php
declare(strict_types=1);
// This rehearsal resets named Unit 2 lesson objects. Require explicit opt-in.
if (getenv('RUN_UNIT2_RESET') !== '1') {
    fwrite(STDERR, "Set RUN_UNIT2_RESET=1 to rehearse and reset the disposable Unit 2 dataset.\n");
    exit(1);
}
function callApi(string $path, array $body): array {
    $curl = curl_init('http://127.0.0.1:8080/api/' . $path);
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_POST=>true, CURLOPT_HTTPHEADER=>['Content-Type: application/json'], CURLOPT_POSTFIELDS=>json_encode($body), CURLOPT_TIMEOUT=>15]);
    $raw = curl_exec($curl);
    if ($raw === false) throw new RuntimeException(curl_error($curl));
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    return [$status, json_decode($raw, true, 512, JSON_THROW_ON_ERROR)];
}
function sql(string $query, string $database='sql_lab'): array { return callApi('query', ['sql'=>$query,'database'=>$database]); }
function check(bool $condition, string $message): void { if (!$condition) throw new RuntimeException('FAIL: '.$message); echo 'PASS: '.$message.PHP_EOL; }
function ok(array $response, string $message): array { check($response[0]===200, $message.' '.($response[1]['error']??'')); return $response[1]; }

$source = file_get_contents('http://teacher-console/lessons-unit2.js');
if (!preg_match('/COURSE\.sections\.push\(\.\.\.(\[.*\])\.map\(section =>/s', $source, $match)) throw new RuntimeException('Cannot read Unit 2 lesson registry.');
$sections = json_decode($match[1], true, 512, JSON_THROW_ON_ERROR);
check(count($sections)===7 && array_sum(array_column($sections,'minutes'))===600, 'Seven sections total 600 teaching minutes');
$steps = array_merge(...array_column($sections,'steps'));
check(count($steps)===46 && count(array_unique(array_column($steps,'id')))===46, '46 unique Unit 2 teaching steps');
$baseline = ok(sql('SELECT * FROM students ORDER BY id','college_demo'),'Read Unit 1 baseline')['rows'];
ok(callApi('reset-unit2',['database'=>'sql_lab']),'Reset the named Unit 2 fixture');
$guard='verify_guard_'.bin2hex(random_bytes(5));
$created=false;
$examples=0;
try {
    ok(sql("CREATE TABLE $guard (id INT PRIMARY KEY)"),'Create an unrelated test table');
    $created=true;
    ok(sql("INSERT INTO $guard VALUES (42)"),'Store unrelated test data');
    foreach($steps as $step) {
        check(isset($step['question'],$step['answer'],$step['notes']),'Teaching guidance: '.$step['id']);
        if($step['type']!=='query')continue;
        $response=sql($step['sql']);
        $examples++;
        if(isset($step['expectedError'])) {
            check($response[0]===400 && $response[1]['code']===$step['expectedError'],'Intended SQL error: '.$step['id']);
        } else {
            $result=ok($response,'Query runs: '.$step['id']);
            if(isset($step['expectedRows']))check($result['count']===$step['expectedRows'],'Expected row count: '.$step['id']);
            if(isset($step['expectedValues']))check(array_map(fn($r)=>array_map('strval',$r),$result['rows'])===array_map(fn($r)=>array_map('strval',$r),$step['expectedValues']),'Exact aggregate values: '.$step['id']);
        }
        foreach($step['presets']??[] as [$name,$query]) {
            $result=sql($query);
            $examples++;
            if($step['id']==='sql-constraint-errors')check($result[0]===400,'Intended preset rejection: '.$name);
            else ok($result,'Preset: '.$name);
        }
        if(isset($step['inspectSql'])){ok(sql($step['inspectSql']),'Inspection: '.$step['id']);$examples++;}
        if($step['id']==='sql-missing-where') {
            check(ok(sql('SELECT COUNT(*) FROM student_edits'),'Inspect empty edit table')['rows'][0][0]==0,'Missing WHERE removes all edit-copy rows');
            ok(callApi('reset-edit-copy',['database'=>'sql_lab']),'Restore edit copy');
            check(ok(sql('SELECT COUNT(*) FROM student_edits'),'Inspect restored copy')['rows'][0][0]==6,'Edit reset restores six records');
        }
    }
    $payment=ok(sql('SELECT s.id,COALESCE(p.total,0) AS paid FROM students s LEFT JOIN (SELECT student_id,SUM(amount) AS total FROM payments GROUP BY student_id) p ON p.student_id=s.id ORDER BY s.id'),'Verify payment-report meaning');
    check(array_map(fn($row)=>(float)$row[1],$payment['rows'])===[6000.0,4000.0,2000.0,0.0,1000.0,0.0],'Per-student payment totals are not multiplied by enrollments');
    ok(sql("UPDATE student_edits SET city='Rehearsal' WHERE id=1"),'Make an edit before non-destructive prepare');
    ok(callApi('prepare-unit2',['database'=>'sql_lab']),'Prepare an existing dataset');
    check(ok(sql('SELECT city FROM student_edits WHERE id=1'),'Read retained edit')['rows']===[['Rehearsal']],'Preparing preserves existing edits');
    ok(callApi('reset-unit2',['database'=>'sql_lab']),'Reset for the next class');
    check(ok(sql("SELECT * FROM $guard"),'Read unrelated table after reset')['rows'][0][0]==42,'Unrelated Unit 2 tables survive reset');
    check(ok(sql('SELECT * FROM students ORDER BY id','college_demo'),'Read Unit 1 after reset')['rows']===$baseline,'Unit 1 dataset is unchanged');
    echo "Rehearsed $examples SQL statements and presets.\n";
} finally {
    if($created)sql("DROP TABLE $guard");
}
