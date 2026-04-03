const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { open } = require('sqlite');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 12;

class AuthManager {
  constructor(db) {
    this.db = db;
  }

  async initializeAuthTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        shop_name TEXT,
        shop_address TEXT,
        business_type TEXT DEFAULT 'kirana',
        subscription_plan TEXT DEFAULT 'free',
        subscription_status TEXT DEFAULT 'active',
        subscription_expires TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_login TEXT,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        token TEXT UNIQUE NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        plan TEXT NOT NULL,
        status TEXT NOT NULL,
        starts_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        amount REAL,
        payment_id TEXT,
        payment_method TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS billing_invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        invoice_number TEXT UNIQUE NOT NULL,
        amount REAL NOT NULL,
        plan TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        due_date TEXT NOT NULL,
        paid_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);
  }

  async register(userData) {
    const { email, password, name, phone, shopName, shopAddress, businessType } = userData;
    
    // Check if user already exists
    const existingUser = await this.db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await this.db.run(
      `INSERT INTO users (email, password, name, phone, shop_name, shop_address, business_type, subscription_expires) 
       VALUES (?, ?, ?, ?, ?, ?, ?, date('now', '+30 days'))`,
      [email, hashedPassword, name, phone, shopName, shopAddress, businessType]
    );

    const user = await this.db.get('SELECT id, email, name, phone, shop_name, shop_address, business_type, subscription_plan, subscription_status FROM users WHERE id = ?', [result.lastID]);

    // Generate JWT token
    const token = this.generateToken(user);

    return { user, token };
  }

  async login(email, password) {
    const user = await this.db.get('SELECT id, email, password, name, phone, shop_name, shop_address, business_type, subscription_plan, subscription_status, is_active FROM users WHERE email = ?', [email]);
    
    if (!user || !user.is_active) {
      throw new Error('Invalid credentials or account inactive');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await this.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    // Generate JWT token
    const token = this.generateToken(user);

    // Remove password from user object
    delete user.password;

    return { user, token };
  }

  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        shopName: user.shop_name,
        subscriptionPlan: user.subscription_plan
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async getUserById(userId) {
    const user = await this.db.get(
      'SELECT id, email, name, phone, shop_name, shop_address, business_type, subscription_plan, subscription_status, subscription_expires, created_at, last_login FROM users WHERE id = ? AND is_active = 1',
      [userId]
    );
    return user;
  }

  async updateProfile(userId, updates) {
    const { name, phone, shopName, shopAddress, businessType } = updates;
    
    await this.db.run(
      `UPDATE users SET name = ?, phone = ?, shop_name = ?, shop_address = ?, business_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, phone, shopName, shopAddress, businessType, userId]
    );

    return await this.getUserById(userId);
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await this.db.get('SELECT password FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      throw new Error('User not found');
    }

    const isValidOldPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidOldPassword) {
      throw new Error('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    await this.db.run('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedNewPassword, userId]);
  }

  async updateSubscription(userId, plan, expiresAt) {
    await this.db.run(
      'UPDATE users SET subscription_plan = ?, subscription_expires = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [plan, expiresAt, userId]
    );

    // Create subscription record
    await this.db.run(
      'INSERT INTO subscriptions (user_id, plan, status, starts_at, expires_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)',
      [userId, plan, 'active', expiresAt]
    );
  }

  async getSubscriptionStatus(userId) {
    const user = await this.db.get('SELECT subscription_plan, subscription_expires, subscription_status FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return { plan: 'free', status: 'inactive', expires: null };
    }

    const isExpired = user.subscription_expires && new Date(user.subscription_expires) < new Date();
    
    return {
      plan: user.subscription_plan,
      status: isExpired ? 'expired' : user.subscription_status,
      expires: user.subscription_expires
    };
  }
}

module.exports = AuthManager;
