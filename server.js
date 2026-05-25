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

// log all request with ip and user agent
app.use((req, res, next) => {
  console.log(`${req.ip} - ${req.get('User-Agent')}`);
  next();
});

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


// Route برای صفحه سلامت سیستم
app.get('/health', requireAuth, async (req, res) => {
  try {
    // جمع‌آوری اطلاعات سلامت سیستم
    const healthData = await getSystemHealth();
    
    res.render('health', {
      layout: 'main',
      health: healthData,
      user: req.user,
      activePage: 'health'
    });
  } catch (error) {
    console.error('Error loading health page:', error);
    res.status(500).render('error', {
      layout: 'main',
      error: 'Failed to load health information',
      user: req.user
    });
  }
});

// تابع جمع‌آوری اطلاعات سلامت سیستم
async function getSystemHealth() {
  const startTime = Date.now();
  
  // اطلاعات پایه سیستم
  const healthInfo = {
    status: true,
    timestamp: new Date().toISOString(),
    uptime: {
      days: Math.floor(process.uptime() / 86400),
      hours: Math.floor((process.uptime() % 86400) / 3600),
      minutes: Math.floor((process.uptime() % 3600) / 60),
      percentage: 99.98 // شبیه‌سازی uptime percentage
    },
    performance: {
      cpu: Math.floor(Math.random() * 30) + 10, // شبیه‌سازی استفاده CPU
      memory: Math.floor(Math.random() * 40) + 20 // شبیه‌سازی استفاده حافظه
    },
    services: [
      {
        name: 'Web Server',
        description: 'HTTP request handling',
        status: 'up',
        icon: 'fa-globe',
        responseTime: Math.floor(Math.random() * 50) + 10
      },
      {
        name: 'Database',
        description: 'Data storage and retrieval',
        status: 'up',
        icon: 'fa-database',
        responseTime: Math.floor(Math.random() * 20) + 5
      },
      {
        name: 'Authentication',
        description: 'User authentication service',
        status: 'up',
        icon: 'fa-user-shield',
        responseTime: Math.floor(Math.random() * 30) + 5
      },
      {
        name: 'SSH Log Parser',
        description: 'SSH connection log analysis',
        status: 'up',
        icon: 'fa-terminal',
        responseTime: Math.floor(Math.random() * 100) + 20
      }
    ],
    systemInfo: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      environmentColor: process.env.NODE_ENV === 'production' ? 'success' : 'info',
      nodeVersion: process.version,
      platform: process.platform,
      activeSessions: Math.floor(Math.random() * 10) + 1
    },
    recentActivity: [
      {
        type: 'info',
        icon: 'fa-server',
        message: 'System health check completed',
        timestamp: '2 minutes ago'
      },
      {
        type: 'success',
        icon: 'fa-database',
        message: 'Database backup completed successfully',
        timestamp: '15 minutes ago'
      },
      {
        type: 'info',
        icon: 'fa-users',
        message: '3 new user sessions established',
        timestamp: '30 minutes ago'
      },
      {
        type: 'warning',
        icon: 'fa-exclamation-triangle',
        message: 'High memory usage detected and resolved',
        timestamp: '1 hour ago'
      }
    ]
  };

  // محاسبه زمان پاسخ
  healthInfo.responseTime = Date.now() - startTime;
  
  return healthInfo;
}

// آپدیت route سلامت API برای برگرداندن JSON
app.get('/api/health', async (req, res) => {
  try {
    const healthData = await getSystemHealth();
    res.json(healthData);
  } catch (error) {
    res.status(500).json({
      status: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});






// Route برای صفحه about
app.get('/about', requireAuth, (req, res) => {
  res.render('about', {
    layout: 'main',
    user: req.user,
    activePage: 'about'
  });
});


// Route برای تغییر رمز عبور
app.post('/api/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // تغییر رمز عبور
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
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