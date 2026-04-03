import React, { useState } from 'react';
import { X, Plus, Minus, IndianRupee } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  stock: number;
  price: number;
  unit: string;
}

interface SalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSale: (productId: number, quantity: number, totalPrice: number) => void;
  language: 'EN' | 'TE' | 'HI';
}

const translations = {
  EN: {
    title: 'Add Sale',
    selectProduct: 'Select Product',
    quantity: 'Quantity',
    price: 'Price',
    total: 'Total',
    customerType: 'Customer Type',
    retail: 'Retail',
    wholesale: 'Wholesale',
    confirm: 'Confirm Sale',
    cancel: 'Cancel',
    outOfStock: 'Out of Stock'
  },
  TE: {
    title: 'అమ్మకం జోడించండి',
    selectProduct: 'ఉత్పత్తిని ఎంచుకోండి',
    quantity: 'పరిమాణం',
    price: '�ర',
    total: 'మొత్తం',
    customerType: 'కస్టమర్ రకం',
    retail: 'రిటైల్',
    wholesale: 'హోల్‌సేల్',
    confirm: 'అమ్మకాన్ని నిర్ధారించండి',
    cancel: 'రద్దు చేయండి',
    outOfStock: 'స్టాక్ లేదు'
  },
  HI: {
    title: 'बिक्री जोड़ें',
    selectProduct: 'उत्पाद चुनें',
    quantity: 'मात्रा',
    price: 'कीमत',
    total: 'कुल',
    customerType: 'ग्राहक प्रकार',
    retail: 'खुदरा',
    wholesale: 'थोक',
    confirm: 'बिक्री की पुष्टि करें',
    cancel: 'रद्द करें',
    outOfStock: 'स्टॉक खत्म'
  }
};

export const SalesModal: React.FC<SalesModalProps> = ({
  isOpen,
  onClose,
  products,
  onSale,
  language
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerType, setCustomerType] = useState<'retail' | 'wholesale'>('retail');
  const t = translations[language];

  if (!isOpen) return null;

  const totalPrice = selectedProduct ? selectedProduct.price * quantity : 0;
  const canSell = selectedProduct && selectedProduct.stock >= quantity;

  const handleConfirm = () => {
    if (selectedProduct && canSell) {
      onSale(selectedProduct.id, quantity, totalPrice);
      setSelectedProduct(null);
      setQuantity(1);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{t.title}</h3>
          <button onClick={onClose} className="icon-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>{t.selectProduct}</label>
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const product = products.find(p => p.id === parseInt(e.target.value));
                setSelectedProduct(product || null);
                setQuantity(1);
              }}
              className="form-input"
            >
              <option value="">{t.selectProduct}</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.stock} {product.unit} available)
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <>
              <div className="form-group">
                <label>{t.quantity}</label>
                <div className="quantity-input">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="icon-btn"
                    disabled={quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="form-input"
                    min="1"
                    max={selectedProduct.stock}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                    className="icon-btn"
                    disabled={quantity >= selectedProduct.stock}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {selectedProduct.stock < quantity && (
                  <p className="error-text">{t.outOfStock}</p>
                )}
              </div>

              <div className="form-group">
                <label>{t.customerType}</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="retail"
                      checked={customerType === 'retail'}
                      onChange={(e) => setCustomerType(e.target.value as 'retail' | 'wholesale')}
                    />
                    {t.retail}
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="wholesale"
                      checked={customerType === 'wholesale'}
                      onChange={(e) => setCustomerType(e.target.value as 'retail' | 'wholesale')}
                    />
                    {t.wholesale}
                  </label>
                </div>
              </div>

              <div className="price-summary">
                <div className="price-row">
                  <span>{t.price}:</span>
                  <span><IndianRupee size={16} />{selectedProduct.price}</span>
                </div>
                <div className="price-row">
                  <span>{t.quantity}:</span>
                  <span>{quantity} {selectedProduct.unit}</span>
                </div>
                <div className="price-row total">
                  <span>{t.total}:</span>
                  <span><IndianRupee size={16} />{totalPrice}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="button-secondary">
            {t.cancel}
          </button>
          <button
            onClick={handleConfirm}
            className="button-primary"
            disabled={!selectedProduct || !canSell}
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};
