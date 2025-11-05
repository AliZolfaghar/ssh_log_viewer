import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { geSshLogsSummary } from './lib/geSshLogsSummary.js'

const app = express();
const port = 80;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// تعریف helpers برای Handlebars
const hbsHelpers = {
  gt: (a, b) => a > b,
  eq: (a, b) => a === b,
  lt: (a, b) => a < b,
  gte: (a, b) => a >= b,
  lte: (a, b) => a <= b,
  // helper برای چک کردن وجود مقدار
  exists: (value) => value !== null && value !== undefined && value !== '',
  // helper برای فرمت کردن اعداد
  formatNumber: (num) => {
    if (typeof num !== 'number') return num;
    return new Intl.NumberFormat().format(num);
  },
  // helper برای محدود کردن طول متن
  truncate: (str, length) => {
    if (typeof str !== 'string') return str;
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  }
};

app.engine('hbs', engine({
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  defaultLayout: 'main',
  helpers: hbsHelpers  // اضافه کردن helpers به Handlebars
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
  const rows = await geSshLogsSummary();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  res.render('summary', {
    layout: 'main',
    rows,
    ip
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});