import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { userDB, sessionDB } from './database.js';

export const authService = {
  // ورود کاربر
  login: async (username, password, ip = '', userAgent = '') => {
    try {
      // پیدا کردن کاربر
      const user = await userDB.findByUsername(username);
      if (!user) {
        return { success: false, message: 'Invalid username or password' };
      }

      // بررسی پسورد
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid username or password' };
      }

      // ایجاد session جدید
      const sessionId = uuidv4();
      const session = await sessionDB.create({
        id: sessionId,
        userId: user.id,
        username: user.username,
        ip,
        userAgent
      });

      // بروزرسانی آخرین زمان ورود
      await userDB.update(user.id, { lastLogin: new Date().toISOString() });

      return {
        success: true,
        sessionId,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Internal server error' };
    }
  },

  // بررسی اعتبار session
  verifySession: async (sessionId) => {
    try {
      // پاک کردن session های منقضی شده
      await sessionDB.cleanupExpired();

      // پیدا کردن session
      const session = await sessionDB.findById(sessionId);
      if (!session) {
        return { valid: false, message: 'Invalid session' };
      }

      // بررسی انقضا
      if (new Date(session.expiresAt) < new Date()) {
        await sessionDB.delete(sessionId);
        return { valid: false, message: 'Session expired' };
      }

      // پیدا کردن کاربر
      const user = await userDB.findById(session.userId);
      if (!user) {
        await sessionDB.delete(sessionId);
        return { valid: false, message: 'User not found' };
      }

      // تمدید session
      const newExpiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
      await sessionDB.update(sessionId, { expiresAt: newExpiresAt.toISOString() });

      return {
        valid: true,
        session: {
          id: session.id,
          userId: user.id,
          username: user.username,
          ip: session.ip
        },
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Session verification error:', error);
      return { valid: false, message: 'Internal server error' };
    }
  },

  // خروج کاربر
  logout: async (sessionId) => {
    try {
      await sessionDB.delete(sessionId);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Internal server error' };
    }
  },

  // تغییر پسورد
  changePassword: async (userId, currentPassword, newPassword) => {
    try {
      const user = await userDB.findById(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return { success: false, message: 'Current password is incorrect' };
      }

      await userDB.update(userId, { password: newPassword });
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Internal server error' };
    }
  }
};