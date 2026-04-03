import React, { useState, useEffect } from 'react';
import { Plus, Edit2, AlertCircle, TrendingUp, Search, Filter } from 'lucide-react';
import api from '../services/api';

interface Product {
  id: number;
  name: string;
  category: string;
  stock: number;
  min_stock: number;
  price: number;
  supplier?: string;
  unit: string;
  burnRate: number;
  daysLeft: number;
  status: 'healthy' | 'warning' | 'critical';
  confidence: 'high' | 'medium' | 'low';
}

interface InventoryPageProps {
  language: 'EN' | 'TE' | 'HI';
}

const translations = {
  EN: {
    title: 'Inventory Management',
    addProduct: 'Add Product',
    search: 'Search products...',
    filterBy: 'Filter by',
    allCategories: 'All Categories',
    stock: 'Stock',
    minStock: 'Min Stock',
    price: 'Price',
    supplier: 'Supplier',
    burnRate: 'Burn Rate',
    daysLeft: 'Days Left',
    confidence: 'Confidence',
    status: 'Status',
    actions: 'Actions',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    outOfStock: 'Out of Stock',
    critical: 'Critical',
    warning: 'Warning',
    healthy: 'Healthy',
    addNewProduct: 'Add New Product',
    productName: 'Product Name',
    category: 'Category',
    unit: 'Unit',
    reorderLevel: 'Reorder Level',
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  },
  TE: {
    title: 'ఇన్వెంటరీ నిర్వహణ',
    addProduct: 'ఉత్పత్తిని జోడించండి',
    search: 'ఉత్పత్తులను వెతకండి...',
    filterBy: 'ద్వారా వడపోయండి',
    allCategories: 'అన్ని వర్గాలు',
    stock: 'స్టాక్',
    minStock: 'కనీస స్టాక్',
    price: 'ధర',
    supplier: 'సరఫరాదారు',
    burnRate: 'బర్న్ రేట్',
    daysLeft: 'మిగిలిన రోజులు',
    confidence: 'విశ్వాసం',
    status: 'స్థితి',
    actions: 'చర్యలు',
    edit: 'సవరించండి',
    save: 'సేవ్ చేయండి',
    cancel: 'రద్దు చేయండి',
    outOfStock: 'స్టాక్ లేదు',
    critical: 'క్రిటికల్',
    warning: 'హెచ్చరిక',
    healthy: 'ఆరోగ్యంగా',
    addNewProduct: 'కొత్త ఉత్పత్తిని జోడించండి',
    productName: 'ఉత్పత్తి పేరు',
    category: 'వర్గం',
    unit: 'యూనిట్',
    reorderLevel: 'రీఆర్డర్ స్థాయి',
    high: 'ఎక్కువ',
    medium: 'మధ్యస్థం',
    low: 'తక్కువ'
  },
  HI: {
    title: 'इन्वेंटरी प्रबंधन',
    addProduct: 'उत्पाद जोड़ें',
    search: 'उत्पाद खोजें...',
    filterBy: 'द्वारा फ़िल्टर करें',
    allCategories: 'सभी श्रेणियां',
    stock: 'स्टॉक',
    minStock: 'न्यूनतम स्टॉक',
    price: 'कीमत',
    supplier: 'आपूर्तिकर्ता',
    burnRate: 'बर्न रेट',
    daysLeft: 'बचे हुए दिन',
    confidence: 'विश्वास',
    status: 'स्थिति',
    actions: 'कार्रवाई',
    edit: 'संपादित करें',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    outOfStock: 'स्टॉक खत्म',
    critical: 'गंभीर',
    warning: 'चेतावनी',
    healthy: 'स्वस्थ',
    addNewProduct: 'नया उत्पाद जोड़ें',
    productName: 'उत्पाद का नाम',
    category: 'श्रेणी',
    unit: 'इकाई',
    reorderLevel: 'रीऑर्डर स्तर',
    high: 'उच्च',
    medium: 'मध्यम',
    low: 'कम'
  }
};

