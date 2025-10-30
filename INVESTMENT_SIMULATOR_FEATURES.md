# Investment Simulator - Feature Documentation

## 🚀 Complete Feature Set

The Investment Simulator is a comprehensive financial planning tool with 5 powerful modules:

---

## 1. 📊 **Configure Portfolio**

**Purpose**: Set up your investment parameters and asset allocation

### Features:
- **Investment Parameters**
  - Initial Investment: $1K - $1M (slider + manual input)
  - Monthly Contribution: $0 - $10K
  - Time Horizon: 1-50 years
  - Simulation Mode: Simple, Monte Carlo, Optimistic, Pessimistic

- **Advanced Options**
  - Inflation adjustment (toggle + rate slider 0-10%)
  - Portfolio rebalancing (toggle)

- **Asset Allocation**
  - 7 asset classes: Stocks, Bonds, REITs, Cash, Crypto, International, Commodities
  - Color-coded sliders with live allocation bars
  - Real-time validation (must total 100%)
  - Quick presets: Conservative, Moderate, Aggressive
  - Auto-normalize button

- **Real-time Updates**
  - Auto-runs simulation 800ms after parameter changes
  - Live validation feedback
  - Dark mode support throughout

---

## 2. 📈 **View Results**

**Purpose**: Analyze detailed simulation outcomes

### Features:
- **Summary Cards** (gradient, dark mode)
  - Final Portfolio Value
  - Total Returns
  - Total Contributions
  - Average Annual Return

- **Monte Carlo Statistics** (when applicable)
  - Best Case, Median, Worst Case
  - Standard Deviation
  - Sharpe Ratio
  - Maximum Drawdown
  - Probability of Success

- **Yearly Projections Table**
  - Year-by-year portfolio value
  - Annual contributions and returns
  - Real value (inflation-adjusted)
  - Asset breakdown by year
  - Interactive hover effects

- **Action Buttons**
  - Add to Comparison (with success toast + auto-navigation)
  - Modify Parameters
  - View All Scenarios (shows count)

---

## 3. 🔄 **Compare Scenarios**

**Purpose**: Compare multiple investment strategies side-by-side

### Features:
- **Comparison Summary Panel**
  - Best Outcome (highest final value)
  - Average across all scenarios
  - Conservative (lowest final value)

- **Scenario Cards**
  - Color-coded indicators (blue, green, purple, orange)
  - Initial investment & monthly contribution
  - Time horizon & simulation mode
  - Final portfolio value (large, prominent)
  - Total returns
  - ROI percentage calculation
  - Individual remove buttons (✕)
  - Hover effects for better UX

- **Management**
  - "Add New Scenario" quick button
  - "Clear All" to reset
  - Empty state with call-to-action
  - Responsive grid (1/2/3 columns)

---

## 4. ⚡ **What-If Analysis** (NEW!)

**Purpose**: See real-time impact of changing individual parameters

### Features:
- **Parameter Selection** (4 options with emoji cards)
  - 💰 Initial Investment ($5K - $250K in 6 steps)
  - 📅 Monthly Contribution ($250 - $5K in 6 steps)
  - ⏰ Time Horizon (5 - 30 years in 6 steps)
  - 📊 Stock Allocation (30% - 80% in 6 steps)

- **Visual Analysis**
  - Interactive bar chart showing all variations
  - Current parameter highlighted in purple
  - Gradient progress bars (width = relative value)
  - Returns & ROI for each variation

- **Key Insights Panel**
  - Best Outcome (with parameter value)
  - Average across all variations
  - Variance (range of outcomes)

- **Auto-updates**
  - Runs 6 parallel simulations when parameter changes
  - Loading spinner during calculation
  - Results update in real-time

---

## 5. 🎯 **Goal Planning** (NEW!)

**Purpose**: Set financial targets and get personalized recommendations

### Features:
- **Goal Input**
  - Target Amount: $50K - $5M (slider with quick presets)
  - Time to Goal: 5-40 years
  - Shows current investment settings

- **Visual Progress**
  - Circular progress indicator
  - Green = On Track, Orange = Shortfall
  - Percentage to goal displayed

