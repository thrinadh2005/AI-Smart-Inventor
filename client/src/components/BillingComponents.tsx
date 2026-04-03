import React, { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, Calendar, Download, CheckCircle, AlertTriangle, Clock, DollarSign, Package, Users, Zap } from 'lucide-react';
import axios from 'axios';

interface Plan {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  features: any;
  max_products: number;
  max_users: number;
  api_calls_per_day: number;
  support_level: string;
}

interface Payment {
  paymentId: string;
  amount: number;
  planName: string;
  durationDays: number;
  status: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  planName: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  dueDate: string;
  status: string;
  paidDate?: string;
  createdAt: string;
}

interface BillingComponentsProps {
  language: 'EN' | 'TE' | 'HI';
  user: any;
  onPlanUpgrade: (planId: number) => void;
}

const translations = {
  EN: {
    choosePlan: 'Choose Your Plan',
    currentPlan: 'Current Plan',
    upgrade: 'Upgrade Plan',
    billing: 'Billing',
    subscriptionPlans: 'Subscription Plans',
    free: 'Free',
    basic: 'Basic',
    professional: 'Professional',
    enterprise: 'Enterprise',
    monthly: 'Monthly',
    yearly: 'Yearly',
    price: 'Price',
    features: 'Features',
    maxProducts: 'Max Products',
    maxUsers: 'Max Users',
    apiCalls: 'API Calls/day',
    support: 'Support Level',
    subscribe: 'Subscribe',
    upgradeNow: 'Upgrade Now',
    manageBilling: 'Manage Billing',
    viewInvoices: 'View Invoices',
    paymentHistory: 'Payment History',
    downloadInvoice: 'Download Invoice',
    payNow: 'Pay Now',
    pending: 'Pending',
    paid: 'Paid',
    overdue: 'Overdue',
    noInvoices: 'No invoices yet',
    perMonth: '/month',
    perYear: '/year',
    includesGST: 'Includes 18% GST',
    limitedTo: 'Limited to',
    unlimited: 'Unlimited',
    basicSupport: 'Email Support',
    prioritySupport: 'Priority Support',
    dedicatedSupport: '24/7 Support'
  },
  TE: {
    choosePlan: 'మీ మీ ఎంప ఎ్ండి',
    currentPlan: 'ప్రు ప్ల',
    upgrade: 'ప్రు ఎంప ప్ల',
    billing: 'బిలింగ్',
    subscriptionPlans: 'చంరంగ్ ప్ల',
    free: 'ఉచల',
    basic: 'బేసిక్',
    professional: 'ప్రొఫేసిం',
    enterprise: 'ఎంటటరై',
    monthly: 'నెల',
    yearly: 'సంవర్',
    price: 'ధర',
    features: 'ఫీచలల',
    maxProducts: 'గరింస',
    maxUsers: 'వాడింస',
    apiCalls: 'API కాలల/రోగ',
    support: 'మదుదు',
    subscribe: 'చంరంగ్ చేయి',
    upgradeNow: 'ఇప్గ్ రా చేయి',
    manageBilling: 'బిలింగ్ నిర్డి',
    viewInvoices: 'ఇన్వాలల',
    paymentHistory: 'భుగతా చిం',
    downloadInvoice: 'డౌనలోడ్',
    payNow: 'చెలచం',
    pending: 'బాయబడంగ్',
    paid: 'చుచం',
    overdue: 'గడుడంగ్',
    noInvoices: 'ఇన్వాలల లేదా',
    perMonth: '/నెల',
    perYear: '/సంవర్',
    includesGST: '18% GST',
    limitedTo: 'సీమిం',
    unlimited: 'అసీత',
    basicSupport: 'ఇమెయి మదుదు',
    prioritySupport: 'ప్రాడి మదుదు',
    dedicatedSupport: '24/7 మదుదు'
  },
  HI: {
    choosePlan: 'अपना अपना योज',
    currentPlan: 'वर्तमान',
    upgrade: 'अपग्रेड करें',
    billing: 'बिलिंग',
    subscriptionPlans: 'सबद्या',
    free: 'मुफ्त',
    basic: 'बेसिक',
    professional: 'पेशेशनल',
    enterprise: 'एंटरप्राइज',
    monthly: 'मासिक',
    yearly: 'वार्षिक',
    price: 'कीमत',
    features: 'विशेषेस',
    maxProducts: 'अधिक उత్ద',
    maxUsers: 'अधి ఉపయదర',
    apiCalls: 'API कॉल दिन',
    support: 'समर्थन',
    subscribe: 'सबद्या करें',
    upgradeNow: 'अभी अभी करें',
    manageBilling: 'बिलिंग प्रबंधన',
    viewInvoices: 'इनवॉइस',
    paymentHistory: 'भुगता',
    downloadInvoice: 'डाउनलोड్',
    payNow: 'अभी अభी करే',
    pending: 'बाकी',
    paid: 'चुका',
    overdue: 'अधి',
    noInvoices: 'అभీ ఇనవైఇస',
    perMonth: '/महीने',
    perYear: '/साल',
    includesGST: '18% GST',
    limitedTo: 'सीमित',
    unlimited: 'अసీత',
    basicSupport: 'ईमेल समर्थन',
    prioritySupport: 'प्राथॉरिटी समर्थन',
    dedicatedSupport: '24/7 समर्थन'
  }
};

