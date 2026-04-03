import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Settings, 
  Bell, 
  Plus, 
  Mic, 
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import './App.css';

// Components
import axios from 'axios';
import { SalesModal } from './components/SalesModal';
import { InventoryPage } from './components/InventoryPage';
import { SalesPage } from './components/SalesPage';
import { ReorderPage } from './components/ReorderPage';
import { VoiceInput } from './components/VoiceInput';
import { useOfflineSync } from './hooks/useOfflineSync';

const Dashboard = () => {
  const [language, setLanguage] = useState<'EN' | 'TE' | 'HI'>('EN');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Use offline sync hook
  const { 
    isOnline, 
    isInitialized, 
    syncStatus, 
    forceSync, 
    saveSale, 
    getProducts,
    hasPendingSync 
  } = useOfflineSync({ autoInitialize: true, enableAutoSync: true });
  
  useEffect(() => {
    const fetchProducts = async () => {
      if (!isInitialized) return;
      
      try {
        let productsData;
        
        // Try online first, fallback to offline
        if (isOnline) {
          try {
            const res = await axios.get('http://localhost:5000/api/products');
            productsData = res.data;
            // Save to offline storage
            await getProducts(); // This will trigger offline save if needed
          } catch (onlineError) {
            console.log('Online fetch failed, using offline data');
            productsData = await getProducts();
          }
        } else {
          productsData = await getProducts();
        }
        
        setProducts(productsData);
      } catch (err) {
        console.error("Error fetching products:", err);
        // Try offline as last resort
        const offlineProducts = await getProducts();
        setProducts(offlineProducts);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [isOnline, isInitialized, getProducts]);

  const handleSale = async (productId: number, quantity: number, totalPrice: number) => {
    try {
      // Use offline-aware save function
      const result = await saveSale(productId, quantity, totalPrice, 'retail');
      
      if (result.success) {
        // Refresh products to update stock (try online first, then offline)
        try {
          if (isOnline) {
            const res = await axios.get('http://localhost:5000/api/products');
            setProducts(res.data);
          } else {
            const updatedProducts = await getProducts();
            setProducts(updatedProducts);
          }
        } catch (err) {
          console.error('Error refreshing products:', err);
        }
      }
    } catch (err) {
      console.error('Error recording sale:', err);
    }
  };

  const handleForceSync = async () => {
    setSyncing(true);
    try {
      const result = await forceSync();
      if (result.success) {
        // Refresh products after sync
        const productsData = await getProducts();
        setProducts(productsData);
      }
      alert(result.message);
    } catch (err) {
      alert('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleVoiceCommand = async (command: string, voiceLang: string) => {
    console.log('Voice command:', command, 'Language:', voiceLang);
    
    // Parse voice commands
    if (command.startsWith('ADD_SALE:')) {
      const text = command.replace('ADD_SALE:', '').trim();
      // Simple parsing for "sell X units of product Y"
      const match = text.match(/(\d+)\s*(?:units?|pcs?)?\s*(?:of\s+)?(.+)/i);
      if (match) {
        const quantity = parseInt(match[1]);
        const productName = match[2].trim();
        
        // Find product by name
        const product = products.find(p => 
          p.name.toLowerCase().includes(productName.toLowerCase())
        );
        
        if (product) {
          setShowSalesModal(true);
          // You could pre-fill the modal with the found product
        } else {
          alert(`Product "${productName}" not found`);
        }
      } else {
        setShowSalesModal(true);
      }
    } else if (command.startsWith('CHECK_STOCK:')) {
      const text = command.replace('CHECK_STOCK:', '').trim();
      const product = products.find(p => 
        p.name.toLowerCase().includes(text.toLowerCase())
      );
      
      if (product) {
        alert(`${product.name}: ${product.stock} ${product.unit} in stock`);
      } else {
        alert('Product not found');
      }
    } else if (command.startsWith('FIND_PRODUCT:')) {
      const text = command.replace('FIND_PRODUCT:', '').trim();
      const foundProducts = products.filter(p => 
        p.name.toLowerCase().includes(text.toLowerCase())
      );
      
      if (foundProducts.length > 0) {
        alert(`Found ${foundProducts.length} products: ${foundProducts.map(p => p.name).join(', ')}`);
      } else {
        alert('No products found');
      }
    } else {
      // Treat as general input
      setShowSalesModal(true);
    }
  };

  const translations = {
    EN: { welcome: "Namaste, Welcome back!", stockStatus: "Stock Status", lowStock: "Low Stock Items", todaySales: "Today's Sales", reorder: "Quick Reorder" },
    TE: { welcome: "నమస్తే, స్వాగతం!", "stockStatus": "స్టాక్ పరిస్థితి", "lowStock": "తక్కువగా ఉన్న వస్తువులు", "todaySales": "నేటి అమ్మకాలు", "reorder": "త్వరగా ఆర్డర్ చేయండి" },
    HI: { welcome: "नमस्ते, स्वागत है!", "stockStatus": "स्टॉक की स्थिति", "lowStock": "कम स्टॉक वाली वस्तुएं", "todaySales": "आज की बिक्री", "reorder": "त्वरित ऑर्डर" }
  };

  const t = translations[language];

  return (
    <div className="dashboard-content animate-fade-in">
      <header className="dashboard-header">
        <div>
          <h1>{t.welcome}</h1>
          <div className="connection-status">
            {isOnline ? (
              <span className="online">
                <Wifi size={16} /> Online
              </span>
            ) : (
              <span className="offline">
                <WifiOff size={16} /> Offline
              </span>
            )}
            {hasPendingSync && (
              <span className="pending-sync">
                <RefreshCw size={16} /> Pending Sync
              </span>
            )}
          </div>
        </div>
        <div className="header-actions">
          <div className="lang-toggle glass">
            {(['EN', 'TE', 'HI'] as const).map(lang => (
              <button 
                key={lang} 
                className={language === lang ? 'active' : ''} 
                onClick={() => setLanguage(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
          <button className="icon-btn glass" onClick={handleForceSync} disabled={syncing}>
            <RefreshCw size={20} className={syncing ? 'spinning' : ''} />
          </button>
          <button className="icon-btn glass"><Bell size={20} /></button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#E8EAF6', color: '#1A237E'}}><TrendingUp size={24} /></div>
          <div className="stat-info">
            <p>Today's Sales</p>
            <h3>₹ 12,450</h3>
            <span className="trend positive">+12% from yesterday</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#FFF3E0', color: '#E65100'}}><AlertCircle size={24} /></div>
          <div className="stat-info">
            <p>Low Stock Items</p>
            <h3>{products.filter(p => p.status !== 'healthy').length} Items</h3>
            <span className="trend negative">Needs attention</span>
          </div>
        </div>
      </div>

      <section className="inventory-section">
        <div className="section-header">
          <h2>{t.stockStatus}</h2>
          <button className="button-primary" onClick={() => setShowSalesModal(true)}>
            <Plus size={18} /> Add Sale
          </button>
        </div>
        
        {loading ? <p>Loading inventory...</p> : (
          <div className="stock-list">
            {products.map((item, idx) => (
              <div key={idx} className={`stock-item card ${item.status}`}>
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p>Stock: <strong>{item.stock}</strong> units left</p>
                </div>
                <div className="prediction-badge">
                   <AlertCircle size={14} />
                   {item.daysLeft <= 0 ? 'Out of stock' : `Runs out in ${item.daysLeft} days`}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="voice-input-container">
        <VoiceInput
          onTranscript={handleVoiceCommand}
          language={language}
          placeholder="Tap to add sale or check stock..."
        />
      </div>

      <SalesModal
        isOpen={showSalesModal}
        onClose={() => setShowSalesModal(false)}
        products={products}
        onSale={handleSale}
        language={language}
      />
    </div>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="app-container">
    <nav className="side-nav glass">
      <div className="logo">
        <ShoppingCart className="logo-icon" />
        <span>Ganna.ai</span>
      </div>
      <div className="nav-links">
        <Link to="/" className="active"><LayoutDashboard size={20} /> Dashboard</Link>
        <Link to="/inventory"><Package size={20} /> Inventory</Link>
        <Link to="/sales"><TrendingUp size={20} /> Sales</Link>
        <Link to="/reorder"><ShoppingCart size={20} /> Reorder</Link>
        <Link to="/settings" className="nav-bottom"><Settings size={20} /> Settings</Link>
      </div>
    </nav>
    <main className="main-content">
      {children}
    </main>
  </div>
);

function App() {
  const [language, setLanguage] = useState<'EN' | 'TE' | 'HI'>('EN');
  
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<InventoryPage language={language} />} />
          <Route path="/sales" element={<SalesPage language={language} />} />
          <Route path="/reorder" element={<ReorderPage language={language} />} />
          <Route path="/settings" element={<div>Settings Page (Work in progress)</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
