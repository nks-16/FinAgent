# Quick Start Guide - Financial Insights System

## 🚀 Starting the Application

### Option 1: Docker Compose (Recommended)

```powershell
# Make sure Docker Desktop is running, then:
docker-compose up --build
```

This will start all services:
- ✅ Python FastAPI → http://localhost:8000
- ✅ Java Spring Boot → http://localhost:8080
- ✅ React Frontend → http://localhost:3000
- ✅ MySQL Database
- ✅ MongoDB (Chat History)
- ✅ ChromaDB (Vector Store)

### Option 2: Manual (For Development/Testing)

**Terminal 1 - Java Backend**:
```powershell
cd backend
./mvnw spring-boot:run
```

**Terminal 2 - Python Backend**:
```powershell
# Set environment variables first
$env:GEMINI_API_KEY="your-key-here"
$env:LLM_PROVIDER="gemini"
$env:DATABASE_URL="mysql+pymysql://root:root@localhost:3306/finagent"
$env:MONGODB_URL="mongodb://finagent:finagent@localhost:27017/finagent_conversations?authSource=admin"

# Run the app
uvicorn app.main:app --reload --port 8000
```

**Terminal 3 - React Frontend**:
```powershell
cd frontend
npm install
npm run dev
```

## 🧪 Testing the New Features

### 1. Test Java Backend Health

```powershell
# Should return: {"status":"healthy","service":"Financial Insights API"}
curl http://localhost:8080/api/financial-insights/health
```

### 2. Test News Scraping

```powershell
# Get general financial news (5 articles from 3 sources)
curl http://localhost:8080/api/financial-insights/news?limit=5

# Get personalized news based on categories
curl -X POST http://localhost:8080/api/financial-insights/news/personalized `
  -H "Content-Type: application/json" `
  -d '{\"categories\":[\"groceries\",\"housing\",\"investment\"],\"limit\":10}'
```

### 3. Test Market Data

```powershell
# Get market indices (S&P 500, Dow, NASDAQ, Gold, Oil)
curl http://localhost:8080/api/financial-insights/markets/indices

# Get cryptocurrency prices (BTC, ETH, BNB)
curl http://localhost:8080/api/financial-insights/markets/crypto

# Get custom stock watchlist
curl -X POST http://localhost:8080/api/financial-insights/markets/watchlist `
  -H "Content-Type: application/json" `
  -d '{\"symbols\":[\"AAPL\",\"TSLA\",\"GOOGL\"]}'
```

## 🖥️ Using the Frontend

### 1. Access the Dashboard
1. Navigate to http://localhost:3000
2. Login or signup
3. You'll see the Dashboard with 4 summary cards

### 2. View Financial News
1. Click the **📰 Financial News** tab in the navbar
2. You'll see 3 tabs:
   - **📰 News**: Personalized articles from Yahoo, Investopedia, MarketWatch
   - **📈 Market Indices**: S&P 500, Dow, NASDAQ, Gold, Oil prices
   - **₿ Crypto**: Bitcoin, Ethereum, BNB prices
3. Click "Refresh Data" to reload latest information

### 3. Use Personalized AI Chat
1. Click **💬 Chat** in the navbar
2. Notice the dark-only theme and "Personalized AI" badge
3. Ask financial questions like:
   - "What's my current financial situation?"
   - "Should I invest more in stocks?"
   - "How can I reduce my expenses?"
4. AI will respond with context from your:
   - Account balances
   - Monthly income/expenses
   - Financial goals
   - Spending categories

## 🎨 Features to Verify

### ✅ Chat (Dark Mode Only)
- [x] No light theme toggle (removed completely)
- [x] Dark background (gray-900)
- [x] Purple accent color for user messages
- [x] "Personalized AI" badge visible
- [x] Emoji icons (💬, 📊)
- [x] Smooth dark theme throughout

### ✅ Dashboard News Section
- [x] "📰 Financial News" tab in navbar
- [x] View toggles between Dashboard and News
- [x] News tab shows latest articles
- [x] Market tab shows live indices
- [x] Crypto tab shows cryptocurrency prices
- [x] Refresh button works
- [x] External article links open in new tab

