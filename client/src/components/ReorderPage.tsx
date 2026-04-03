import React, { useState, useEffect } from 'react';
import { ShoppingCart, AlertTriangle, Clock, CheckCircle, Send, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface ReorderItem {
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
  suggestedQuantity: number;
  urgency: 'immediate' | 'within_week';
  seasonalMultiplier: number;
}

interface ReorderPageProps {
  language: 'EN' | 'TE' | 'HI';
}

const translations = {
  EN: {
    title: 'Reorder Management',
    urgentReorders: 'Urgent Reorders',
    weeklyReorders: 'Weekly Reorders',
    suggestedQuantity: 'Suggested Quantity',
    currentStock: 'Current Stock',
    reorderLevel: 'Reorder Level',
    urgency: 'Urgency',
    immediate: 'Immediate',
    withinWeek: 'Within Week',
    supplier: 'Supplier',
    estimatedCost: 'Estimated Cost',
    sendWhatsApp: 'Send WhatsApp',
    markComplete: 'Mark Complete',
    refresh: 'Refresh',
    noReorders: 'No reorders needed at the moment',
    aiSuggestion: 'AI Suggestion',
    seasonalDemand: 'Seasonal Demand Factor',
    daysLeft: 'Days Left',
    burnRate: 'Daily Usage',
    totalEstimatedCost: 'Total Estimated Cost',
    itemsToReorder: 'Items to Reorder'
  },
  TE: {
    title: 'రీఆర్డర్ నిర్వహణ',
    urgentReorders: 'అత్యవసర రీఆర్డర్లు',
    weeklyReorders: 'వారాంతపు రీఆర్డర్లు',
    suggestedQuantity: 'సూచించిన పరిమాణం',
    currentStock: 'ప్రస్తుత స్టాక్',
    reorderLevel: 'రీఆర్డర్ స్థాయి',
    urgency: 'అత్యవసరత',
    immediate: 'వెంటనే',
    withinWeek: 'వారంలోపు',
    supplier: 'సరఫరాదారు',
    estimatedCost: 'అంచనా ధర',
    sendWhatsApp: 'వాట్సాప్ పంపండి',
    markComplete: 'పూర్తిగా మార్క్ చేయండి',
    refresh: 'రిఫ్రెష్ చేయండి',
    noReorders: 'ప్రస్తుతం రీఆర్డర్లు అవసరం లేదు',
    aiSuggestion: 'AI సూచన',
    seasonalDemand: 'సీజనల్ డిమాండ్ ఫాక్టర్',
    daysLeft: 'మిగిలిన రోజులు',
    burnRate: 'రోజువారీ వినియోగం',
    totalEstimatedCost: 'మొత్తం అంచనా ధర',
    itemsToReorder: 'రీఆర్డర్ చేయాల్సిన వస్తువులు'
  },
  HI: {
    title: 'रीऑर्डर प्रबंधन',
    urgentReorders: 'तत्काल रीऑर्डर',
    weeklyReorders: 'साप्ताहिक रीऑर्डर',
    suggestedQuantity: 'सुझाई गई मात्रा',
    currentStock: 'वर्तमान स्टॉक',
    reorderLevel: 'रीऑर्डर स्तर',
    urgency: 'तात्कालिकता',
    immediate: 'तत्काल',
    withinWeek: 'सप्ताह के भीतर',
    supplier: 'आपूर्तिकर्ता',
    estimatedCost: 'अनुमानित लागत',
    sendWhatsApp: 'व्हाट्सएप भेजें',
    markComplete: 'पूर्ण के रूप में चिह्नित करें',
    refresh: 'रिफ्रेश करें',
    noReorders: 'फिलहाल रीऑर्डर की आवश्यकता नहीं',
    aiSuggestion: 'AI सुझाव',
    seasonalDemand: 'सीज़नल डिमांड फैक्टर',
    daysLeft: 'बचे हुए दिन',
    burnRate: 'दैनिक उपयोग',
    totalEstimatedCost: 'कुल अनुमानित लागत',
    itemsToReorder: 'रीऑर्डर करने के लिए आइटम'
  }
};

export const ReorderPage: React.FC<ReorderPageProps> = ({ language }) => {
  const [reorderList, setReorderList] = useState<ReorderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingWhatsApp, setSendingWhatsApp] = useState<number | null>(null);
  
  const t = translations[language];

  useEffect(() => {
    fetchReorderList();
  }, []);

  const fetchReorderList = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/reorder');
      setReorderList(res.data);
    } catch (err) {
      console.error('Error fetching reorder list:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppMessage = async (item: ReorderItem) => {
    setSendingWhatsApp(item.id);
    try {
      const message = `🛒 *Reorder Alert*\n\n` +
        `*Product:* ${item.name}\n` +
        `*Current Stock:* ${item.stock} ${item.unit}\n` +
        `*Suggested Order:* ${item.suggestedQuantity} ${item.unit}\n` +
        `*Supplier:* ${item.supplier || 'Not specified'}\n` +
        `*Estimated Cost:* ₹${(item.suggestedQuantity * item.price).toFixed(2)}\n` +
        `*Urgency:* ${item.urgency === 'immediate' ? t.immediate : t.withinWeek}\n\n` +
        `AI suggests ordering ${item.suggestedQuantity} ${item.unit} to maintain optimal stock levels.`;

      // Here you would integrate with WhatsApp Business API
      console.log('WhatsApp message:', message);
      
      // Create alert in database
      await axios.post('http://localhost:5000/api/alerts', {
        productId: item.id,
        message: message
      });
      
      alert('WhatsApp message sent successfully!');
    } catch (err) {
      console.error('Error sending WhatsApp:', err);
      alert('Failed to send WhatsApp message');
    } finally {
      setSendingWhatsApp(null);
    }
  };

  const markAsComplete = async (itemId: number) => {
    try {
      // In a real app, you would update the reorder status
      setReorderList(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Error marking as complete:', err);
    }
  };

  const urgentItems = reorderList.filter(item => item.urgency === 'immediate');
  const weeklyItems = reorderList.filter(item => item.urgency === 'within_week');
  const totalEstimatedCost = reorderList.reduce((sum, item) => sum + (item.suggestedQuantity * item.price), 0);

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  if (loading) return <div className="loading">Loading reorder data...</div>;

  if (reorderList.length === 0) {
    return (
      <div className="reorder-page">
        <div className="page-header">
          <h1>{t.title}</h1>
          <button onClick={fetchReorderList} className="button-secondary">
            <RefreshCw size={18} /> {t.refresh}
          </button>
        </div>
               <div className="no-data">
          <CheckCircle size={48} />
          <p>{t.noReorders}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reorder-page">
      <div className="page-header">
        <h1>{t.title}</h1>
        <button onClick={fetchReorderList} className="button-secondary">
          <RefreshCw size={18} /> {t.refresh}
        </button>
      </div>

      <div className="reorder-summary">
        <div className="card summary-card">
          <h3>{t.itemsToReorder}</h3>
          <div className="summary-stats">
            <div className="stat">
              <span className="count">{reorderList.length}</span>
              <span className="label">Total Items</span>
            </div>
            <div className="stat">
              <span className="count urgent">{urgentItems.length}</span>
              <span className="label">{t.immediate}</span>
            </div>
            <div className="stat">
              <span className="count">{formatCurrency(totalEstimatedCost)}</span>
              <span className="label">{t.totalEstimatedCost}</span>
            </div>
          </div>
        </div>
      </div>

      {urgentItems.length > 0 && (
        <section className="reorder-section">
          <h2 className="section-title urgent">
            <AlertTriangle size={20} />
            {t.urgentReorders} ({urgentItems.length})
          </h2>
          <div className="reorder-grid">
            {urgentItems.map(item => (
              <ReorderCard
                key={item.id}
                item={item}
                onSendWhatsApp={sendWhatsAppMessage}
                onMarkComplete={markAsComplete}
                sendingWhatsApp={sendingWhatsApp}
                language={language}
                translations={t}
              />
            ))}
          </div>
        </section>
      )}

      {weeklyItems.length > 0 && (
        <section className="reorder-section">
          <h2 className="section-title">
            <Clock size={20} />
            {t.weeklyReorders} ({weeklyItems.length})
          </h2>
          <div className="reorder-grid">
            {weeklyItems.map(item => (
              <ReorderCard
                key={item.id}
                item={item}
                onSendWhatsApp={sendWhatsAppMessage}
                onMarkComplete={markAsComplete}
                sendingWhatsApp={sendingWhatsApp}
                language={language}
                translations={t}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

interface ReorderCardProps {
  item: ReorderItem;
  onSendWhatsApp: (item: ReorderItem) => void;
  onMarkComplete: (itemId: number) => void;
  sendingWhatsApp: number | null;
  language: 'EN' | 'TE' | 'HI';
  translations: any;
}

const ReorderCard: React.FC<ReorderCardProps> = ({
  item,
  onSendWhatsApp,
  onMarkComplete,
  sendingWhatsApp,
  language,
  translations: t
}) => {
  const estimatedCost = item.suggestedQuantity * item.price;
  const urgencyClass = item.urgency === 'immediate' ? 'urgent' : 'weekly';

  return (
    <div className={`reorder-card ${urgencyClass}`}>
      <div className="card-header">
        <h3>{item.name}</h3>
        <span className={`urgency-badge ${urgencyClass}`}>
          {item.urgency === 'immediate' ? t.immediate : t.withinWeek}
        </span>
      </div>

      <div className="card-content">
        <div className="stock-info">
          <div className="info-row">
            <span>{t.currentStock}:</span>
            <span className={item.stock <= item.min_stock ? 'low-stock' : ''}>
              {item.stock} {item.unit}
            </span>
          </div>
          <div className="info-row">
            <span>{t.reorderLevel}:</span>
            <span>{item.min_stock} {item.unit}</span>
          </div>
          <div className="info-row">
            <span>{t.suggestedQuantity}:</span>
            <span className="suggested">{item.suggestedQuantity} {item.unit}</span>
          </div>
        </div>

        <div className="ai-insights">
          <div className="insight-row">
            <span>{t.daysLeft}:</span>
            <span className={item.daysLeft <= 0 ? 'critical' : item.daysLeft <= 3 ? 'warning' : 'normal'}>
              {item.daysLeft <= 0 ? 'Out of stock' : `${item.daysLeft} days`}
            </span>
          </div>
          <div className="insight-row">
            <span>{t.burnRate}:</span>
            <span>{item.burnRate.toFixed(1)} {item.unit}/day</span>
          </div>
          {item.seasonalMultiplier > 1 && (
            <div className="insight-row seasonal">
              <span>{t.seasonalDemand}:</span>
              <span>×{item.seasonalMultiplier}</span>
            </div>
          )}
        </div>

        {item.supplier && (
          <div className="supplier-info">
            <span>{t.supplier}:</span>
            <span>{item.supplier}</span>
          </div>
        )}

        <div className="cost-estimate">
          <span>{t.estimatedCost}:</span>
          <span className="cost">₹{estimatedCost.toFixed(2)}</span>
        </div>
      </div>

      <div className="card-actions">
        <button
          className="button-whatsapp"
          onClick={() => onSendWhatsApp(item)}
          disabled={sendingWhatsApp === item.id}
        >
          {sendingWhatsApp === item.id ? (
            <RefreshCw size={16} className="spinning" />
          ) : (
            <Send size={16} />
          )}
          {t.sendWhatsApp}
        </button>
        <button
          className="button-complete"
          onClick={() => onMarkComplete(item.id)}
        >
          <CheckCircle size={16} />
          {t.markComplete}
        </button>
      </div>
    </div>
  );
};
