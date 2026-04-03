const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const AuthManager = require('./auth');
const BillingManager = require('./billing');

const app = express();
app.use(cors());
app.use(express.json());

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

let db;
let authManager;
let billingManager;

(async () => {
  db = await open({
    filename: path.join(__dirname, 'inventory.db'),
    driver: sqlite3.Database
  });

  // Initialize auth and billing managers
  authManager = new AuthManager(db);
  billingManager = new BillingManager(db);
  await authManager.initializeAuthTables();
  await billingManager.initializeBillingTables();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 5,
      price REAL,
      last_reorder_date TEXT,
      supplier TEXT,
      unit TEXT DEFAULT 'pcs',
      user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      quantity INTEGER,
      sale_date TEXT DEFAULT CURRENT_TIMESTAMP,
      total_price REAL,
      customer_type TEXT DEFAULT 'retail',
      user_id INTEGER,
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reorder_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      alert_date TEXT DEFAULT CURRENT_TIMESTAMP,
      message TEXT,
      status TEXT DEFAULT 'pending',
      user_id INTEGER,
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS seasonal_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      month INTEGER,
      demand_multiplier REAL DEFAULT 1.0,
      user_id INTEGER,
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Seed initial data if empty
  const count = await db.get('SELECT COUNT(*) as count FROM products');
  if (count.count === 0) {
    await db.run('INSERT INTO products (name, category, stock, min_stock, price, supplier, unit) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      ['Aashirvaad Atta (5kg)', 'Dal & Flour', 20, 5, 240, 'Local Wholesale', 'packet']);
    await db.run('INSERT INTO products (name, category, stock, min_stock, price, supplier, unit) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      ['Fortune Sunflower Oil (1L)', 'Oil', 12, 5, 160, 'Metro Cash & Carry', 'liter']);
    await db.run('INSERT INTO products (name, category, stock, min_stock, price, supplier, unit) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      ['Tata Salt (1kg)', 'Spices', 50, 10, 25, 'Local Wholesale', 'kg']);
    await db.run('INSERT INTO products (name, category, stock, min_stock, price, supplier, unit) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      ['Parle-G Biscuits (100g)', 'Biscuits', 30, 8, 10, 'Parle Company', 'packet']);
    await db.run('INSERT INTO products (name, category, stock, min_stock, price, supplier, unit) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      ['Coca Cola (2L)', 'Cold Drinks', 15, 6, 85, 'Local Distributor', 'bottle']);
    
    // Add seasonal patterns (summer demand for cold drinks)
    await db.run('INSERT INTO seasonal_patterns (product_id, month, demand_multiplier) VALUES (?, ?, ?)', [5, 4, 1.5]); // April
    await db.run('INSERT INTO seasonal_patterns (product_id, month, demand_multiplier) VALUES (?, ?, ?)', [5, 5, 1.8]); // May
    await db.run('INSERT INTO seasonal_patterns (product_id, month, demand_multiplier) VALUES (?, ?, ?)', [5, 6, 1.6]); // June
  }
})();

// Enhanced AI Demand Prediction with Seasonal Patterns
const predictDemand = async (productId, currentStock) => {
  const lastSales = await db.all('SELECT quantity, sale_date FROM sales WHERE product_id = ? AND sale_date > datetime("now", "-30 days")', [productId]);
  const totalSold = lastSales.reduce((acc, sale) => acc + sale.quantity, 0);
  const baseBurnRate = totalSold / 30 || 0.5;
  
  // Get seasonal multiplier for current month
  const currentMonth = new Date().getMonth() + 1;
  const seasonalPattern = await db.get('SELECT demand_multiplier FROM seasonal_patterns WHERE product_id = ? AND month = ?', [productId, currentMonth]);
  const seasonalMultiplier = seasonalPattern ? seasonalPattern.demand_multiplier : 1.0;
  
  // Calculate weighted burn rate (recent sales weighted more heavily)
  const recentSales = await db.all('SELECT quantity FROM sales WHERE product_id = ? AND sale_date > datetime("now", "-7 days")', [productId]);
  const recentBurnRate = recentSales.reduce((acc, sale) => acc + sale.quantity, 0) / 7 || 0.5;
  
  // Weighted average: 70% recent, 30% historical with seasonal adjustment
  const adjustedBurnRate = (recentBurnRate * 0.7 + baseBurnRate * 0.3) * seasonalMultiplier;
  const daysLeft = Math.ceil(currentStock / adjustedBurnRate);
  
  return {
    burnRate: adjustedBurnRate,
    daysLeft,
    seasonalMultiplier,
    confidence: lastSales.length > 10 ? 'high' : lastSales.length > 5 ? 'medium' : 'low'
  };
};

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone, shopName, shopAddress, businessType } = req.body;
    const result = await authManager.register({
      email,
      password,
      name,
      phone,
      shopName,
      shopAddress,
      businessType: businessType || 'kirana'
    });
    res.json({ success: true, user: result.user, token: result.token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authManager.login(email, password);
    res.json({ success: true, user: result.user, token: result.token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await authManager.getUserById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, shopName, shopAddress, businessType } = req.body;
    const user = await authManager.updateProfile(req.user.id, {
      name,
      phone,
      shopName,
      shopAddress,
      businessType
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    await authManager.changePassword(req.user.id, oldPassword, newPassword);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Billing Routes
app.get('/api/billing/plans', async (req, res) => {
  try {
    const plans = await billingManager.getSubscriptionPlans();
    res.json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/billing/subscribe', authenticateToken, async (req, res) => {
  try {
    const { planId, paymentMethod } = req.body;
    const payment = await billingManager.createPayment(req.user.id, planId, paymentMethod);
    res.json({ success: true, payment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/billing/payment-success', authenticateToken, async (req, res) => {
  try {
    const { paymentId, gatewayResponse } = req.body;
    const result = await billingManager.processPayment(paymentId, gatewayResponse);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/billing/subscription', authenticateToken, async (req, res) => {
  try {
    const subscription = await billingManager.getBillingSummary(req.user.id);
    res.json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/billing/invoices', authenticateToken, async (req, res) => {
  try {
    const invoices = await billingManager.getUserInvoices(req.user.id);
    res.json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes (Protected)
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    // Check usage limits
    const canAdd = await billingManager.checkUsageLimits(req.user.id, 'products', 0);
    if (!canAdd) {
      return res.status(403).json({ error: 'Product limit reached for your subscription plan' });
    }

    const products = await db.all('SELECT * FROM products WHERE user_id = ?', [req.user.id]);
    
    const enhancedProducts = await Promise.all(products.map(async (p) => {
      const lastSales = await db.all('SELECT quantity FROM sales WHERE product_id = ? AND sale_date > datetime("now", "-7 days") AND user_id = ?', [p.id, req.user.id]);
      const totalSold = lastSales.reduce((acc, sale) => acc + sale.quantity, 0);
      const burnRate = totalSold / 7 || 0.5;
      const daysLeft = Math.ceil(p.stock / burnRate);
      
      return {
        ...p,
        daysLeft,
        burnRate,
        status: p.stock <= p.min_stock ? 'critical' : (daysLeft <= 3 ? 'warning' : 'healthy')
      };
    }));
    
    // Log usage
    await billingManager.logUsage(req.user.id, 'api_calls', 1);
    
    res.json(enhancedProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { name, category, stock, minStock, price, supplier, unit } = req.body;
    
    // Check usage limits
    const currentProducts = await db.get('SELECT COUNT(*) as count FROM products WHERE user_id = ?', [req.user.id]);
    const canAdd = await billingManager.checkUsageLimits(req.user.id, 'products', currentProducts.count + 1);
    if (!canAdd) {
      return res.status(403).json({ error: 'Product limit reached for your subscription plan' });
    }

    const result = await db.run(
      'INSERT INTO products (name, category, stock, min_stock, price, supplier, unit, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, category, stock || 0, minStock || 5, price, supplier, unit || 'pcs', req.user.id]
    );
    
    // Log usage
    await billingManager.logUsage(req.user.id, 'products', 1);
    
    res.json({ success: true, id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, stock, minStock, price, supplier, unit } = req.body;
    
    // Verify ownership
    const product = await db.get('SELECT * FROM products WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await db.run(
      'UPDATE products SET name = ?, category = ?, stock = ?, min_stock = ?, price = ?, supplier = ?, unit = ? WHERE id = ? AND user_id = ?',
      [name, category, stock, minStock, price, supplier, unit, id, req.user.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sales', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity, totalPrice, customerType } = req.body;
    
    // Verify ownership
    const product = await db.get('SELECT * FROM products WHERE id = ? AND user_id = ?', [productId, req.user.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await db.run(
      'INSERT INTO sales (product_id, quantity, total_price, customer_type, user_id) VALUES (?, ?, ?, ?, ?)',
      [productId, quantity, totalPrice || (product.price * quantity), customerType || 'retail', req.user.id]
    );
    await db.run('UPDATE products SET stock = stock - ? WHERE id = ? AND user_id = ?', [quantity, productId, req.user.id]);
    
    // Log usage
    await billingManager.logUsage(req.user.id, 'api_calls', 1);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sales/analytics', authenticateToken, async (req, res) => {
  try {
    const { period = '7' } = req.query;
    const days = parseInt(period);
    
    const sales = await db.all(`
      SELECT s.*, p.name as product_name, p.category 
      FROM sales s 
      JOIN products p ON s.product_id = p.id 
      WHERE s.user_id = ? AND s.sale_date > datetime("now", "-${days} days")
      ORDER BY s.sale_date DESC
    `, [req.user.id]);
    
    const totalRevenue = sales.reduce((acc, sale) => acc + (sale.total_price || 0), 0);
    const totalQuantity = sales.reduce((acc, sale) => acc + sale.quantity, 0);
    const topProducts = sales.reduce((acc, sale) => {
      acc[sale.product_name] = (acc[sale.product_name] || 0) + sale.quantity;
      return acc;
    }, {});
    
    // Log usage
    await billingManager.logUsage(req.user.id, 'api_calls', 1);
    
    res.json({
      totalRevenue,
      totalQuantity,
      salesCount: sales.length,
      topProducts: Object.entries(topProducts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity })),
      sales
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reorder', authenticateToken, async (req, res) => {
  try {
    const products = await db.all('SELECT * FROM products WHERE user_id = ?', [req.user.id]);
    
    const reorderList = [];
    for (const product of products) {
      const lastSales = await db.all('SELECT quantity FROM sales WHERE product_id = ? AND sale_date > datetime("now", "-30 days") AND user_id = ?', [product.id, req.user.id]);
      const totalSold = lastSales.reduce((acc, sale) => acc + sale.quantity, 0);
      const baseBurnRate = totalSold / 30 || 0.5;
      const daysLeft = Math.ceil(product.stock / baseBurnRate);
      
      if (product.stock <= product.min_stock || daysLeft <= 7) {
        const suggestedQuantity = Math.ceil(baseBurnRate * 14) - product.stock;
        reorderList.push({
          ...product,
          daysLeft,
          burnRate: baseBurnRate,
          suggestedQuantity: Math.max(suggestedQuantity, product.min_stock * 2),
          urgency: product.stock <= product.min_stock ? 'immediate' : 'within_week'
        });
      }
    }
    
    // Log usage
    await billingManager.logUsage(req.user.id, 'api_calls', 1);
    
    res.json(reorderList.sort((a, b) => {
      const urgencyOrder = { immediate: 0, within_week: 1 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/alerts', authenticateToken, async (req, res) => {
  try {
    const { productId, message } = req.body;
    
    // Verify ownership
    const product = await db.get('SELECT * FROM products WHERE id = ? AND user_id = ?', [productId, req.user.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const result = await db.run(
      'INSERT INTO reorder_alerts (product_id, message, user_id) VALUES (?, ?, ?)',
      [productId, message, req.user.id]
    );
    res.json({ success: true, id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/alerts', authenticateToken, async (req, res) => {
  try {
    const alerts = await db.all(`
      SELECT a.*, p.name as product_name 
      FROM reorder_alerts a 
      JOIN products p ON a.product_id = p.id 
      WHERE a.user_id = ? AND a.status = 'pending'
      ORDER BY a.alert_date DESC
    `, [req.user.id]);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public route for app status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    version: '2.0.0',
    features: ['authentication', 'billing', 'inventory', 'analytics', 'voice_commands', 'offline_mode'],
    timestamp: new Date().toISOString()
  });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
