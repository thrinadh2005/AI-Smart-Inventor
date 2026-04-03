# 🛒 AI Smart Inventory Assistant

A comprehensive AI-powered inventory management solution specifically designed for Indian shops and small businesses. Features intelligent demand prediction, multilingual voice input (English, Telugu, Hindi), and complete offline capabilities.

## 🚀 **QUICK LOCAL LAUNCH**

### ⚡ One-Click Local Setup

**Prerequisites:**
- Node.js (v14 or higher) installed on your system

**Launch Commands:**
```bash
# 1. Clone the repository
git clone https://github.com/thrinadh2005/AI-Smart-Inventor.git
cd AI-Smart-Inventor

# 2. Install dependencies
npm install

# 3. Launch the application
npm start
```

**🌐 Access Points:**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

**📱 Mobile Access:**
Use your phone's browser and navigate to `http://YOUR_COMPUTER_IP:5173`

---

### 🎯 **Local Launch Button**

**Option 1: One-Click Script (Recommended)**

**For Linux/Mac:**
```bash
curl -sSL https://raw.githubusercontent.com/thrinadh2005/AI-Smart-Inventor/main/quick-start.sh | bash
```

**For Windows:**
```cmd
powershell -Command "iwr -useb https://raw.githubusercontent.com/thrinadh2005/AI-Smart-Inventor/main/quick-start.bat | cmd"
```

**Option 2: Manual Setup**
*Execute the steps in the "Launch Commands" section above for full control*

---

### 📱 **Mobile Access Setup**

1. **Find your computer's IP address:**
   - **Windows**: Open Command Prompt and type `ipconfig`
   - **Mac/Linux**: Open Terminal and type `ifconfig` or `hostname -I`

2. **Access from mobile:**
   - Open phone browser → `http://YOUR_COMPUTER_IP:5173`
   - Example: `http://192.168.1.100:5173`

3. **Enable mobile features:**
   - Voice input works on mobile Chrome
   - Touch-friendly interface
   - Offline capabilities

---

## 🌟 Key Features

### 🤖 AI-Powered Intelligence
- **Smart Demand Prediction**: Uses historical sales data and seasonal patterns to predict stockouts
- **Seasonal Adjustments**: Automatically adjusts for seasonal demand (e.g., summer drinks demand)
- **Confidence Scoring**: Shows prediction reliability based on data availability
- **Burn Rate Calculation**: Tracks daily consumption patterns with weighted algorithms

### 🎤 Voice Input Support
- **Multilingual Recognition**: English, Telugu, and Hindi voice commands
- **Smart Command Processing**: 
  - *"Sell 5 units of atta"* → Opens sale modal
  - *"Check stock of oil"* → Shows current inventory
  - *"Find cold drinks"* → Lists matching products
- **Number-to-Digit Conversion**: Converts spoken numbers to digits
- **Real-time Feedback**: Visual indicators for listening/processing states

### 📱 Mobile-First Design
- **Responsive Interface**: Works perfectly on smartphones and tablets
- **Touch-Friendly**: Large buttons and intuitive gestures
- **Progressive Web App**: Installable on mobile devices
- **Offline-First**: Complete functionality without internet

### 🇮🇳 Indian Context
- **Multilingual Support**: Full interface in English, Telugu, and Hindi
- **Local Product Names**: Pre-configured with Indian products (atta, dal, oil, biscuits)
- **Currency Support**: Indian Rupee (₹) formatting
- **Supplier Management**: Track local wholesalers and distributors

### 📊 Complete Management System
- **Dashboard**: Real-time stock overview with AI predictions
- **Inventory Management**: Add/edit products with search and filters
- **Sales Analytics**: Charts, revenue tracking, top products
- **Reorder Management**: AI-suggested quantities with WhatsApp integration