export const PlanCard: React.FC<{ plan: Plan; isCurrent: boolean; onSelect: () => void; language: 'EN' | 'TE' | 'HI' }> = ({ plan, isCurrent, onSelect, language }) => {
  const t = translations[language];
  
  return (
    <div className={`plan-card ${isCurrent ? 'current' : ''}`}>
      <div className="plan-header">
        <h3>{plan.name}</h3>
        <div className="plan-price">
          <span className="price">₹{plan.price}</span>
          <span className="duration">{t.duration_days === 30 ? t.monthly : t.yearly}</span>
        </div>
        {isCurrent && <span className="current-badge">{t.currentPlan}</span>}
      </div>

      <div className="plan-features">
        <div className="feature-item">
          <CheckCircle size={16} className="feature-icon" />
          <span>{t.maxProducts}: {plan.max_products === -1 ? t.unlimited : `${plan.max_products} ${t.limitedTo}`}</span>
        </div>
        <div className="feature-item">
          <Users size={16} className="feature-icon" />
          <span>{t.maxUsers}: {plan.max_users === -1 ? t.unlimited : `${plan.max_users} ${t.limitedTo}`}</span>
        </div>
        <div className="feature-item">
          <TrendingUp size={16} className="credit-card" />
          <span>{t.apiCalls}: {plan.api_calls_per_day} {t.apiCalls}</span>
        </div>
        <div className="feature-item">
          <Package size={16} className="feature-icon" />
          <span>{t.support}: {t[plan.support_level]}</span>
        </div>
      </div>

      <div className="plan-features-list">
        {JSON.parse(plan.features).map((feature: string, index: number) => (
          <div key={index} className="feature-item">
            <CheckCircle size={14} className="feature-icon" />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <div className="plan-footer">
        <button 
          className={`plan-button ${isCurrent ? 'current' : 'primary'}`}
          onClick={onSelect}
          disabled={isCurrent}
        >
          {isCurrent ? t.currentPlan : (t.subscribe)}
        </button>
      </div>
    </div>
  );
};

export const BillingDashboard: React.FC<BillingComponentsProps> = ({ language, user, onPlanUpgrade }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingSummary, setBillingSummary] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const t = translations[language];

  useEffect(() => {
    fetchBillingData();
  }, [user]);

  const fetchBillingData = async () => {
    try {
      const [plansRes, billingRes, invoicesRes, paymentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/billing/plans'),
        axios.get(`http://localhost:5000/api/billing/subscription`),
        axios.get(`http://localhost:5000/api/billing/invoices`),
        axios.get(`http://localhost:5000/api/billing/payments`)
      ]);

      setPlans(plansRes.data.plans);
      setBillingSummary(billingRes.data.subscription);
      setInvoices(invoicesRes.data.invoices);
      setPayments(paymentsRes.data.payments);
    } catch (error) {
      console.error('Error fetching billing data:', error);
    }
  };

  const handlePlanSelect = (planId: number) => {
    const plan = plans.find(p => p.id === planId);
    if (plan && plan.price > 0) {
      setSelectedPlan(plan);
      setShowPaymentModal(true);
    } else if (plan) {
      // Free plan - upgrade immediately
      onPlanUpgrade(plan.id);
    }
  };

  const handlePayment = async (paymentMethod: string) => {
    if (!selectedPlan) return;

    try {
      const payment = await billingManager.createPayment(user.id, selectedPlan.id, paymentMethod);
      
      // In a real app, this would integrate with payment gateway
      // For demo, we'll simulate success
      const gatewayResponse = { status: 'success', transactionId: 'txn_' + Date.now() };
      
      const result = await billingManager.processPayment(payment.paymentId, gatewayResponse);
      
      if (result.status === 'completed') {
        setShowPaymentModal(false);
        setSelectedPlan(null);
        fetchBillingData();
      }
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return (
    <div className="billing-dashboard">
      <div className="billing-header">
        <h2>{t.billing}</h2>
        <div className="subscription-status">
          <span className={`status-badge ${billingSummary?.status || 'active'}`}>
            {billingSummary?.status || 'active'}
          </span>
          <span className="plan-name">{billingSummary?.currentPlan || 'Free'}</span>
        </div>
      </div>

      <div className="billing-grid">
        <div className="card billing-card">
          <h3>{t.currentPlan}</h3>
          <div className="subscription-details">
            <div className="detail-item">
              <span>{t.expires}:</span>
              <span>{billingSummary?.expires ? new Date(billingSummary.expires).toLocaleDateString() : 'Lifetime'}</span>
            </div>
            <div className="detail-item">
              <span>{t.apiCalls}:</span>
              <span>{billingSummary?.usageStats?.api_calls || 0} / 1000 / 1000 / billingSummary?.usageStats?.api_calls || 0} / 1000 / 1000}</span>
            </div>
          </div>
          <button className="button-primary" onClick={() => onPlanUpgrade()}>
            {t.upgradeNow}
          </button>
        </div>

        <div className="card billing-card">
          <h3>{t.subscriptionPlans}</h3>
          <div className="plans-grid">
            {plans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={plan.name === billingSummary?.currentPlan}
                onSelect={() => handlePlanSelect(plan.id)}
                language={language}
              />
            ))}
          </div>
        </div>

        <div className="card billing-card">
          <h3>{t.viewInvoices}</h3>
          {invoices.length === 0 ? (
            <div className="empty-state">
              <Package size={48} />
              <p>{t.noInvoices}</p>
            </div>
          ) : (
            <div className="invoices-list">
              {invoices.slice(0, 5).map(invoice => (
                <div key={invoice.id} className="invoice-item">
                  <div className="invoice-header">
                    <span className="invoice-number">{invoice.invoiceNumber}</span>
                    <span className={`status-badge ${invoice.status}`}>{invoice.status}</span>
                  </div>
                  <div className="invoice-details">
                    <div className="invoice-amount">₹{invoice.totalAmount}</div>
                    <div className="invoice-date">
                      <Calendar size={16} />
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="invoice-actions">
                    <button className="icon-btn" title={t.downloadInvoice}>
                      <Download size={16} />
                    </button>
                    {invoice.status === 'pending' && (
                      <button className="icon-btn" title={t.payNow}>
                        <CreditCard size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card billing-card">
          <h3>{t.paymentHistory}</h3>
          {payments.length === 0 ? (
            <div className="empty-state">
              <CreditCard size={48} />
              <p>No payment history yet</p>
            </div>
          ) : (
            <div className="payments-list">
              {payments.slice(0, 5).map(payment => (
                <div key={payment.id} className="payment-item">
                  <div className="payment-header">
                    <span className="payment-amount">₹{payment.amount}</span>
                    <span className={`status-badge ${payment.status}`}>{payment.status}</span>
                  </div>
                  <div className="payment-details">
                    <div className="payment-plan">{payment.planName}</div>
                    <div className="payment-date">
                      <Calendar size={16} />
                      {new Date(payment.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && selectedPlan && (
        <div className="payment-modal">
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Complete Your Subscription</h3>
                <button onClick={() => setShowPaymentModal(false)} className="icon-btn">
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="payment-summary">
                  <h4>Order Summary</h4>
                  <div className="summary-item">
                    <span>Plan:</span>
                    <span>{selectedPlan.name}</span>
                  </div>
                  <div className="summary-item">
                    <span>Duration:</span>
                    <span>{selectedPlan.duration_days} days</span>
                  </div>
                  <div className="summary-item">
                    <span>Amount:</span>
                    <span>₹{selectedPlan.price}</span>
                  </div>
                  <div className="summary-item">
                    <span>Tax:</span>
                    <span>₹{(selectedPlan.price * 0.18).toFixed(2)}</span>
                  </div>
                  <div className="summary-item total">
                    <span>Total:</span>
                    <span>₹{(selectedPlan.price * 1.18).toFixed(2)}</span>
                  </div>
                </div>

                <div className="payment-methods">
                  <h4>Select Payment Method</h4>
                  <div className="payment-options">
                    <button 
                      className="payment-option"
                      onClick={() => handlePayment('upi')}
                    >
                      <CreditCard size={20} />
                      UPI / Debit Card
                    </button>
                    <button 
                      className="payment-option"
                      onClick={() => handlePayment('wallet')}
                    >
                      <Wallet size={20} />
                      Wallet
                    </button>
                    <button 
                      className="payment-option"
                      onClick={() => handlePayment('netbanking')}
                    >
                      <Users size={20} />
                      Net Banking
                    </button>
                  </div>
                </div>

                <div className="modal-footer">
                  <button onClick={() => setShowPaymentModal(false)} className="button-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default { BillingDashboard, PlanCard };
