import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, DollarSign, Package, BarChart3, Filter } from 'lucide-react';
import axios from 'axios';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface SalesData {
  totalRevenue: number;
  totalQuantity: number;
  salesCount: number;
  topProducts: Array<{ name: string; quantity: number }>;
  sales: Array<{
    id: number;
    product_name: string;
    quantity: number;
    total_price: number;
    sale_date: string;
    customer_type: string;
  }>;
}

interface SalesPageProps {
  language: 'EN' | 'TE' | 'HI';
}

const translations = {
  EN: {
    title: 'Sales Analytics',
    totalRevenue: 'Total Revenue',
    totalSales: 'Total Sales',
    averageSale: 'Average Sale',
    topProducts: 'Top Products',
    recentSales: 'Recent Sales',
    last7Days: 'Last 7 Days',
    last30Days: 'Last 30 Days',
    last90Days: 'Last 90 Days',
    date: 'Date',
    product: 'Product',
    quantity: 'Quantity',
    amount: 'Amount',
    customer: 'Customer',
    retail: 'Retail',
    wholesale: 'Wholesale',
    salesTrend: 'Sales Trend',
    revenueByProduct: 'Revenue by Product',
    noData: 'No sales data available'
  },
  TE: {
    title: 'అమ్మకాల విశ్లేషణ',
    totalRevenue: 'మొత్తం ఆదాయం',
    totalSales: 'మొత్తం అమ్మకాలు',
    averageSale: 'సగటు అమ్మకం',
    topProducts: 'టాప్ ఉత్పత్తులు',
    recentSales: 'ఇటీవలి అమ్మకాలు',
    last7Days: 'గత 7 రోజులు',
    last30Days: 'గత 30 రోజులు',
    last90Days: 'గత 90 రోజులు',
    date: 'తేదీ',
    product: 'ఉత్పత్తి',
    quantity: 'పరిమాణం',
    amount: 'మొత్తం',
    customer: 'కస్టమర్',
    retail: 'రిటైల్',
    wholesale: 'హోల్‌సేల్',
    salesTrend: 'అమ్మకాల ధోరణి',
    revenueByProduct: 'ఉత్పత్తి ద్వారా ఆదాయం',
    noData: 'అమ్మకాల డేటా అందుబాటులో లేదు'
  },
  HI: {
    title: 'बिक्री विश्लेषण',
    totalRevenue: 'कुल राजस्व',
    totalSales: 'कुल बिक्री',
    averageSale: 'औसत बिक्री',
    topProducts: 'शीर्ष उत्पाद',
    recentSales: 'हाल की बिक्री',
    last7Days: 'पिछले 7 दिन',
    last30Days: 'पिछले 30 दिन',
    last90Days: 'पिछले 90 दिन',
    date: 'तारीख',
    product: 'उत्पाद',
    quantity: 'मात्रा',
    amount: 'राशि',
    customer: 'ग्राहक',
    retail: 'खुदरा',
    wholesale: 'थोक',
    salesTrend: 'बिक्री प्रवृत्ति',
    revenueByProduct: 'उत्पाद द्वारा राजस्व',
    noData: 'बिक्री डेटा उपलब्ध नहीं'
  }
};

export const SalesPage: React.FC<SalesPageProps> = ({ language }) => {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [period, setPeriod] = useState('7');
  const [loading, setLoading] = useState(true);
  
  const t = translations[language];

  useEffect(() => {
    fetchSalesData();
  }, [period]);

  const fetchSalesData = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/sales/analytics?period=${period}`);
      setSalesData(res.data);
    } catch (err) {
      console.error('Error fetching sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Prepare chart data
  const salesChartData = salesData ? {
    labels: salesData.sales.slice(0, 7).map(sale => formatDate(sale.sale_date)),
    datasets: [
      {
        label: 'Revenue',
        data: salesData.sales.slice(0, 7).map(sale => sale.total_price),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      }
    ]
  } : null;

  const productChartData = salesData ? {
    labels: salesData.topProducts.map(p => p.name),
    datasets: [
      {
        data: salesData.topProducts.map(p => p.quantity),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ],
        borderWidth: 0,
      }
    ]
  } : null;

  if (loading) return <div className="loading">Loading sales data...</div>;

  if (!salesData) {
    return (
      <div className="sales-page">
        <h1>{t.title}</h1>
        <div className="no-data">
          <Package size={48} />
          <p>{t.noData}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-page">
      <div className="page-header">
        <h1>{t.title}</h1>
        <div className="period-selector">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="form-input"
          >
            <option value="7">{t.last7Days}</option>
            <option value="30">{t.last30Days}</option>
            <option value="90">{t.last90Days}</option>
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#E8F5E8', color: '#2E7D32'}}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <p>{t.totalRevenue}</p>
            <h3>{formatCurrency(salesData.totalRevenue)}</h3>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#E3F2FD', color: '#1565C0'}}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <p>{t.totalSales}</p>
            <h3>{salesData.salesCount}</h3>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#FFF3E0', color: '#E65100'}}>
            <Package size={24} />
          </div>
          <div className="stat-info">
            <p>{t.totalSales}</p>
            <h3>{salesData.totalQuantity} units</h3>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{background: '#F3E5F5', color: '#6A1B9A'}}>
            <BarChart3 size={24} />
          </div>
          <div className="stat-info">
            <p>{t.averageSale}</p>
            <h3>{formatCurrency(salesData.totalRevenue / salesData.salesCount)}</h3>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="card chart-card">
          <h3>{t.salesTrend}</h3>
          {salesChartData && (
            <Line
              data={salesChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return '₹' + value;
                      }
                    }
                  }
                }
              }}
            />
          )}
        </div>

        <div className="card chart-card">
          <h3>{t.topProducts}</h3>
          {productChartData && (
            <Doughnut
              data={productChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          )}
        </div>
      </div>

      <div className="recent-sales-section">
        <div className="card">
          <h3>{t.recentSales}</h3>
          <div className="sales-table">
            <div className="table-header">
              <span>{t.date}</span>
              <span>{t.product}</span>
              <span>{t.quantity}</span>
              <span>{t.amount}</span>
              <span>{t.customer}</span>
            </div>
            <div className="table-body">
              {salesData.sales.slice(0, 10).map(sale => (
                <div key={sale.id} className="table-row">
                  <span>{formatDate(sale.sale_date)}</span>
                  <span>{sale.product_name}</span>
                  <span>{sale.quantity}</span>
                  <span>{formatCurrency(sale.total_price)}</span>
                  <span>
                    <span className={`customer-type ${sale.customer_type}`}>
                      {sale.customer_type === 'retail' ? t.retail : t.wholesale}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
