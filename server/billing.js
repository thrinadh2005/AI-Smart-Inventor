const { open } = require('sqlite');
const path = require('path');

class BillingManager {
  constructor(db) {
    this.db = db;
  }

  async initializeBillingTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        price REAL NOT NULL,
        duration_days INTEGER NOT NULL,
        features TEXT,
        max_products INTEGER DEFAULT 50,
        max_users INTEGER DEFAULT 1,
        api_calls_per_day INTEGER DEFAULT 1000,
        support_level TEXT DEFAULT 'basic',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subscription_plan_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'INR',
        payment_method TEXT NOT NULL,
        payment_id TEXT,
        status TEXT DEFAULT 'pending',
        gateway_response TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        processed_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(subscription_plan_id) REFERENCES subscription_plans(id)
      );

      CREATE TABLE IF NOT EXISTS billing_invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        invoice_number TEXT UNIQUE NOT NULL,
        subscription_plan_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        tax_amount REAL DEFAULT 0,
        total_amount REAL NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        paid_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(subscription_plan_id) REFERENCES subscription_plans(id)
      );

      CREATE TABLE IF NOT EXISTS usage_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        metric_type TEXT NOT NULL,
        metric_value INTEGER NOT NULL,
        recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);

    // Insert default subscription plans
    await this.insertDefaultPlans();
  }

  async insertDefaultPlans() {
    const existingPlans = await this.db.get('SELECT COUNT(*) as count FROM subscription_plans');
    if (existingPlans.count > 0) return;

    const plans = [
      {
        name: 'Free',
        price: 0,
        duration_days: 365,
        features: JSON.stringify({
          products: 10,
          users: 1,
          api_calls: 100,
          support: 'community',
          features: ['basic_inventory', 'voice_commands', 'offline_mode']
        }),
        max_products: 10,
        max_users: 1,
        api_calls_per_day: 100,
        support_level: 'community'
      },
      {
        name: 'Basic',
        price: 299,
        duration_days: 30,
        features: JSON.stringify({
          products: 100,
          users: 3,
          api_calls: 1000,
          support: 'email',
          features: ['basic_inventory', 'voice_commands', 'offline_mode', 'analytics', 'reports']
        }),
        max_products: 100,
        max_users: 3,
        api_calls_per_day: 1000,
        support_level: 'email'
      },
      {
        name: 'Professional',
        price: 799,
        duration_days: 30,
        features: JSON.stringify({
          products: 500,
          users: 10,
          api_calls: 5000,
          support: 'priority',
          features: ['basic_inventory', 'voice_commands', 'offline_mode', 'analytics', 'reports', 'advanced_ai', 'whatsapp_integration', 'multi_store']
        }),
        max_products: 500,
        max_users: 10,
        api_calls_per_day: 5000,
        support_level: 'priority'
      },
      {
        name: 'Enterprise',
        price: 1999,
        duration_days: 30,
        features: JSON.stringify({
          products: -1,
          users: -1,
          api_calls: -1,
          support: '24/7',
          features: ['basic_inventory', 'voice_commands', 'offline_mode', 'analytics', 'reports', 'advanced_ai', 'whatsapp_integration', 'multi_store', 'custom_integrations', 'white_label', 'dedicated_support']
        }),
        max_products: -1,
        max_users: -1,
        api_calls_per_day: -1,
        support_level: '24/7'
      }
    ];

    for (const plan of plans) {
      await this.db.run(
        'INSERT INTO subscription_plans (name, price, duration_days, features, max_products, max_users, api_calls_per_day, support_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [plan.name, plan.price, plan.duration_days, plan.features, plan.max_products, plan.max_users, plan.api_calls_per_day, plan.support_level]
      );
    }
  }

  async getSubscriptionPlans() {
    const plans = await this.db.all('SELECT * FROM subscription_plans ORDER BY price');
    return plans.map(plan => ({
      ...plan,
      features: JSON.parse(plan.features)
    }));
  }

  async createPayment(userId, planId, paymentMethod, paymentId = null) {
    const plan = await this.db.get('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
    if (!plan) {
      throw new Error('Invalid subscription plan');
    }

    const paymentId = await this.db.run(
      'INSERT INTO payments (user_id, subscription_plan_id, amount, payment_method, payment_id, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, planId, plan.price, paymentMethod, paymentId, 'pending']
    );

    return {
      paymentId: paymentId.lastID,
      amount: plan.price,
      planName: plan.name,
      durationDays: plan.duration_days
    };
  }

  async processPayment(paymentId, gatewayResponse) {
    const payment = await this.db.get('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const status = gatewayResponse.status === 'success' ? 'completed' : 'failed';
    
    await this.db.run(
      'UPDATE payments SET status = ?, gateway_response = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, JSON.stringify(gatewayResponse), paymentId]
    );

    if (status === 'completed') {
      // Update user subscription
      const plan = await this.db.get('SELECT * FROM subscription_plans WHERE id = ?', [payment.subscription_plan_id]);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

      await this.db.run(
        'UPDATE users SET subscription_plan = ?, subscription_expires = ?, subscription_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [plan.name, expiresAt.toISOString(), 'active', payment.user_id]
      );

      // Create subscription record
      await this.db.run(
        'INSERT INTO subscriptions (user_id, plan, status, starts_at, expires_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)',
        [payment.user_id, plan.name, 'active', expiresAt.toISOString()]
      );

      // Create invoice
      await this.createInvoice(payment.user_id, payment.subscription_plan_id, plan.price);
    }

    return { status, paymentId };
  }

  async createInvoice(userId, planId, amount) {
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

    const taxAmount = amount * 0.18; // 18% GST
    const totalAmount = amount + taxAmount;

    await this.db.run(
      'INSERT INTO billing_invoices (user_id, invoice_number, subscription_plan_id, amount, tax_amount, total_amount, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, invoiceNumber, planId, amount, taxAmount, totalAmount, dueDate.toISOString(), 'pending']
    );

    return invoiceNumber;
  }

  async getUserInvoices(userId) {
    const invoices = await this.db.all(`
      SELECT bi.*, sp.name as plan_name 
      FROM billing_invoices bi
      JOIN subscription_plans sp ON bi.subscription_plan_id = sp.id
      WHERE bi.user_id = ?
      ORDER BY bi.created_at DESC
    `, [userId]);

    return invoices;
  }

  async getUserPayments(userId) {
    const payments = await this.db.all(`
      SELECT p.*, sp.name as plan_name 
      FROM payments p
      JOIN subscription_plans sp ON p.subscription_plan_id = sp.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [userId]);

    return payments;
  }

  async logUsage(userId, metricType, metricValue) {
    await this.db.run(
      'INSERT INTO usage_logs (user_id, metric_type, metric_value) VALUES (?, ?, ?)',
      [userId, metricType, metricValue]
    );
  }

  async getUsageStats(userId, period = '30') {
    const days = parseInt(period);
    const stats = await this.db.all(`
      SELECT metric_type, SUM(metric_value) as total, COUNT(*) as count
      FROM usage_logs 
      WHERE user_id = ? AND recorded_at > datetime('now', '-${days} days')
      GROUP BY metric_type
    `, [userId]);

    return stats;
  }

  async checkUsageLimits(userId, metricType, currentValue) {
    const user = await this.db.get('SELECT subscription_plan FROM users WHERE id = ?', [userId]);
    if (!user) return false;

    const plan = await this.db.get('SELECT * FROM subscription_plans WHERE name = ?', [user.subscription_plan]);
    if (!plan) return false;

    const today = new Date().toISOString().split('T')[0];
    const todayUsage = await this.db.get(
      'SELECT SUM(metric_value) as total FROM usage_logs WHERE user_id = ? AND metric_type = ? AND recorded_at >= ?',
      [userId, metricType, today]
    );

    const totalUsage = todayUsage?.total || 0;
    const limit = this.getLimitForMetric(plan, metricType);

    return totalUsage + currentValue <= limit;
  }

  getLimitForMetric(plan, metricType) {
    switch (metricType) {
      case 'products':
        return plan.max_products;
      case 'api_calls':
        return plan.api_calls_per_day;
      case 'users':
        return plan.max_users;
      default:
        return Infinity;
    }
  }

  async getBillingSummary(userId) {
    const user = await this.db.get('SELECT subscription_plan, subscription_expires FROM users WHERE id = ?', [userId]);
    const currentInvoice = await this.db.get('SELECT * FROM billing_invoices WHERE user_id = ? AND status = "pending" ORDER BY due_date ASC LIMIT 1', [userId]);
    const recentPayments = await this.db.all('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 3', [userId]);

    return {
      currentPlan: user?.subscription_plan || 'free',
      expires: user?.subscription_expires,
      pendingInvoice: currentInvoice,
      recentPayments,
      isExpired: user?.subscription_expires && new Date(user.subscription_expires) < new Date()
    };
  }
}

module.exports = BillingManager;
