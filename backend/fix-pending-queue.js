const mariadb = require('mariadb');
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'siap_prioritas',
  connectionLimit: 1,
});

(async () => {
  const conn = await pool.getConnection();
  try {
    const columns = await conn.query("SHOW COLUMNS FROM reservations LIKE 'application_code'");
    if (columns.length === 0) {
      await conn.query("ALTER TABLE reservations ADD COLUMN application_code VARCHAR(191) NOT NULL DEFAULT 'TEMP'");
      console.log('added application_code column with temp default');
    }

    const rows = await conn.query("SELECT id FROM reservations WHERE application_code IS NULL OR TRIM(application_code) = '' OR application_code = 'TEMP'");
    for (const row of rows) {
      const code = 'APP-' + Date.now() + '-' + Math.random().toString(16).slice(2, 10).toUpperCase();
      await conn.query('UPDATE reservations SET application_code = ? WHERE id = ?', [code, row.id]);
    }

    await conn.query("UPDATE reservations SET queue_number = NULL WHERE status = 'PENDING' AND queue_number IS NOT NULL");

    const indexes = await conn.query("SHOW INDEX FROM reservations WHERE Key_name = 'application_code_unique'");
    if (indexes.length === 0) {
      await conn.query('ALTER TABLE reservations ADD UNIQUE INDEX application_code_unique (application_code)');
      console.log('added unique index');
    }

    await conn.query('ALTER TABLE reservations MODIFY application_code VARCHAR(191) NOT NULL');

    const summary = await conn.query("SELECT COUNT(*) AS total_pending_with_queue FROM reservations WHERE status='PENDING' AND queue_number IS NOT NULL");
    const sample = await conn.query("SELECT id, status, queue_number, application_code FROM reservations ORDER BY created_at DESC LIMIT 10");
    console.log('pendingWithQueue=' + Number(summary[0].total_pending_with_queue));
    console.log(JSON.stringify(sample, null, 2));
  } finally {
    conn.release();
    await pool.end();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
