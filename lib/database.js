import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import path from 'path';
import bcrypt from 'bcryptjs';
import { mkdir } from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');
const file = path.join(dataDir, 'db.json');

// ساختار پیش‌فرض دیتابیس
const defaultData = {
  users: [
    {
      id: 1,
      username: 'admin',
      password: '', // بعداً هش می‌شود
      email: 'admin@localhost',
      role: 'admin',
      createdAt: new Date().toISOString(),
      lastLogin: null
    }
  ],
  sessions: [],
  settings: {
    maxLoginAttempts: 5,
    sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// ایجاد adapter و دیتابیس
const adapter = new JSONFile(file);
const db = new Low(adapter, defaultData);

// تابع مقداردهی اولیه دیتابیس
export const initializeDatabase = async () => {
  try {
    // ایجاد پوشه data اگر وجود ندارد
    await mkdir(dataDir, { recursive: true });
    
    await db.read();
    
    // اگر دیتابیس خالی است، داده‌های پیش‌فرض را می‌ریزیم
    if (!db.data || !db.data.users) {
      db.data = JSON.parse(JSON.stringify(defaultData));
      // هش کردن پسورد پیش‌فرض
      db.data.users[0].password = await bcrypt.hash('admin', 10);
      await db.write();
    }
    
    // اگر پسورد admin هش نشده، آن را هش کن
    const adminUser = db.data.users.find(user => user.username === 'admin');
    if (adminUser && (!adminUser.password || adminUser.password === '' || adminUser.password === 'admin')) {
      adminUser.password = await bcrypt.hash('admin', 10);
      await db.write();
    }
    
    console.log('✅ Database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// توابع مدیریت کاربران
export const userDB = {
  // پیدا کردن کاربر بر اساس نام کاربری
  findByUsername: async (username) => {
    await db.read();
    return db.data.users.find(user => user.username === username);
  },

  // پیدا کردن کاربر بر اساس آیدی
  findById: async (id) => {
    await db.read();
    return db.data.users.find(user => user.id === id);
  },

  // ایجاد کاربر جدید
  create: async (userData) => {
    await db.read();
    const newUser = {
      id: Date.now(),
      username: userData.username,
      password: await bcrypt.hash(userData.password, 10),
      email: userData.email || '',
      role: userData.role || 'user',
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    db.data.users.push(newUser);
    await db.write();
    return newUser;
  },

  // بروزرسانی کاربر
  update: async (id, updates) => {
    await db.read();
    const userIndex = db.data.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    db.data.users[userIndex] = { ...db.data.users[userIndex], ...updates };
    await db.write();
    return db.data.users[userIndex];
  },

  // حذف کاربر
  delete: async (id) => {
    await db.read();
    const userIndex = db.data.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;
    
    db.data.users.splice(userIndex, 1);
    await db.write();
    return true;
  },

  // لیست تمام کاربران
  findAll: async () => {
    await db.read();
    return db.data.users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }
};

// توابع مدیریت sessions
export const sessionDB = {
  // ایجاد session جدید
  create: async (sessionData) => {
    await db.read();
    const session = {
      id: sessionData.id,
      userId: sessionData.userId,
      username: sessionData.username,
      ip: sessionData.ip,
      userAgent: sessionData.userAgent,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + db.data.settings.sessionTimeout).toISOString()
    };
    
    db.data.sessions.push(session);
    await db.write();
    return session;
  },

  // پیدا کردن session بر اساس id
  findById: async (sessionId) => {
    await db.read();
    return db.data.sessions.find(session => session.id === sessionId);
  },

  // بروزرسانی session
  update: async (sessionId, updates) => {
    await db.read();
    const sessionIndex = db.data.sessions.findIndex(session => session.id === sessionId);
    if (sessionIndex === -1) return null;
    
    db.data.sessions[sessionIndex] = { ...db.data.sessions[sessionIndex], ...updates };
    await db.write();
    return db.data.sessions[sessionIndex];
  },

  // حذف session
  delete: async (sessionId) => {
    await db.read();
    const sessionIndex = db.data.sessions.findIndex(session => session.id === sessionId);
    if (sessionIndex === -1) return false;
    
    db.data.sessions.splice(sessionIndex, 1);
    await db.write();
    return true;
  },

  // پاک کردن session های منقضی شده
  cleanupExpired: async () => {
    await db.read();
    const now = new Date().toISOString();
    const initialLength = db.data.sessions.length;
    
    db.data.sessions = db.data.sessions.filter(session => session.expiresAt > now);
    
    if (db.data.sessions.length !== initialLength) {
      await db.write();
    }
    
    return initialLength - db.data.sessions.length;
  }, 
  
  // بروزرسانی کاربر
update: async (id, updates) => {
  await db.read();
  const userIndex = db.data.users.findIndex(user => user.id === id);
  if (userIndex === -1) return null;
  
  // اگر پسورد وجود دارد، آن را هش کن
  if (updates.password && typeof updates.password === 'string') {
    updates.password = await bcrypt.hash(updates.password, 10);
  }
  
  // بروزرسانی تاریخ آخرین تغییر
  updates.updatedAt = new Date().toISOString();
  
  db.data.users[userIndex] = { ...db.data.users[userIndex], ...updates };
  await db.write();
  return db.data.users[userIndex];
},

};




export default db;