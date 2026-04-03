const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

let db;

(async () => {
  db = await open({
    filename: path.join(__dirname, 'inventory.db'),
    driver: sqlite3.Database
  });

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
      unit TEXT DEFAULT 'pcs'
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      quantity INTEGER,
      sale_date TEXT DEFAULT CURRENT_TIMESTAMP,
      total_price REAL,
      customer_type TEXT DEFAULT 'retail',
      FOREIGN KEY(product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS reorder_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      alert_date TEXT DEFAULT CURRENT_TIMESTAMP,
      message TEXT,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY(product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS seasonal_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      month INTEGER,
      demand_multiplier REAL DEFAULT 1.0,
      FOREIGN KEY(product_id) REFERENCES products(id)
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

// API Routes
app.get('/api/products', async (req, res) => {
  const products = await db.all('SELECT * FROM products');
  
  const enhancedProducts = await Promise.all(products.map(async (p) => {
    const prediction = await predictDemand(p.id, p.stock);
    
    return {
      ...p,
      ...prediction,
      status: p.stock <= p.min_stock ? 'critical' : (prediction.daysLeft <= 3 ? 'warning' : 'healthy')
    };
  }));
  
  res.json(enhancedProducts);
});

// Add new product
app.post('/api/products', async (req, res) => {
  const { name, category, stock, minStock, price, supplier, unit } = req.body;
  const result = await db.run(
    'INSERT INTO products (name, category, stock, min_stock, price, supplier, unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, category, stock || 0, minStock || 5, price, supplier, unit || 'pcs']
  );
  res.json({ success: true, id: result.lastID });
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, stock, minStock, price, supplier, unit } = req.body;
  await db.run(
    'UPDATE products SET name = ?, category = ?, stock = ?, min_stock = ?, price = ?, supplier = ?, unit = ? WHERE id = ?',
    [name, category, stock, minStock, price, supplier, unit, id]
  );
  res.json({ success: true });
});

// Record sale with enhanced data
app.post('/api/sales', async (req, res) => {
  const { productId, quantity, totalPrice, customerType } = req.body;
  
  // Get product price if not provided
  let price = totalPrice;
  if (!price) {
    const product = await db.get('SELECT price FROM products WHERE id = ?', [productId]);
    price = product ? product.price * quantity : 0;
  }
  
  await db.run(
    'INSERT INTO sales (product_id, quantity, total_price, customer_type) VALUES (?, ?, ?, ?)',
    [productId, quantity, price, customerType || 'retail']
  );
  await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, productId]);
  res.json({ success: true });
});

// Get sales analytics
app.get('/api/sales/analytics', async (req, res) => {
  const { period = '7' } = req.query;
  const days = parseInt(period);
  
  const sales = await db.all(`
    SELECT s.*, p.name as product_name, p.category 
    FROM sales s 
    JOIN products p ON s.product_id = p.id 
    WHERE s.sale_date > datetime("now", "-${days} days")
    ORDER BY s.sale_date DESC
  `);
  
  const totalRevenue = sales.reduce((acc, sale) => acc + (sale.total_price || 0), 0);
  const totalQuantity = sales.reduce((acc, sale) => acc + sale.quantity, 0);
  const topProducts = sales.reduce((acc, sale) => {
    acc[sale.product_name] = (acc[sale.product_name] || 0) + sale.quantity;
    return acc;
  }, {});
  
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
});

// Generate reorder list
app.get('/api/reorder', async (req, res) => {
  const products = await db.all('SELECT * FROM products');
  
  const reorderList = [];
  for (const product of products) {
    const prediction = await predictDemand(product.id, product.stock);
    
    if (product.stock <= product.min_stock || prediction.daysLeft <= 7) {
      const suggestedQuantity = Math.ceil(prediction.burnRate * 14) - product.stock; // 14 days supply
      reorderList.push({
        ...product,
        ...prediction,
        suggestedQuantity: Math.max(suggestedQuantity, product.min_stock * 2),
        urgency: product.stock <= product.min_stock ? 'immediate' : 'within_week'
      });
    }
  }
  
  res.json(reorderList.sort((a, b) => {
    const urgencyOrder = { immediate: 0, within_week: 1 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  }));
});

// Create reorder alert
app.post('/api/alerts', async (req, res) => {
  const { productId, message } = req.body;
  const result = await db.run(
    'INSERT INTO reorder_alerts (product_id, message, status) VALUES (?, ?, ?)',
    [productId, message, 'pending']
  );
  res.json({ success: true, id: result.lastID });
});

// Get pending alerts
app.get('/api/alerts', async (req, res) => {
  const alerts = await db.all(`
    SELECT a.*, p.name as product_name 
    FROM reorder_alerts a 
    JOIN products p ON a.product_id = p.id 
    WHERE a.status = 'pending'
    ORDER BY a.alert_date DESC
  `);
  res.json(alerts);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