### 🌐 Offline Capabilities
- **IndexedDB Storage**: Complete local data persistence
- **Automatic Sync**: Syncs when internet is available
- **Queue Management**: Stores actions for later sync
- **Conflict Resolution**: Handles sync conflicts intelligently

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/thrinadh2005/AI-Smart-Inventor.git
   cd AI-Smart-Inventor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
AI-Smart-Inventor/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── InventoryPage.tsx
│   │   │   ├── SalesPage.tsx
│   │   │   ├── ReorderPage.tsx
│   │   │   ├── SalesModal.tsx
│   │   │   └── VoiceInput.tsx
│   │   ├── hooks/         # Custom React hooks
│   │   │   └── useOfflineSync.tsx
│   │   ├── services/      # Frontend services
│   │   │   ├── offlineStorage.ts
│   │   │   └── syncService.ts
│   │   ├── App.tsx        # Main application
│   │   └── App.css       # Styling
│   ├── package.json
│   └── vite.config.ts
├── server/                # Node.js backend
│   ├── index.js          # API server
│   └── package.json
├── package.json           # Root package configuration
└── README.md
```

## 🛠 Technology Stack

### Frontend
- **React 19**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool
- **React Router**: Client-side routing
- **Chart.js**: Data visualization
- **Lucide React**: Modern icons
- **Web Speech API**: Voice recognition
- **IndexedDB**: Offline storage

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **SQLite**: Lightweight database
- **nodemon**: Auto-restart development server

## 📱 User Guide

### Dashboard
- **Overview**: At-a-glance stock status and sales summary
- **Connection Status**: Shows online/offline and sync status
- **Quick Actions**: Add sales, view alerts, switch languages
- **Stock Indicators**: Visual warnings for low stock items

### Voice Commands
The system supports voice commands in three languages:

**English Examples:**
- *"Add sale"* → Opens sales modal
- *"Check stock of atta"* → Shows current stock
- *"Find cold drinks"* → Lists matching products
- *"Sell 5 units of oil"* → Pre-fills sale modal

**Telugu Examples:**
- *"అమ్మకం జోడించండి"* → Add sale
- *"ఆటా స్టాక్ తనిఖీ చేయండి"* → Check atta stock
- *"చల్లీ డ్రింక్స్ వెతకండి"* → Find cold drinks

**Hindi Examples:**
- *"बिक्री जोड़ें"* → Add sale
- *"आटा का स्टॉक जांचें"* → Check atta stock
- *"कोल्ड ड्रिंक खोजें"* → Find cold drinks

### Inventory Management
- **Add Products**: Create new inventory items with details
- **Edit Products**: Update stock levels, prices, suppliers
- **Search & Filter**: Find products quickly
- **AI Insights**: View burn rates and predictions

### Sales Analytics
- **Revenue Tracking**: Monitor daily, weekly, monthly sales
- **Product Performance**: Identify best-selling items
- **Customer Types**: Track retail vs wholesale sales
- **Visual Charts**: Interactive graphs and reports

### Reorder Management
- **Smart Suggestions**: AI-calculated reorder quantities
- **Urgency Levels**: Prioritize critical stockouts
- **WhatsApp Alerts**: Send reorder messages (setup required)
- **Cost Estimation**: Calculate total reorder costs

## 🤖 AI Features Explained

### Demand Prediction Algorithm
The AI uses a weighted approach:
- **70% Recent Sales**: Last 7 days of sales data
- **30% Historical**: 30-day average with seasonal adjustment
- **Seasonal Multipliers**: Pre-configured monthly demand factors

### Confidence Levels
- **High**: 10+ sales records in the last 30 days
- **Medium**: 5-10 sales records
- **Low**: Less than 5 sales records

### Seasonal Patterns
Automatically adjusts for known seasonal variations:
- **Summer**: Increased cold drinks demand (1.5x - 1.8x)
- **Festivals**: Higher staple foods demand
- **Monsoon**: Changes in product preferences

## 🌐 API Endpoints

### Products
- `GET /api/products` - Get all products with AI predictions
- `POST /api/products` - Add new product
- `PUT /api/products/:id` - Update product

### Sales
- `POST /api/sales` - Record new sale
- `GET /api/sales/analytics?period=7` - Get sales analytics

### Reorder
- `GET /api/reorder` - Get AI-generated reorder list
- `POST /api/alerts` - Create reorder alert

## 🚀 Deployment Guide

### Option 1: Vercel (Frontend) + Railway (Backend) - RECOMMENDED

#### Frontend Deployment (Vercel)
1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Build and Deploy**
   ```bash
   cd client
   npm run build
   vercel --prod
   ```

3. **Configure Environment Variables**
   - Add backend URL in Vercel dashboard: `VITE_API_URL=https://your-backend.railway.app`