export const InventoryPage: React.FC<InventoryPageProps> = ({ language }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const t = translations[language];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (product: Partial<Product>) => {
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, product);
      } else {
        await api.post('/products', product);
      }
      fetchProducts();
      setEditingProduct(null);
      setShowAddForm(false);
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  const categories = [...new Set(products.map(p => p.category))];

  if (loading) return <div className="loading">Loading inventory...</div>;

  return (
    <div className="inventory-page">
      <div className="page-header">
        <h1>{t.title}</h1>
        <button 
          className="button-primary"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={18} /> {t.addProduct}
        </button>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="filter-dropdown">
          <Filter size={18} />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-input"
          >
            <option value="all">{t.allCategories}</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="inventory-grid">
        {filteredProducts.map(product => (
          <div key={product.id} className={`product-card ${product.status}`}>
            <div className="product-header">
              <h3>{product.name}</h3>
              <span className={`status-badge ${product.status}`}>
                {t[product.status]}
              </span>
            </div>

            <div className="product-details">
              <div className="detail-row">
                <span>{t.category}:</span>
                <span>{product.category}</span>
              </div>
              <div className="detail-row">
                <span>{t.stock}:</span>
                <span className={product.stock <= product.min_stock ? 'low-stock' : ''}>
                  {product.stock} {product.unit}
                </span>
              </div>
              <div className="detail-row">
                <span>{t.minStock}:</span>
                <span>{product.min_stock} {product.unit}</span>
              </div>
              <div className="detail-row">
                <span>{t.price}:</span>
                <span>₹{product.price}</span>
              </div>
              {product.supplier && (
                <div className="detail-row">
                  <span>{t.supplier}:</span>
                  <span>{product.supplier}</span>
                </div>
              )}
            </div>

            <div className="ai-predictions">
              <div className="prediction-item">
                <TrendingUp size={14} />
                <span>{t.burnRate}: {product.burnRate.toFixed(1)}/{product.unit}/day</span>
              </div>
              <div className="prediction-item">
                <AlertCircle size={14} />
                <span>{t.daysLeft}: {product.daysLeft}</span>
              </div>
              <div className="prediction-item">
                <span>{t.confidence}: {t[product.confidence]}</span>
              </div>
            </div>

            <div className="product-actions">
              <button 
                className="button-secondary"
                onClick={() => setEditingProduct(product)}
              >
                <Edit2 size={16} /> {t.edit}
              </button>
            </div>
          </div>
        ))}
      </div>

      {(showAddForm || editingProduct) && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => {
            setEditingProduct(null);
            setShowAddForm(false);
          }}
          language={language}
        />
      )}
    </div>
  );
};

interface ProductFormProps {
  product: Product | null;
  onSave: (product: Partial<Product>) => void;
  onCancel: () => void;
  language: 'EN' | 'TE' | 'HI';
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel, language }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    stock: product?.stock || 0,
    min_stock: product?.min_stock || 5,
    price: product?.price || 0,
    supplier: product?.supplier || '',
    unit: product?.unit || 'pcs'
  });

  const t = translations[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{product ? t.edit : t.addNewProduct}</h3>
          <button onClick={onCancel} className="icon-btn">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>{t.productName}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>{t.category}</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t.stock}</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>{t.reorderLevel}</label>
              <input
                type="number"
                value={formData.min_stock}
                onChange={(e) => setFormData({...formData, min_stock: parseInt(e.target.value)})}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t.price}</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>{t.unit}</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="form-input"
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="liter">Liters</option>
                <option value="packet">Packets</option>
                <option value="bottle">Bottles</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>{t.supplier}</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({...formData, supplier: e.target.value})}
              className="form-input"
            />
          </div>
        </form>

        <div className="modal-footer">
          <button type="button" onClick={onCancel} className="button-secondary">
            {t.cancel}
          </button>
          <button type="submit" onClick={handleSubmit} className="button-primary">
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};
