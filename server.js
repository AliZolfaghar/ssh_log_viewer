import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { geSshLogsSummary } from './lib/geSshLogsSummary.js'

const app = express();
const port = 80;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.engine('hbs', engine({
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  defaultLayout: 'main'
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