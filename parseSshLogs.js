import fs from 'fs';
import readline from 'readline';
import Database from 'better-sqlite3';
import os from 'os';

export function parseSshLogs() {
  const isLinux = process.platform === 'linux';
  const logPath = isLinux ? '/var/log/auth.log' : null;

  if (!isLinux || !fs.existsSync(logPath)) {
    console.warn('⛔ این فانکشن فقط روی لینوکس قابل اجراست و مسیر لاگ پیدا نشد.');
    return;
  }

  const db = new Database('./ssh_logs.db');
  db.exec(`
    CREATE TABLE IF NOT EXISTS ssh_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT,
      timestamp TEXT,
      username TEXT,
      ip TEXT,
      port INTEGER,
      method TEXT
    )
  `);

  const insert = db.prepare(`
    INSERT INTO ssh_logs (status, timestamp, username, ip, port, method)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const accepted = /Accepted (\w+) for (\w+) from ([\d.]+) port (\d+)/;
  const failed = /Failed (\w+) for (invalid user )?(\w+) from ([\d.]+) port (\d+)/;

  const rl = readline.createInterface({
    input: fs.createReadStream(logPath),
    crlfDelay: Infinity
  });

  rl.on('line', line => {
    const timestampStr = line.slice(0, 15);
    const now = new Date();
    const timestamp = new Date(`${timestampStr} ${now.getFullYear()}`);

    if (line.includes('Accepted')) {
      const match = accepted.exec(line);
      if (match) {
        const [_, method, user, ip, port] = match;
        insert.run('success', timestamp.toISOString(), user, ip, parseInt(port), method);
      }
    } else if (line.includes('Failed')) {
      const match = failed.exec(line);
      if (match) {
        const [_, method, invalid, user, ip, port] = match;
        insert.run('failure', timestamp.toISOString(), user, ip, parseInt(port), method);
      }
    }
  });

  rl.on('close', () => {
    console.log('✅ لاگ‌های SSH ثبت شدند.');
  });
}
