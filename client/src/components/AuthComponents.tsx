import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, Phone, MapPin, CreditCard, Eye, EyeOff, LogOut, Settings, X } from 'lucide-react';
import axios from 'axios';

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

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
  onAuthSuccess: (user: User, token: string) => void;
  language: 'EN' | 'TE' | 'HI';
}

const translations = {
  EN: {
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    name: 'Full Name',
    phone: 'Phone Number',
    shopName: 'Shop Name',
    shopAddress: 'Shop Address',
    businessType: 'Business Type',
    kirana: 'Kirana Store',
    general: 'General Store',
    pharmacy: 'Pharmacy',
    restaurant: 'Restaurant',
    haveAccount: 'Already have an account?',
    noAccount: "Don't have an account?",
    signIn: 'Sign In',
    signUp: 'Sign Up',
    forgotPassword: 'Forgot Password?',
    rememberMe: 'Remember Me',
    loginSuccess: 'Login successful!',
    registerSuccess: 'Registration successful!',
    error: 'Error',
    loading: 'Loading...'
  },
  TE: {
    login: 'లాగిన్',
    register: 'నమోదీరా',
    email: 'ఇమెయిల్',
    password: 'పాస్వర్డ',
    confirmPassword: 'పాస్వర్డను నిర్డి',
    name: 'పూర్త పేరు',
    phone: 'ఫోన్ నంబర్',
    shopName: 'దుకాణి పేరు',
    shopAddress: 'దుకాణి చిరు',
    businessType: 'వ్యవసాయ రకం',
    kirana: 'కిరాణా',
    general: 'సాధారణా',
    pharmacy: 'ఔషధం',
    restaurant: 'హోటల్',
    haveAccount: 'ఖాతరా ఉందా?',
    noAccount: 'ఖాతరా లేదా?',
    signIn: 'లాగిన్',
    signUp: 'నమోదీరా',
    forgotPassword: 'పాస్వర్డ మర్చిండి?',
    rememberMe: 'గుర్చిండి',
    loginSuccess: 'లాగిన్ విజయవం!',
    registerSuccess: 'నమోదీరా విజయవం!',
    error: 'లోపాజి',
    loading: 'లోడౌచు'
  },
  HI: {
    login: 'लॉगिन',
    register: 'रजिस्टर करें',
    email: 'ईमेल',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि',
    name: 'पूरा नाम',
    phone: 'फोन नंबर',
    shopName: 'दुकान का नाम',
    shopAddress: 'दुकान का पता',
    businessType: 'व्यवसाय रख',
    kirana: 'किराना स्टोर',
    general: 'सामान्य दुकान',
    pharmacy: 'फार्मेसी',
    restaurant: 'रेस्टोरांट',
    haveAccount: 'पहले से हैं?',
    noAccount: 'अभी तक नहीं?',
    signIn: 'साइन इन करें',
    signUp: 'साइन अप करें',
    forgotPassword: 'पासवर्ड भूल गए?',
    rememberMe: 'याद रखें',
    loginSuccess: 'लॉगिन सफल',
    registerSuccess: 'रजिस्ट्रेशन सफल!',
    error: 'त्रुटि',
    loading: 'लोड हो रहा है'
  }
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  mode,
  onAuthSuccess,
  language
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    shopName: '',
    shopAddress: '',
    businessType: 'kirana'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const t = translations[language];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = t.email + ' is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';

    if (!formData.password) newErrors.password = t.password + ' is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (mode === 'register') {
      if (!formData.name) newErrors.name = t.name + ' is required';
      if (!formData.confirmPassword) newErrors.confirmPassword = t.confirmPassword + ' is required';
      else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const data = mode === 'login' 
        ? { email: formData.email, password: formData.password }
        : {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            phone: formData.phone,
            shopName: formData.shopName,
            shopAddress: formData.shopAddress,
            businessType: formData.businessType
          };

      const response = await axios.post(`http://localhost:5000${endpoint}`, data);
      
      if (response.data.success) {
        onAuthSuccess(response.data.user, response.data.token);
        onClose();
      }
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.error || t.error });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{mode === 'login' ? t.login : t.register}</h3>
          <button onClick={onClose} className="icon-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>{t.email}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="your@email.com"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>{t.password}</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="icon-btn"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          {mode === 'register' && (
            <>
              <div className="form-group">
                <label>{t.confirmPassword}</label>
                <div className="password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="•••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="icon-btn"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              <div className="form-group">
                <label>{t.name}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Your full name"
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>{t.phone}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="form-input"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="form-group">
                <label>{t.shopName}</label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) => handleInputChange('shopName', e.target.value)}
                  className="form-input"
                  placeholder="My Kirana Store"
                />
              </div>

              <div className="form-group">
                <label>{t.shopAddress}</label>
                <textarea
                  value={formData.shopAddress}
                  onChange={(e) => handleInputChange('shopAddress', e.target.value)}
                  className="form-input"
                  placeholder="123 Main Street, City, State"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>{t.businessType}</label>
                <select
                  value={formData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  className="form-input"
                >
                  <option value="kirana">{t.kirana}</option>
                  <option value="general">{t.general}</option>
                  <option value="pharmacy">{t.pharmacy}</option>
                  <option value="restaurant">{t.restaurant}</option>
                </select>
              </div>
            </>
          )}

          {errors.submit && <div className="error-message">{errors.submit}</div>}

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="button-secondary">
              {mode === 'login' ? t.signIn : t.signUp}
            </button>
            <button type="submit" className="button-primary" disabled={loading}>
              {loading ? t.loading : (mode === 'login' ? t.signIn : t.signUp)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface UserProfileProps {
  user: User | null;
  onLogout: () => void;
  language: 'EN' | 'TE' | 'HI';
  onUpdateProfile: (updates: Partial<User>) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onLogout,
  language,
  onUpdateProfile
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    shopName: user?.shopName || '',
    shopAddress: user?.shopAddress || '',
    businessType: user?.businessType || 'kirana'
  });
  const [loading, setLoading] = useState(false);

  const t = translations[language];

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdateProfile(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  if (!user) return null;

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="user-info">
          <div className="user-avatar">
            <User size={32} />
          </div>
          <div>
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <p className="user-plan">{user.subscriptionPlan} Plan</p>
          </div>
        </div>
        <div className="profile-actions">
          <button className="icon-btn" onClick={handleLogout} title={language === 'EN' ? 'Logout' : language === 'TE' ? 'లాగిన్' : 'लॉगिन'}>
            <LogOut size={20} />
          </button>
          <button className="icon-btn" title={language === 'EN' ? 'Settings' : language === 'TE' ? 'సెటిండల' : 'सेटिंग'}>
            <Settings size={20} />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="edit-profile-form">
          <div className="form-group">
            <label>{t.name}</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>{t.phone}</label>
            <input
              type="tel"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>{t.shopName}</label>
            <input
              type="text"
              value={editForm.shopName}
              onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>{t.shopAddress}</label>
            <textarea
              value={editForm.shopAddress}
              onChange={(e) => setEditForm({ ...editForm, shopAddress: e.target.value })}
              className="form-input"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>{t.businessType}</label>
            <select
              value={editForm.businessType}
              onChange={(e) => setEditForm({ ...editForm, businessType: e.target.value })}
              className="form-input"
            >
              <option value="kirana">{t.kirana}</option>
              <option value="general">{t.general}</option>
              <option value="pharmacy">{t.pharmacy}</option>
              <option value="restaurant">{t.restaurant}</option>
            </select>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="button-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="button-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      ) : (
        <div className="profile-details">
          <div className="detail-section">
            <h4>Contact Information</h4>
            <div className="detail-item">
              <span className="detail-label">{t.phone}:</span>
              <span>{user.phone || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{t.email}:</span>
              <span>{user.email}</span>
            </div>
          </div>

          <div className="detail-section">
            <h4>Business Information</h4>
            <div className="detail-item">
              <span className="detail-label">{t.shopName}:</span>
              <span>{user.shopName || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{t.shopAddress}:</span>
              <span>{user.shopAddress || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{t.businessType}:</span>
              <span>{user.businessType || 'Kirana Store'}</span>
            </div>
          </div>

          <div className="detail-section">
            <button
              onClick={() => setIsEditing(true)}
              className="button-primary"
            >
              Edit Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default { AuthModal, UserProfile };
