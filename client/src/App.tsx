import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
  RefreshCw,
  User,
  LogOut,
  CreditCard,
  Shield,
  Menu,
  X
} from 'lucide-react';
import './App.css';

// Components
import api from './services/api';
import { SalesModal } from './components/SalesModal';
import { InventoryPage } from './components/InventoryPage';
import { SalesPage } from './components/SalesPage';
import { ReorderPage } from './components/ReorderPage';
import { VoiceInput } from './components/VoiceInput';
import { useOfflineSync } from './hooks/useOfflineSync';
import { AuthModal, UserProfile } from './components/AuthComponents';
import { BillingDashboard } from './components/BillingComponents';

// Types
interface UserData {
  id: number;
  email: string;
  name: string;
  phone?: string;
  shop_name?: string;
  shop_address?: string;
  business_type?: string;
  subscription_plan: string;
  subscription_status: string;
}

// Sidebar/Navigation Component
const Sidebar: React.FC<{ language: string; user: UserData | null; onLogout: () => void }> = ({ language, user, onLogout }) => {
  const location = useLocation();
  const t = {
    EN: { dashboard: 'Dashboard', inventory: 'Inventory', sales: 'Sales', reorder: 'Reorder', settings: 'Settings', logout: 'Logout' },
    TE: { dashboard: 'డాష్‌బోర్డ్', inventory: 'ఇన్వెంటరీ', sales: 'అమ్మకాలు', reorder: 'రీఆర్డర్', settings: 'సెట్టింగులు', logout: 'లాగ్ అవుట్' },
    HI: { dashboard: 'डैशबोर्ड', inventory: 'इन्वेंटरी', sales: 'बिक्री', reorder: 'रीऑर्डर', settings: 'सेटिंग्स', logout: 'लॉग आउट' }
  }[language as 'EN' | 'TE' | 'HI'] || { dashboard: 'Dashboard', inventory: 'Inventory', sales: 'Sales', reorder: 'Reorder', settings: 'Settings', logout: 'Logout' };

  return (
    <nav className="side-nav glass">
      <div className="logo">
        <ShoppingCart className="logo-icon" />
        <span>Ganna.ai</span>
      </div>
      <div className="nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          <LayoutDashboard size={20} /> <span>{t.dashboard}</span>
        </Link>
        <Link to="/inventory" className={location.pathname === '/inventory' ? 'active' : ''}>
          <Package size={20} /> <span>{t.inventory}</span>
        </Link>
        <Link to="/sales" className={location.pathname === '/sales' ? 'active' : ''}>
          <TrendingUp size={20} /> <span>{t.sales}</span>
        </Link>
        <Link to="/reorder" className={location.pathname === '/reorder' ? 'active' : ''}>
          <ShoppingCart size={20} /> <span>{t.reorder}</span>
        </Link>
        <Link to="/settings" className={location.pathname === '/settings' ? 'active' : 'nav-bottom'}>
          <Settings size={20} /> <span>{t.settings}</span>
        </Link>
      </div>
    </nav>
  );
};

