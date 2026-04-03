import React, { useState } from 'react';
import { User as UserIcon, Lock, Mail, Phone, MapPin, Eye, EyeOff, LogOut } from 'lucide-react';
import api from '../services/api';

export interface User {
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

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'register';
  onAuthSuccess: (user: User, token: string) => void;
  language: 'EN' | 'TE' | 'HI';
}

const translations = {
  EN: { login: 'Login', register: 'Register', email: 'Email', password: 'Password', confirmPassword: 'Confirm Password', name: 'Full Name', phone: 'Phone Number', shopName: 'Shop Name', shopAddress: 'Shop Address', businessType: 'Business Type', kirana: 'Kirana Store', general: 'General Store', pharmacy: 'Pharmacy', restaurant: 'Restaurant', haveAccount: 'Already have an account?', noAccount: "Don't have an account?", signIn: 'Sign In', signUp: 'Sign Up', forgotPassword: 'Forgot Password?', rememberMe: 'Remember Me', loginSuccess: 'Login successful!', registerSuccess: 'Registration successful!', error: 'Error', loading: 'Loading...' },
  TE: { login: 'లాగిన్', register: 'నమోదీరా', email: 'ఇమెయిల్', password: 'పాస్వర్డ', confirmPassword: 'పాస్వర్డ నిర్డి', name: 'పూర్త పేరు', phone: 'ఫోన్ నంబర్', shopName: 'దుకాణి పేరు', shopAddress: 'దుకాణి చిరు', businessType: 'వ్యవసాయ రకం', kirana: 'కిరాణా', general: 'సాధారణా', pharmacy: 'ఔషధం', restaurant: 'హోటల్', haveAccount: 'ఖాతరా ఉందా?', noAccount: 'ఖాతరా లేదా?', signIn: 'లాగిన్', signUp: 'నమోదీరా', forgotPassword: 'పాస్వర్డ మర్చిండి?', rememberMe: 'గుర్చిండి', loginSuccess: 'లాగిన్ విజయవం!', registerSuccess: 'నమోదీరా విజయవం!', error: 'లోపాజి', loading: 'లోడౌచు' },
  HI: { login: 'लॉगिन', register: 'रजिस्टर करें', email: 'ईमेल', password: 'पासवर्ड', confirmPassword: 'पासवर्ड की पुष्टि', name: 'पूरा नाम', phone: 'फोन नंबर', shopName: 'दुकान का नाम', shopAddress: 'दुकान का पता', businessType: 'व्यवसाय रख', kirana: 'किराना स्टोर', general: 'सामान्य दुकान', pharmacy: 'फार्मेसी', restaurant: 'रेस्टोरांट', haveAccount: 'पहले से हैं?', noAccount: 'अभी तक नहीं?', signIn: 'साइन इन करें', signUp: 'साइन अप करें', forgotPassword: 'पासवर्ड भूल गए?', rememberMe: 'याद रखें', loginSuccess: 'लॉगिन सफल', registerSuccess: 'रजिस्ट्रेशन सफल!', error: 'त्रुटि', loading: 'लोड हो रहा है' }
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, mode: initialMode, onAuthSuccess, language }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
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
    if (!formData.password) newErrors.password = t.password + ' is required';
    if (mode === 'register') {
      if (!formData.name) newErrors.name = t.name + ' is required';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
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
      const response = await api.post(endpoint, data);
      if (response.data.success) {
        onAuthSuccess(response.data.user, response.data.token);
      }
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.error || t.error });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-form-container glass">
      <h2 style={{color: 'var(--primary)', marginBottom: '24px'}}>{mode === 'login' ? t.login : t.register}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label><Mail size={16} /> {t.email}</label>
          <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="form-input" required />
        </div>
        <div className="form-group">
          <label><Lock size={16} /> {t.password}</label>
          <div className="password-input">
            <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="form-input" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="icon-btn">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </div>
        {mode === 'register' && (
          <>
            <div className="form-group">
              <input type="password" placeholder={t.confirmPassword} value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="form-input" required />
            </div>
            <div className="form-group">
              <label><UserIcon size={16} /> {t.name}</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="form-input" required />
            </div>
            <div className="form-row">
               <div className="form-group">
                 <label><Phone size={16} /> {t.phone}</label>
                 <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="form-input" />
               </div>
               <div className="form-group">
                 <label><MapPin size={16} /> {t.shopName}</label>
                 <input type="text" value={formData.shopName} onChange={(e) => setFormData({...formData, shopName: e.target.value})} className="form-input" />
               </div>
            </div>
          </>
        )}
        {errors.submit && <p className="error-message">{errors.submit}</p>}
        <button type="submit" className="button-primary w-full" disabled={loading} style={{marginTop: '10px', width: '100%'}}>
           {loading ? t.loading : (mode === 'login' ? t.signIn : t.signUp)}
        </button>
        <div style={{marginTop: '20px', textAlign: 'center'}}>
           {mode === 'login' ? (
             <span>{t.noAccount} <button type="button" onClick={() => setMode('register')} className="link-button">{t.signUp}</button></span>
           ) : (
             <span>{t.haveAccount} <button type="button" onClick={() => setMode('login')} className="link-button">{t.signIn}</button></span>
           )}
        </div>
      </form>
    </div>
  );
};

export const UserProfile: React.FC<{ user: User; onLogout: () => void; language: string }> = ({ user, onLogout, language }) => {
  const t = translations[language as 'EN' | 'TE' | 'HI'] || translations.EN;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
           <div className="user-info">
             <h3>{user.name}</h3>
             <p>{user.email}</p>
           </div>
        </div>
        <div className="modal-body">
           <div className="detail-item"><strong>{t.phone}:</strong> {user.phone || 'N/A'}</div>
           <div className="detail-item"><strong>{t.shopName}:</strong> {user.shop_name || 'N/A'}</div>
           <div className="detail-item"><strong>{t.shopAddress}:</strong> {user.shop_address || 'N/A'}</div>
           <div className="detail-item"><strong>Plan:</strong> {user.subscription_plan}</div>
        </div>
        <div className="modal-footer">
          <button onClick={onLogout} className="button-secondary"><LogOut size={16} /> {t.login === 'Login' ? 'Logout' : 'లాగ్ అవుట్'}</button>
        </div>
      </div>
    </div>
  );
};