- **Status Analysis**
  - ✅ On Track: Shows excess amount
  - ⚠️ Shortfall: Shows gap to close

- **Recommendations**
  - Required Monthly Investment (calculated)
  - Increase needed from current contribution
  - Total to invest over timeline
  - Expected returns breakdown

- **Alternative Paths**
  - 🚀 Aggressive Plan (shorter timeline)
  - ⚖️ Moderate Plan (current timeline)
  - 🛡️ Conservative Plan (longer timeline)
  - Shows monthly requirement for each

- **Actions**
  - "Apply These Settings" button
  - Auto-fills Configure tab with recommended values

---

## 🔧 Technical Details

### Backend Integration
- Spring Boot REST API (http://localhost:8080)
- Endpoints: `/api/simulator/run`, `/api/simulator/compare`, `/api/simulator/optimize`
- Error handling with user-friendly messages

### Simulation Modes
1. **Simple**: Deterministic calculation with expected returns
2. **Monte Carlo**: 1000 randomized scenarios with percentile analysis
3. **Optimistic**: 30% increased returns
4. **Pessimistic**: 40% reduced returns

### Asset Classes & Returns
| Asset Class    | Expected Return | Volatility |
|----------------|----------------|------------|
| Stocks         | 10%            | 18%        |
| Bonds          | 5%             | 6%         |
| REITs          | 8%             | 15%        |
| Cash           | 3%             | 0.5%       |
| Crypto         | 25%            | 80%        |
| International  | 9%             | 22%        |
| Commodities    | 6%             | 20%        |

### Formulas Used
- Compound interest: FV = PV × (1 + r)^n
- Weighted returns: Σ(allocation_i × return_i)
- Portfolio volatility: √(Σ(allocation_i² × volatility_i²))
- Sharpe ratio: (return - risk_free_rate) / volatility
- Inflation adjustment: Real Value = Nominal Value / (1 + inflation)^years

---

## 🎨 User Experience

### Theme Support
- Full dark/light mode compatibility
- Uses app-wide theme classes: `card`, `btn-primary`, `btn-outline`, `input-field`
- Smooth transitions on theme toggle

### Responsive Design
- Mobile-first approach
- Grid layouts: 1 column (mobile), 2 (tablet), 3 (desktop)
- Navigation wraps on small screens
- Text hides on mobile for profile/logout buttons

### Loading States
- Fixed bottom-right indicator with spinner
- "Calculating..." for main simulation
- "Analyzing scenarios..." for What-If
- Non-blocking, allows navigation

### Success Feedback
- Green toast notification on scenario add
- Auto-navigation to comparison tab
- Current parameter highlighted in What-If
- Progress indicators in Goal Planning

---

## 📊 Use Cases

1. **Retirement Planning**
   - Use Goal Planning to set retirement target
   - Compare Conservative/Moderate/Aggressive strategies
   - Use What-If to see impact of working 2 more years

2. **Comparing Strategies**
   - Add multiple scenarios with different allocations
   - Use Comparison view to see side-by-side
   - Identify best risk/return balance

3. **Sensitivity Analysis**
   - Use What-If to see impact of contribution changes
   - Test different time horizons
   - Understand allocation impact on returns

4. **College Savings**
   - Set 18-year goal for college fund
   - See required monthly savings
   - Compare alternative timelines

5. **Risk Assessment**
   - Run Monte Carlo simulation
   - View best/worst case scenarios
   - Check probability of success

---

## 🚀 Future Enhancements (Potential)

- Tax-advantaged account modeling (401k, IRA, Roth IRA)
- Social Security integration
- Expense planning (withdrawals)
- Historical backtesting with real market data
- Export to PDF/Excel
- Save/load scenarios to database
- Multi-user support with saved portfolios
- Risk tolerance questionnaire
- Automated rebalancing recommendations
- Integration with real brokerage accounts

---

## 📝 Notes

- All calculations assume 8% average annual return in Goal Planning
- Monte Carlo uses normal distribution with historical volatility
- Inflation defaults to 3% annually
- Rebalancing defaults to 12 months
- All currency formatted as USD ($)

**Live URL**: http://localhost:3000
**Backend**: http://localhost:8080
**Status**: ✅ All features deployed and tested