// Main Dashboard Content
const Dashboard: React.FC<{ language: 'EN' | 'TE' | 'HI'; user: UserData | null }> = ({ language, user }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({ todaySales: 0, lowStockCount: 0, alertsCount: 0 });

  const { 
    isOnline, 
    isInitialized, 
    forceSync, 
    saveSale, 
    getProducts,
    hasPendingSync 
  } = useOfflineSync({ autoInitialize: true, enableAutoSync: true });

  const fetchDashboardData = useCallback(async () => {
    if (!isInitialized) return;
    
    try {
      let productsData;
      if (isOnline) {
        try {
          const res = await api.get('/products');
          productsData = res.data;
          
          const analyticsRes = await api.get('/sales/analytics?period=1');
          setStats(prev => ({
            ...prev,
            todaySales: analyticsRes.data.totalRevenue,
            lowStockCount: productsData.filter((p: any) => p.status === 'critical').length,
            alertsCount: 0 // Fetch from alerts endpoint if available
          }));
        } catch (onlineError) {
          productsData = await getProducts();
        }
      } else {
        productsData = await getProducts();
      }
      setProducts(productsData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      const offlineProducts = await getProducts();
      setProducts(offlineProducts);
    } finally {
      setLoading(false);
    }
  }, [isOnline, isInitialized, getProducts]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSale = async (productId: number, quantity: number, totalPrice: number) => {
    try {
      const result = await saveSale(productId, quantity, totalPrice, 'retail');
      if (result.success) {
        fetchDashboardData();
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
        fetchDashboardData();
      }
      alert(result.message);
    } catch (err) {
      alert('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleVoiceCommand = (command: string) => {
    if (command.startsWith('ADD_SALE:')) {
      setShowSalesModal(true);
    } else if (command.startsWith('CHECK_STOCK:')) {
      const text = command.replace('CHECK_STOCK:', '').trim();
      const product = products.find(p => p.name.toLowerCase().includes(text.toLowerCase()));
      if (product) alert(`${product.name}: ${product.stock} ${product.unit} left`);
      else alert('Product not found');
    } else {
      setShowSalesModal(true);
    }
  };

  const t = {
    EN: { welcome: "Welcome back", stock: "Stock Status", low: "Low Stock", sales: "Today's Sales", alerts: "Alerts" },
    TE: { welcome: "స్వాగతం", stock: "స్టాక్ పరిస్థితి", low: "తక్కువ స్టాక్", sales: "నేటి అమ్మకాలు", alerts: "హెచ్చరికలు" },
    HI: { welcome: "स्वागत है", stock: "स्टॉक की स्थिति", low: "कम स्टॉक", sales: "आज की बिक्री", alerts: "अलर्ट" }
  }[language];

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>;

  return (
    <div className="dashboard-content animate-fade-in">
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#E8F5E8', color: '#2E7D32'}}><TrendingUp size={24} /></div>
          <div className="stat-info">
            <p>{t.sales}</p>
            <h3>₹ {stats.todaySales.toLocaleString()}</h3>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#FFF3E0', color: '#E65100'}}><Package size={24} /></div>
          <div className="stat-info">
            <p>{t.low}</p>
            <h3>{stats.lowStockCount}</h3>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#F3E5F5', color: '#6A1B9A'}}><Bell size={24} /></div>
          <div className="stat-info">
            <p>{t.alerts}</p>
            <h3>{stats.alertsCount}</h3>
          </div>
        </div>
      </div>

      <section className="card">
        <div className="section-header">
          <h2>{t.stock}</h2>
          <button className="icon-btn" onClick={() => setShowSalesModal(true)}><Plus size={20} /></button>
        </div>
        <div className="stock-list">
          {products.slice(0, 5).map(item => (
            <div key={item.id} className={`stock-item ${item.status}`}>
              <div className="item-info">
                <h4>{item.name}</h4>
                <p>{item.category} • ₹{item.price}</p>
              </div>
              <div className="stock-quantity">
                <span className="quantity">{item.stock} {item.unit}</span>
                <div className="prediction-badge">
                  <AlertCircle size={14} />
                  {item.daysLeft <= 0 ? 'Out of stock' : `Out in ${item.daysLeft} days`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="voice-input-container">
        <VoiceInput onTranscript={handleVoiceCommand} language={language} placeholder="Tap to speak..." />
      </div>

      <SalesModal isOpen={showSalesModal} onClose={() => setShowSalesModal(false)} products={products} onSale={handleSale} language={language} />
    </div>
  );
};

// Main App Layout
const MainLayout: React.FC<{ 
  user: UserData | null; 
  onLogout: () => void;
  language: 'EN' | 'TE' | 'HI';
  setLanguage: (l: 'EN' | 'TE' | 'HI') => void;
  children: React.ReactNode;
}> = ({ user, onLogout, language, setLanguage, children }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const { isOnline, hasPendingSync, forceSync } = useOfflineSync({ autoInitialize: true });

  return (
    <div className="app-container">
      <Sidebar language={language} user={user} onLogout={onLogout} />
      <main className="main-content">
        <header className="dashboard-header">
          <div>
            <h1>Namaste, {user?.name}!</h1>
            <div className="connection-status">
              {isOnline ? <span className="online"><Wifi size={14} /> Online</span> : <span className="offline"><WifiOff size={14} /> Offline</span>}
              {hasPendingSync && <span className="pending-sync"><RefreshCw size={14} /> Pending Sync</span>}
              <span className="user-plan"><Shield size={14} /> {user?.subscription_plan} Plan</span>
            </div>
          </div>
          <div className="header-actions">
            <div className="lang-toggle glass">
              {(['EN', 'TE', 'HI'] as const).map(l => (
                <button key={l} className={language === l ? 'active' : ''} onClick={() => setLanguage(l)}>{l}</button>
              ))}
            </div>
            <button className="icon-btn glass" onClick={() => setShowBilling(true)}><CreditCard size={20} /></button>
            <button className="icon-btn glass" onClick={() => setShowProfile(true)}><User size={20} /></button>
            <button className="icon-btn glass" onClick={onLogout}><LogOut size={20} /></button>
          </div>
        </header>

        {children}

        {showProfile && <UserProfile user={user} onLogout={onLogout} language={language} onUpdateProfile={() => {}} />}
        {showBilling && (
          <div className="modal-overlay">
            <div className="modal"><BillingDashboard language={language} user={user} onPlanUpgrade={() => {}} />
            <button onClick={() => setShowBilling(false)} className="button-secondary" style={{margin: '20px'}}>Close</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [language, setLanguage] = useState<'EN' | 'TE' | 'HI'>('EN');

  const handleAuthSuccess = (userData: any, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <ShoppingCart size={64} color="var(--primary)" />
            <h1>Ganna.ai</h1>
            <p>Your AI-Powered Kirana Assistant</p>
          </div>
          <AuthModal isOpen={true} onClose={() => {}} mode="login" onAuthSuccess={handleAuthSuccess} language={language} />
          <div className="auth-footer">
             <div className="lang-toggle glass" style={{marginTop: '20px', justifyContent: 'center'}}>
              {(['EN', 'TE', 'HI'] as const).map(l => (
                <button key={l} className={language === l ? 'active' : ''} onClick={() => setLanguage(l)}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <MainLayout user={user} onLogout={handleLogout} language={language} setLanguage={setLanguage}>
        <Routes>
          <Route path="/" element={<Dashboard language={language} user={user} />} />
          <Route path="/inventory" element={<InventoryPage language={language} />} />
          <Route path="/sales" element={<SalesPage language={language} />} />
          <Route path="/reorder" element={<ReorderPage language={language} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </Router>
  );
};

export default App;
