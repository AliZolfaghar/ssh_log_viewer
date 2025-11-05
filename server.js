import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import { geSshLogsSummary } from './lib/geSshLogsSummary.js';
import { initializeDatabase, userDB } from './lib/database.js';
import { authService } from './lib/auth.js';
import cookieParser from 'cookie-parser';

const app = express();
const port = 80;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Helper functions برای محاسبات
const countActiveUsers = (users) => {
  if (!users || !Array.isArray(users)) return 0;
  return users.filter(user => user.lastLogin).length;
};

const countAdmins = (users) => {
  if (!users || !Array.isArray(users)) return 0;
  return users.filter(user => user.role === 'admin').length;
};

// تعریف helpers برای Handlebars
const hbsHelpers = {
  // Helpers مقایسه
  gt: (a, b) => a > b,
  eq: (a, b) => a === b,
  lt: (a, b) => a < b,
  gte: (a, b) => a >= b,
  lte: (a, b) => a <= b,
  
  // Helper برای جدا کردن usernames با کاما
  splitUsernames: (usernames) => {
    if (!usernames) return [];
    if (typeof usernames !== 'string') return [];
    return usernames.split(',').map(username => username.trim()).filter(username => username !== '');
  },
  
  // Helper برای فرمت کردن تاریخ
  formatDate: (dateString) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  },
  
  // Helper برای فرمت کردن تاریخ به صورت مختصر
  shortDate: (dateString) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  },

  // Helper برای شمارش کاربران فعال
  countActiveUsers: (users) => {
    return countActiveUsers(users);
  },

  // Helper برای شمارش ادمین‌ها
  countAdmins: (users) => {
    return countAdmins(users);
  },

  // Helper برای گرفتن تاریخ و زمان فعلی
  now: () => {
    return new Date().toISOString();
  },
  
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
  },
  
  // helper برای چک کردن اینکه آیا آرایه خالی است یا نه
  isEmpty: (array) => {
    if (!array) return true;
    return array.length === 0;
  },
  
  // helper برای تبدیل به حروف بزرگ
  uppercase: (str) => {
    if (typeof str !== 'string') return str;
    return str.toUpperCase();
  },
  
  // helper برای تبدیل به حروف کوچک
  lowercase: (str) => {
    if (typeof str !== 'string') return str;
    return str.toLowerCase();
  }
};

app.engine('hbs', engine({
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  defaultLayout: 'main',
  helpers: hbsHelpers
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware برای بررسی احراز هویت
const requireAuth = async (req, res, next) => {
  const sessionId = req.cookies.sessionId;
  
  if (!sessionId) {
    return res.redirect('/login');
  }

  const verification = await authService.verifySession(sessionId);
  
  if (!verification.valid) {
    res.clearCookie('sessionId');
    return res.redirect('/login');
  }

  req.user = verification.user;
  req.session = verification.session;
  next();
};

// Route لاگین
app.get('/login', (req, res) => {
  res.render('login', { 
    layout: false,
    error: req.query.error 
  });
});

// پردازش لاگین
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const result = await authService.login(username, password, ip, userAgent);

    if (result.success) {
      res.cookie('sessionId', result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.redirect('/');
    } else {
      return res.render('login', {
        layout: false,
        error: result.message,
        username: username
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.render('login', {
      layout: false,
      error: 'Internal server error',
      username: username
    });
  }
});

// Route اصلی با احراز هویت
app.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await geSshLogsSummary();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    res.render('summary', {
      layout: 'main',
      rows,
      ip,
      user: req.user,
      activePage: 'dashboard'
    });
  } catch (error) {
    console.error('Error loading summary:', error);
    res.status(500).render('error', {
      layout: 'main',
      error: 'Failed to load statistics',
      user: req.user
    });
  }
});

// Route برای مدیریت کاربران
app.get('/admin/users', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).render('error', {
      layout: 'main',
      error: 'Access denied',
      user: req.user
    });
  }

  try {
    const users = await userDB.findAll();
    
    // محاسبه آمار برای پاس دادن به تمپلیت
    const activeUsersCount = countActiveUsers(users);
    const adminsCount = countAdmins(users);
    
    res.render('users', {
      layout: 'main',
      users,
      user: req.user,
      activePage: 'users',
      stats: {
        total: users.length,
        active: activeUsersCount,
        admins: adminsCount
      }
    });
  } catch (error) {
    console.error('Error loading users:', error);
    res.status(500).render('error', {
      layout: 'main',
      error: 'Failed to load users',
      user: req.user
    });
  }
});

// Route برای لاگ‌اوت
app.get('/logout', async (req, res) => {
  const sessionId = req.cookies.sessionId;
  
  if (sessionId) {
    await authService.logout(sessionId);
  }

  res.clearCookie('sessionId');
  res.redirect('/login');
});

// Route سلامت سیستم
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Route برای صفحه about
app.get('/about', requireAuth, (req, res) => {
  res.render('about', {
    layout: 'main',
    user: req.user,
    activePage: 'about'
  });
});

// مقداردهی اولیه و راه‌اندازی سرور
const startServer = async () => {
  try {
    await initializeDatabase();
    
    app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
      console.log(`🔐 Default login: admin / admin`);
      console.log(`💾 Database file: ${path.join(__dirname, 'data/db.json')}`);
      console.log(`📊 Dashboard: http://localhost:${port}/`);
      console.log(`🔑 Login page: http://localhost:${port}/login`);
      console.log(`👥 User management: http://localhost:${port}/admin/users`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();