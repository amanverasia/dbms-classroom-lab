-- Unit 4 operations, performance, locking, and backup fixtures.
CREATE TABLE IF NOT EXISTS ops_lab.accounts (
  id INT PRIMARY KEY,
  department VARCHAR(80) NOT NULL,
  budget DECIMAL(12,2) NOT NULL
) ENGINE=InnoDB;

TRUNCATE TABLE ops_lab.accounts;
INSERT INTO ops_lab.accounts (id, department, budget) VALUES
  (1, 'Cybersecurity Lab', 50000.00),
  (2, 'Database Systems Lab', 40000.00),
  (3, 'Student Scholarships', 75000.00),
  (4, 'Library Acquisitions', 30000.00);

CREATE TABLE IF NOT EXISTS backup_lab.fee_ledger (
  receipt_no INT PRIMARY KEY,
  student_name VARCHAR(100) NOT NULL,
  course_code VARCHAR(20) NOT NULL,
  amount DECIMAL(9,2) NOT NULL,
  recorded_on DATE NOT NULL
) ENGINE=InnoDB;

TRUNCATE TABLE backup_lab.fee_ledger;
INSERT INTO backup_lab.fee_ledger VALUES
  (5001, 'Aman Verma', 'MSCNS406', 6000.00, '2026-07-01'),
  (5002, 'Riya Sharma', 'MSCNS406', 4000.00, '2026-07-03'),
  (5003, 'Kabir Singh', 'MSCNS406', 2000.00, '2026-07-10'),
  (5004, 'Meera Nair', 'MSCNS406', 3500.00, '2026-07-15'),
  (5005, 'Zoya Khan', 'MSCNS406', 1000.00, '2026-08-01'),
  (5006, 'Dev Patel', 'MSCNS406', 4500.00, '2026-08-10'),
  (5007, 'Ananya Roy', 'MSCNS406', 5000.00, '2026-08-14'),
  (5008, 'Vikram Rao', 'MSCNS406', 3000.00, '2026-08-20');