#### Backend Deployment (Railway)
1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**
   ```bash
   railway login
   cd server
   railway deploy
   ```

3. **Environment Variables**
   - Set `NODE_ENV=production`
   - Configure `PORT=5000`

### Option 2: AWS Lightsail (Full Stack)

1. **Create AWS Lightsail Instance**
   - Choose Ubuntu 20.04 LTS
   - Select $3.50/month plan

2. **Setup Server**
   ```bash
   sudo apt update
   sudo apt install nodejs npm
   sudo npm install -g pm2 nginx
   ```

3. **Deploy Application**
   ```bash
   git clone https://github.com/thrinadh2005/AI-Smart-Inventor.git
   cd AI-Smart-Inventor
   npm install
   cd client && npm run build
   cd ..
   pm2 start npm --name "inventory-app" -- start
   ```

4. **Setup Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/inventory
   ```

5. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5173;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
       }
       
       location /api {
           proxy_pass http://localhost:5000;
       }
   }
   ```

6. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/inventory /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Option 3: Docker Deployment

1. **Create Dockerfile (Backend)**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY server/package*.json ./
   RUN npm install
   COPY server/ .
   EXPOSE 5000
   CMD ["npm", "start"]
   ```

2. **Create Dockerfile (Frontend)**
   ```dockerfile
   FROM node:18-alpine as build
   WORKDIR /app
   COPY client/package*.json ./
   RUN npm install
   COPY client/ .
   RUN npm run build
   
   FROM nginx:alpine
   COPY --from=build /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   EXPOSE 80
   ```

3. **Docker Compose**
   ```yaml
   version: '3.8'
   services:
     frontend:
       build: 
         context: .
         dockerfile: Dockerfile.frontend
       ports:
         - "80:80"
     backend:
       build: 
         context: .
         dockerfile: Dockerfile.backend
       ports:
         - "5000:5000"
   ```

4. **Deploy**
   ```bash
   docker-compose up -d
   ```

## 🔧 Configuration

### Environment Variables
Create `.env` file in server directory:
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=./inventory.db

# WhatsApp Business API (optional)
WHATSAPP_API_KEY=your_api_key
WHATSAPP_PHONE_NUMBER=your_business_number
```

### Frontend Environment
Create `.env.production` in client directory:
```env
VITE_API_URL=https://your-backend-domain.com
```

### WhatsApp Integration Setup
1. **Setup WhatsApp Business API**
   - Register on Meta for Developers
   - Create WhatsApp Business Account
   - Get API credentials

2. **Configure Webhook**
   - Set webhook URL to `https://your-domain.com/api/webhook`
   - Verify webhook endpoint

3. **Test Integration**
   - Send test messages
   - Verify delivery reports

## 📊 Performance Optimization

### Frontend Optimization
- **Code Splitting**: Lazy load components
- **Image Optimization**: Compress product images
- **Service Worker**: Cache static assets
- **Bundle Analysis**: Monitor bundle size

### Backend Optimization
- **Database Indexing**: Add indexes for queries
- **Caching**: Redis for frequently accessed data
- **Compression**: Gzip responses
- **Rate Limiting**: Prevent API abuse

