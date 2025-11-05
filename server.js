import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { parseSshLogs } from './parseSshLogs.js';

const app = express();
const port = 80;
const DB_PATH = './ssh_logs.db';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbExists = fs.existsSync(DB_PATH);
const db = new Database(DB_PATH);

if (!dbExists) {
  console.log('📦 دیتابیس وجود ندارد، در حال ساخت...');
  db.exec(`
    CREATE TABLE ssh_logs (
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
  insert.run('success', new Date().toISOString(), 'admin', '192.168.1.10', 22, 'password');
  insert.run('failure', new Date().toISOString(), 'root', '192.168.1.20', 22, 'publickey');
  console.log('✅ جدول ساخته شد و داده تستی وارد شد.');
}

app.engine('hbs', engine({
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  defaultLayout: 'main'
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  // parseSshLogs();
  const logs = db.prepare('SELECT * FROM ssh_logs ORDER BY timestamp DESC').all();
  res.render('index', {
    layout: 'main',
    logs,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});