### ✅ Personalized Content
- [x] News filtered by your spending categories
- [x] Chat includes your financial context
- [x] AI responses are context-aware

## 📊 Sample Test Flow

1. **Create Some Data**:
   ```
   Dashboard → Add Account → "Checking" with $5,000
   Dashboard → Add Transaction → Income $3,000 (category: salary)
   Dashboard → Add Transaction → Expense $500 (category: groceries)
   Dashboard → Add Goal → "Emergency Fund" $10,000
   ```

2. **View Financial News**:
   ```
   Dashboard → 📰 Financial News tab
   - Should see news about groceries, personal finance
   - Market indices should display current prices
   - Crypto prices should show BTC, ETH, BNB
   ```

3. **Test Personalized Chat**:
   ```
   Chat → Ask: "What's my financial status?"
   - Should mention $5,000 balance
   - Should reference $3,000 income
   - Should mention grocery spending
   - Should discuss emergency fund goal
   ```

## 🐛 Common Issues & Fixes

### Issue: Java backend won't start

**Symptoms**: Port 8080 not responding

**Fix**:
```powershell
# Check if port is in use
netstat -ano | findstr :8080

# If something is using it, kill the process or change port in application.properties
```

### Issue: News section shows error

**Symptoms**: "Unable to load financial insights"

**Fix**:
1. Verify Java backend is running:
   ```powershell
   curl http://localhost:8080/api/financial-insights/health
   ```
2. Check browser console for CORS errors
3. Ensure internet connection (for web scraping)

### Issue: Chat not personalized

**Symptoms**: AI doesn't mention your financial data

**Fix**:
1. Ensure you have created accounts, transactions, goals
2. Check Python backend logs
3. Verify MongoDB is connected (chat history storage)

### Issue: Frontend build errors

**Symptoms**: "Cannot find module 'NewsSection'"

**Fix**:
```powershell
cd frontend
npm install
npm run dev
```

## 📝 Quick Test Commands

**Test everything at once** (PowerShell):
```powershell
# Test Java backend
Write-Host "Testing Java Backend..." -ForegroundColor Cyan
curl http://localhost:8080/api/financial-insights/health

Write-Host "`nFetching News..." -ForegroundColor Cyan
curl http://localhost:8080/api/financial-insights/news?limit=3

Write-Host "`nFetching Market Data..." -ForegroundColor Cyan
curl http://localhost:8080/api/financial-insights/markets/indices

Write-Host "`nFetching Crypto Prices..." -ForegroundColor Cyan
curl http://localhost:8080/api/financial-insights/markets/crypto

Write-Host "`nAll tests complete!" -ForegroundColor Green
```

## 🎯 What to Expect

### News Articles:
- **Title**: Article headline
- **Description**: Brief summary
- **Source**: Yahoo Finance, Investopedia, or MarketWatch
- **Category**: Topic (e.g., "personal-finance", "real-estate")
- **Date**: Publication date
- **Link**: Click to read full article

### Market Indices:
- **Symbol**: ^GSPC, ^DJI, ^IXIC, GC=F, CL=F
- **Current Price**: Real-time value
- **Change %**: Green ↑ (positive) or Red ↓ (negative)
- **Last Updated**: Timestamp

### Cryptocurrency:
- **Name**: Bitcoin, Ethereum, Binance Coin
- **Symbol**: BTC-USD, ETH-USD, BNB-USD
- **Current Price**: Real-time value
- **24h Change**: Percentage change
- **Volume**: Trading volume

## 🏆 Success Indicators

✅ All Docker containers running
✅ Java backend responds to health check
✅ Python backend API accessible
✅ Frontend loads without errors
✅ News section displays articles
✅ Market data shows live prices
✅ Chat has dark theme only
✅ Chat responses include your financial context

## 📞 Need Help?

1. Check logs:
   ```powershell
   docker-compose logs backend    # Java Spring Boot logs
   docker-compose logs agent      # Python FastAPI logs
   docker-compose logs frontend   # React logs
   ```

2. Restart specific service:
   ```powershell
   docker-compose restart backend
   ```

3. Full restart:
   ```powershell
   docker-compose down
   docker-compose up --build
   ```

---

**Ready to go!** Open http://localhost:3000 and explore your new financial insights system! 🚀
