import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
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
import axios from 'axios';
import { SalesModal } from './components/SalesModal';
import { InventoryPage } from './components/InventoryPage';
import { SalesPage } from './components/SalesPage';
import { ReorderPage } from './components/ReorderPage';
import { VoiceInput } from './components/VoiceInput';
import { useOfflineSync } from './hooks/useOfflineSync';
import { AuthModal, UserProfile } from './components/AuthComponents';
import { BillingDashboard } from './components/BillingComponents';

// Types
interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  shopName?: string;
  shopAddress?: string;
  businessType?: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [language, setLanguage] = useState<'EN' | 'TE' | 'HI'>('EN');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showProfile, setShowProfile] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  // Check for existing session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setToken(savedToken);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleAuthSuccess = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setShowProfile(false);
  };

  const handleProfileUpdate = async (updates: Partial<User>) => {
    if (!user || !token) return;

    try {
      const response = await axios.put('http://localhost:5000/api/auth/profile', updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handlePlanUpgrade = async (planId: number) => {
    if (!user || !token) return;

    try {
      const response = await axios.post('http://localhost:5000/api/billing/subscribe', 
        { planId, paymentMethod: 'demo' },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.success) {
        // Simulate payment success
        await axios.post('http://localhost:5000/api/billing/payment-success', 
          { paymentId: response.data.payment.paymentId, gatewayResponse: { status: 'success' } },
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        // Refresh user data
        const profileResponse = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (profileResponse.data.success) {
          setUser(profileResponse.data.user);
          localStorage.setItem('user', JSON.stringify(profileResponse.data.user));
        }
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
    }
  };

  // Protected Route Component
  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  };

  // Public Route Component (redirect if authenticated)
  const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (user) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };

  // Login/Register Page
  const AuthPage: React.FC = () => {
    const t = {
      EN: {
        welcome: 'Welcome to AI Smart Inventory',
        subtitle: 'Manage your shop with AI-powered insights',
        login: 'Login',
        register: 'Register',
        haveAccount: 'Already have an account?',
        noAccount: "Don't have an account?",
        signUp: 'Sign Up',
        signIn: 'Sign In'
      },
      TE: {
        welcome: 'AI స్మార్ట్ ఇన్వెంటరీకి స్వాగతం',
        subtitle: 'AI-ఆధారిత అంతర్దర్శలతో మీ దుకాణాన్ని నిర్వహించండి',
        login: 'లాగిన్',
        register: 'నమోదీరా',
        haveAccount: 'ఖాతా ఉందా?',
        noAccount: 'ఖాతా లేదా?',
        signUp: 'నమోదీరా',
        signIn: 'లాగిన్'
      },
      HI: {
        welcome: 'AI स्मार्ट इन्वेंट्री में आपका स्वागत है',
        subtitle: 'AI-आधारित अंतर्दृष्टियों के साथ अपनी दुकान प्रबंधित करें',
        login: 'लॉगिन',
        register: 'रजिस्टर करें',
        haveAccount: 'पहले से हैं?',
        noAccount: 'अभी तक नहीं?',
        signUp: 'साइन अप करें',
        signIn: 'साइन इन करें'
      }
    };

    const lang = t[language];

    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-logo">
              <Package size={48} />
              <h1>AI Smart Inventory</h1>
            </div>
            <p>{lang.subtitle}</p>
          </div>

          <div className="auth-content">
            <div className="auth-form">
              <h2>{authMode === 'login' ? lang.login : lang.register}</h2>
              
              <AuthModal
                isOpen={true}
                onClose={() => {}}
                mode={authMode}
                onAuthSuccess={handleAuthSuccess}
                language={language}
              />
              
              <div className="auth-switch">
                {authMode === 'login' ? (
                  <p>
                    {lang.noAccount}{' '}
                    <button 
                      onClick={() => setAuthMode('register')}
                      className="link-button"
                    >
                      {lang.signUp}
                    </button>
                  </p>
                ) : (
                  <p>
                    {lang.haveAccount}{' '}
                    <button 
                      onClick={() => setAuthMode('login')}
                      className="link-button"
                    >
                      {lang.signIn}
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Dashboard Component
  const Dashboard: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSalesModal, setShowSalesModal] = useState(false);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
      const fetchProducts = async () => {
        if (!isInitialized || !token) return;
        
        try {
          let productsData;
          
          if (isOnline) {
            try {
              const res = await axios.get('http://localhost:5000/api/products', {
                headers: { Authorization: `Bearer ${token}` }
              });
              productsData = res.data;
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
          const offlineProducts = await getProducts();
          setProducts(offlineProducts);
        } finally {
          setLoading(false);
        }
      };
      
      fetchProducts();
    }, [isOnline, isInitialized, token, getProducts]);

    const handleSale = async (productId: number, quantity: number, totalPrice: number) => {
      try {
        const result = await saveSale(productId, quantity, totalPrice, 'retail');
        
        if (result.success) {
          try {
            if (isOnline && token) {
              const res = await axios.get('http://localhost:5000/api/products', {
                headers: { Authorization: `Bearer ${token}` }
              });
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
      
      if (command.startsWith('ADD_SALE:')) {
        const text = command.replace('ADD_SALE:', '').trim();
        const match = text.match(/(\d+)\s*(?:units?|pcs?)?\s*(?:of\s+)?(.+)/i);
        if (match) {
          const quantity = parseInt(match[1]);
          const productName = match[2].trim();
          
          const product = products.find(p => 
            p.name.toLowerCase().includes(productName.toLowerCase())
          );
          
          if (product) {
            setShowSalesModal(true);
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
        setShowSalesModal(true);
      }
    };

    const translations = {
      EN: { welcome: "Namaste, Welcome back!", stockStatus: "Stock Status", lowStock: "Low Stock Items", todaySales: "Today's Sales", reorder: "Quick Reorder" },
      TE: { welcome: "నమస్తే, స్వాగతం!", stockStatus: "స్టాక్ పరిస్థితి", lowStock: "తక్కువగా ఉన్న వస్తువులు", todaySales: "నేటి అమ్మకాలు", reorder: "త్వరగా ఆర్డర్ చేయండి" },
      HI: { welcome: "नमस्ते, स्वागत है!", stockStatus: "स्टॉक की स्थिति", lowStock: "कम स्टॉक वाली वस्तुएं", todaySales: "आज की बिक्री", reorder: "त्वरित ऑर्डर" }
    };

    const t = translations[language];

    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      );
    }

    return (
      <div className="dashboard-content animate-fade-in">
        <header className="dashboard-header">
          <div>
            <h1>{t.welcome}, {user?.name || 'User'}!</h1>
            <p>{user?.shopName || 'Your Shop'}</p>
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
              <span className="user-plan">
                <Shield size={16} /> {user?.subscriptionPlan || 'Free'} Plan
              </span>
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
            <button className="icon-btn glass" onClick={() => setShowBilling(true)}>
              <CreditCard size={20} />
            </button>
            <button className="icon-btn glass" onClick={() => setShowProfile(true)}>
              <User size={20} />
            </button>
            <button className="icon-btn glass" onClick={handleLogout}>
              <LogOut size={20} />
            </button>
            <button className="icon-btn glass mobile-menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} style={{ display: mobileMenuOpen ? 'block' : 'none' }}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowProfile(true)}>
              <User size={20} /> Profile
            </button>
            <button onClick={() => setShowBilling(true)}>
              <CreditCard size={20} /> Billing
            </button>
            <button onClick={handleLogout}>
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="card stat-card">
            <div className="stat-icon" style={{background: '#E8EAF6', color: '#1A237E'}}><TrendingUp size={24} /></div>
            <div className="stat-info">
              <p>Today's Sales</p>
              <h3>₹ 12,450</h3>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{background: '#FEF2E2', color: '#D84315'}}><Package size={24} /></div>
            <div className="stat-info">
              <p>Total Products</p>
              <h3>{products.length}</h3>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{background: '#E8F5E8', color: '#2E7D32'}}><ShoppingCart size={24} /></div>
            <div className="stat-info">
              <p>Low Stock Items</p>
              <h3>{products.filter(p => p.status === 'critical').length}</h3>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{background: '#F3E5F5', color: '#6A1B9A'}}><Bell size={24} /></div>
            <div className="stat-info">
              <p>Reorder Alerts</p>
              <h3>3</h3>
            </div>
          </div>
        </div>

        <section className="card">
          <div className="section-header">
            <h2>{t.stockStatus}</h2>
            <button className="icon-btn" onClick={() => setShowSalesModal(true)}>
              <Plus size={20} />
            </button>
          </div>
          {products.length === 0 ? (
            <div className="empty-state">
              <Package size={48} />
              <p>No products yet. Add your first product to get started!</p>
              <button className="button-primary" onClick={() => setShowSalesModal(true)}>
                Add Product
              </button>
            </div>
          ) : (
            <div className="stock-list">
              {products.slice(0, 5).map(item => (
                <div key={item.id} className={`stock-item ${item.status}`}>
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p>{item.category || 'Uncategorized'} • ₹{item.price || 0}</p>
                  </div>
                  <div className="stock-quantity">
                    <span className="quantity">{item.stock} {item.unit || 'pcs'}</span>
                    <div className="prediction-badge">
                      <AlertCircle size={14} />
                      {item.daysLeft <= 0 ? 'Out of stock' : `Runs out in ${item.daysLeft} days`}
                    </div>
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

        {showProfile && (
          <UserProfile
            user={user}
            onLogout={handleLogout}
            language={language}
            onUpdateProfile={handleProfileUpdate}
          />
        )}

        {showBilling && (
          <div className="modal-overlay">
            <div className="modal billing-modal">
              <div className="modal-header">
                <h2>Billing & Subscription</h2>
                <button onClick={() => setShowBilling(false)} className="icon-btn">
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <BillingDashboard
                  language={language}
                  user={user}
                  onPlanUpgrade={handlePlanUpgrade}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;

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