## 🔒 Security Considerations

### Frontend Security
- **Input Validation**: Sanitize all inputs
- **XSS Protection**: Content Security Policy
- **Authentication**: JWT tokens for API access

### Backend Security
- **SQL Injection**: Use parameterized queries
- **CORS**: Configure allowed origins
- **Rate Limiting**: Prevent brute force attacks
- **Environment Variables**: Secure sensitive data

## 🐛 Troubleshooting

### Common Issues

#### Voice Input Not Working
- **Check Browser Support**: Chrome, Firefox, Edge
- **HTTPS Required**: Voice input needs secure context
- **Microphone Permissions**: Allow microphone access

#### Offline Sync Issues
- **Clear Browser Storage**: Reset IndexedDB
- **Check Network**: Ensure internet connectivity
- **Verify API**: Backend must be accessible

#### Database Issues
- **File Permissions**: Ensure write access
- **SQLite Version**: Use compatible version
- **Backup Data**: Regular database backups

### Debug Mode
Enable debug logging:
```bash
DEBUG=* npm start
```

## 📈 Monitoring and Analytics

### Application Monitoring
- **Error Tracking**: Sentry for error monitoring
- **Performance**: Web Vitals for frontend
- **Uptime**: Ping services for backend

### User Analytics
- **Usage Patterns**: Track feature usage
- **Voice Commands**: Analyze voice queries
- **Offline Usage**: Monitor offline behavior

## 🤝 Contributing

### Development Setup
1. **Fork Repository**
   ```bash
   git clone https://github.com/yourusername/AI-Smart-Inventor.git
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

4. **Make Changes**
   - Create feature branch
   - Make your changes
   - Add tests
   - Submit pull request

### Code Style
- **TypeScript**: Use strict mode
- **ESLint**: Follow linting rules
- **Prettier**: Format code consistently
- **Comments**: Document complex logic

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Getting Help
1. **Documentation**: Read this README thoroughly
2. **Issues**: Check existing GitHub issues
3. **Discussions**: Start a new discussion
4. **Email**: Contact maintainers directly

### Community
- **GitHub Discussions**: Feature requests and general questions
- **Issues**: Bug reports and technical issues
- **Wiki**: Additional documentation and guides

## 🔮 Future Roadmap

### Phase 3 (Planned)
- **Supplier Portal**: Web portal for suppliers
- **Barcode Scanning**: Camera-based product identification
- **Multi-Store Management**: Manage multiple locations
- **GST Compliance**: Indian tax compliance features
- **Advanced Analytics**: Machine learning insights
- **Mobile App**: Native Android/iOS applications

### Phase 4 (Long-term)
- **IoT Integration**: Smart shelves and sensors
- **Predictive Analytics**: Advanced ML models
- **Marketplace**: Connect with suppliers
- **Financial Integration**: Accounting software integration

## 📞 Contact

- **GitHub**: https://github.com/thrinadh2005/AI-Smart-Inventor
- **Issues**: https://github.com/thrinadh2005/AI-Smart-Inventor/issues
- **Discussions**: https://github.com/thrinadh2005/AI-Smart-Inventor/discussions

---

**Built with ❤️ for Indian shopkeepers and small businesses**

## 🎯 Quick Deployment Summary

### For Immediate Deployment:
1. **Vercel + Railway** (Recommended for beginners)
2. **AWS Lightsail** (For full control)
3. **Docker** (For containerized deployment)

### One-Click Deployment:
```bash
# Deploy to Vercel
cd client && vercel --prod

# Deploy to Railway
cd server && railway deploy
```

### Production Checklist:
- [ ] Set environment variables
- [ ] Configure domain names
- [ ] Setup SSL certificates
- [ ] Configure monitoring
- [ ] Test all features
- [ ] Backup database
- [ ] Update documentation

The application is production-ready and can be deployed immediately using any of the above methods! 🚀
