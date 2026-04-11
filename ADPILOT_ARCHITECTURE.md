# AdPilot — Architecture Document

## What Is AdPilot

An AI-powered Amazon PPC dashboard that doesn't just show numbers — it tells you what they mean. Users upload SP reports, get a visual dashboard with charts, AND receive 10 proactive business insights generated automatically. A chat interface lets users ask deeper questions about their data.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Tailwind CSS |
| Charts | Recharts |
| Auth & Database | Supabase (free tier) |
| AI Chat | OpenAI API (GPT-4o) |
| Build Tool | Vite |
| Deployment | Vercel (free tier) |

---

## User Flow

```
Login (Supabase Auth — Google/Email)
    ↓
Dashboard (empty state — "Upload your reports")
    ↓
User sets Target ACOS (e.g., 28%)
    ↓
User uploads 3 SP CSV/XLSX files:
  1. Search Term Report
  2. Placement Report
  3. Advertised Products Report
    ↓
System parses → merges → computes metrics
    ↓
Dashboard renders:
  ┌─────────────────────────────────┐
  │  TOP: 10 Proactive Insight Cards │
  ├─────────────────────────────────┤
  │  MIDDLE: Charts & Metrics       │
  ├─────────────────────────────────┤
  │  RIGHT PANEL: AI Chat (slide-out)│
  └─────────────────────────────────┘
```

---

## Report Schemas (From Real Data)

### 1. Search Term Report (STR)
- **Rows:** 1,461 | **Columns:** 26
- **Key Fields:**
  - `Campaign Name` — links to other reports
  - `Ad Group Name` — links to Advertised Products
  - `Targeting` — close-match, loose-match, exact, etc.
  - `Match Type` — broad, phrase, exact
  - `Customer Search Term` — what shoppers actually typed
  - `Impressions`, `Clicks`, `CTR`, `CPC`, `Spend`
  - `7 Day Total Sales`, `ACOS`, `ROAS`
  - `7 Day Total Orders (#)`, `7 Day Total Units (#)`
  - `7 Day Conversion Rate`
  - `7 Day Advertised SKU Units (#)` vs `7 Day Other SKU Units (#)`
  - `7 Day Advertised SKU Sales` vs `7 Day Other SKU Sales`

### 2. Placement Report
- **Rows:** 265 | **Columns:** 18
- **Key Fields:**
  - `Campaign Name` — links to other reports
  - `Bidding strategy` — dynamic up/down, fixed, down only
  - `Placement` — Top of Search, Product Pages, Rest of Search, Off Amazon
  - `Impressions`, `Clicks`, `CPC`, `Spend`
  - `7 Day Total Sales`, `ACOS`, `ROAS`
  - `7 Day Total Orders (#)`, `7 Day Total Units (#)`

### 3. Advertised Products Report
- **Rows:** 696 | **Columns:** 25
- **Key Fields:**
  - `Campaign Name`, `Ad Group Name` — links to other reports
  - `Advertised SKU`, `Advertised ASIN` — product identifiers
  - `Impressions`, `Clicks`, `CTR`, `CPC`, `Spend`
  - `7 Day Total Sales`, `ACOS`, `ROAS`
  - `7 Day Total Orders (#)`, `7 Day Total Units (#)`
  - `7 Day Conversion Rate`
  - `7 Day Advertised SKU Units (#)` vs `7 Day Other SKU Units (#)`
  - `7 Day Advertised SKU Sales` vs `7 Day Other SKU Sales`

### Linking Fields
- `Campaign Name` → connects all 3 reports
- `Ad Group Name` → connects STR ↔ Advertised Products
- `Advertised ASIN` → unique product identifier in Advertised Products

---

## Data Processing Pipeline

### Step 1: Parse
Each report type has its own parser function. Accepts `.xlsx` or `.csv`. Validates required columns exist. Cleans data — converts percentage strings to numbers, handles NaN/null values, strips currency symbols.

### Step 2: Normalize
Standardize field names internally:
```
"7 Day Total Sales " → "sales"
"Total Advertising Cost of Sales (ACOS) " → "acos"
"Cost Per Click (CPC)" → "cpc"
"7 Day Total Orders (#)" → "orders"
"Click-Thru Rate (CTR)" → "ctr"
"7 Day Conversion Rate" → "cvr"
```

### Step 3: Merge
Create unified dataset by joining on `Campaign Name` and `Ad Group Name`. Store each report's data separately in Supabase but maintain linkage for cross-report queries.

### Step 4: Compute
Run all hardcoded business rules (see PPC Knowledge Base section below). Generate the structured summary. Produce the 10 proactive insights.

---

## Database Schema (Supabase)

```sql
-- Users
users (
  id UUID PRIMARY KEY,
  email TEXT,
  target_acos DECIMAL,
  created_at TIMESTAMP
)

-- Upload sessions
uploads (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  upload_date TIMESTAMP,
  date_range_start DATE,
  date_range_end DATE
)

-- Search Term Report data
str_data (
  id UUID PRIMARY KEY,
  upload_id UUID REFERENCES uploads(id),
  campaign_name TEXT,
  ad_group_name TEXT,
  targeting TEXT,
  match_type TEXT,
  search_term TEXT,
  impressions INT,
  clicks INT,
  ctr DECIMAL,
  cpc DECIMAL,
  spend DECIMAL,
  sales DECIMAL,
  acos DECIMAL,
  roas DECIMAL,
  orders INT,
  units INT,
  cvr DECIMAL,
  advertised_sku_units INT,
  other_sku_units INT,
  advertised_sku_sales DECIMAL,
  other_sku_sales DECIMAL
)

-- Placement Report data
placement_data (
  id UUID PRIMARY KEY,
  upload_id UUID REFERENCES uploads(id),
  campaign_name TEXT,
  bidding_strategy TEXT,
  placement TEXT,
  impressions INT,
  clicks INT,
  cpc DECIMAL,
  spend DECIMAL,
  sales DECIMAL,
  acos DECIMAL,
  roas DECIMAL,
  orders INT,
  units INT
)

-- Advertised Products data
product_data (
  id UUID PRIMARY KEY,
  upload_id UUID REFERENCES uploads(id),
  campaign_name TEXT,
  ad_group_name TEXT,
  advertised_sku TEXT,
  advertised_asin TEXT,
  impressions INT,
  clicks INT,
  ctr DECIMAL,
  cpc DECIMAL,
  spend DECIMAL,
  sales DECIMAL,
  acos DECIMAL,
  roas DECIMAL,
  orders INT,
  units INT,
  cvr DECIMAL,
  advertised_sku_units INT,
  other_sku_units INT,
  advertised_sku_sales DECIMAL,
  other_sku_sales DECIMAL
)

-- Computed insights (cached)
insights (
  id UUID PRIMARY KEY,
  upload_id UUID REFERENCES uploads(id),
  insight_type TEXT,
  severity TEXT,       -- critical, warning, opportunity
  title TEXT,
  description TEXT,
  data JSONB,
  created_at TIMESTAMP
)
```

---

## PPC Knowledge Base

> **NOTE TO BUILDER (Claude Code):** The formulas and thresholds below are the foundation of the insight engine. Ali will review and adjust these values. Do NOT change them without asking.

### Hardcoded Formulas (Layer 1 — Pure Code)

```
ACOS = Spend / Sales
ROAS = Sales / Spend
TACOS = Total Ad Spend / Total Revenue (requires Seller Central data — Phase 2)
RPC (Revenue Per Click) = Sales / Clicks
CPA (Cost Per Acquisition) = Spend / Orders
CVR (Conversion Rate) = Orders / Clicks
Suggested Bid = RPC × Target ACOS
Organic Ratio = (Total Sales - Ad Sales) / Ad Sales
Wasted Spend = Spend on search terms with 0 orders
```

### Campaign Naming Convention (Ad Labs Standard)

The Ad Labs recommended format is:
```
[AdType] | [Category] | [ASIN] | [Tactic] | [TargetingType] | [MatchType] | [ACOS%] | [Goal]
```
Example: `SP | OrganicShampoo | B08KFG7NQ3 | NonBrand | Manual_KW | Exact | 25% | Performance`

However, real-world accounts (including Ali's) have campaigns built over time with mixed naming styles. The parser must handle all three patterns found in the data:

**Style 1 — Dash-separated legacy:** `SP-EX-DO-CVR-FULL SIZE-ALL SUGGESTED`
**Style 2 — Dash with keywords:** `SP - EX - KW - adjustable bed frame - 29.11.24`
**Style 3 — Pipe-separated (Ad Labs):** `SP | Defensive | Renanim | Bundle | Queen | PAT | Exact`

### Smart Campaign Parser Logic

The parser extracts 4 dimensions from any campaign name using keyword matching (case-insensitive). Order of checks matters — first match wins.

#### 1. Match Type Detection
```
AUTO patterns:   "AUTO", "Auto", "Catch All"           → Auto
EXACT patterns:  "EX", "EX -", "EX-", "Exact"          → Exact
PHRASE patterns: "PH", "PHR", "PH -", "Phrase"         → Phrase
BROAD patterns:  "BRD", "Broad"                        → Broad
PT patterns:     "PT", "PAT", "Product Targeting"      → Product Targeting
Fallback:                                              → Unknown
```

#### 2. Tactic Detection
```
BRAND patterns:     "BRAND DEFENSE", "Defensive", "BRM",
                    "Renanim" (own brand name)          → Brand
COMPETITOR patterns: "Comp", "Competitor", "CT-", "CT ",
                    "Sven & Son" (known competitor names) → Competitor
AUTO patterns:      Already matched as Auto above       → Auto (separate tactic)
Fallback:           No brand/comp signal                → NonBrand
```
> **[ALI TO UPDATE]:** Add your own brand name(s) and known competitor brand names to the detection lists above. Current: own brand = "Renanim", known competitor = "Sven & Son".

#### 3. Goal Detection
```
PERFORMANCE: "CVR", "Performance", "SUGGESTED"         → Performance
RANKING:     "RNK", "Ranking", "Rank"                  → Ranking
RESEARCH:    "Research", "Catch All", "discovery"       → Research
Fallback:                                              → Performance (default)
```

#### 4. Product Size/Category Detection
```
"TWIN XL", "twin xl", "TXL"                           → Twin XL
"SPLIT KING", "split king"                             → Split King
"CAL KING", "Cal King"                                 → Cal King
"KING" (but NOT "SPLIT KING" or "CAL KING")            → King
"QUEEN"                                                → Queen
"FULL", "FULL SIZE"                                    → Full
Fallback:                                              → All Sizes
```

#### Combined Tactic Label (Used in Charts & Insights)
The tactic + match type combine into a unified label for analysis:
```
Brand + Auto      → "Brand Auto"
Brand + Exact     → "Brand Exact"
NonBrand + Exact  → "NonBrand Exact"
NonBrand + Phrase  → "NonBrand Phrase"
NonBrand + Broad   → "NonBrand Broad"
Competitor + PT    → "Competitor PT"
Auto (standalone)  → "Auto Discovery"
```

This combined label is what gets used in tactic-level spend pivots, ACOS comparisons, and the insight engine rules below.

### Insight Rules (Layer 2 — What Generates the Top 10)

Each rule checks a condition and produces an insight card if triggered.

**Rule 1 — Tactic Spend Imbalance**
- Pivot spend by tactic. If any tactic's ACOS exceeds Target ACOS by >10 points → critical alert.
- Example output: "NonBrand Broad consuming 32% of spend at 41% ACOS — 13 points above your 28% target."

**Rule 2 — Tactic Scaling Opportunity**
- If any tactic's ACOS is >3 points below Target ACOS → opportunity.
- Example: "NonBrand Exact at 24% ACOS has 4 points of headroom. Consider scaling winners +10% bid."

**Rule 3 — Harvesting Candidates**
- Search terms in broad/auto with orders > 1 that don't exist as exact match targets → flag for graduation.
- Example: "12 search terms in Auto/Broad have 2+ orders. Graduate to Exact match."

**Rule 4 — Negation Candidates**
- Search terms with spend > CPA threshold AND 0 orders → flag for negation.
- > **[ALI TO FILL]:** Define your CPA threshold or formula for negation trigger.
- Example: "8 search terms spent $45+ with zero orders. Potential wasted spend: $380."

**Rule 5 — Placement Performance Split**
- Compare TOS vs Product Pages vs RoS by CVR and CPC.
- If TOS CVR > 2× Product Pages CVR → suggest increasing TOS modifier.
- If TOS CPC > 2× base and ACOS near target ceiling → suggest reducing modifier.
- Example: "TOS converting at 9.2% vs Product Pages at 3.4%. TOS modifier increase could improve efficiency."

**Rule 6 — Wasted Spend Alert**
- Total spend on search terms with 0 orders.
- Example: "You spent $620 on 89 search terms that generated zero orders in this period."

**Rule 7 — Top Performer Spotlight**
- Top 5 search terms by orders with ACOS below target.
- Example: "Your top 5 converting keywords drive 40% of orders at 18% ACOS — well below your 28% target."

**Rule 8 — ASIN Dependency Analysis**
- From Advertised Products: calculate spend concentration by ASIN.
- If top ASIN > 50% of total spend → concentration risk.
- Example: "ASIN B0B75B3RJY absorbs 55% of total ad spend. High dependency risk."

**Rule 9 — Low CTR Campaigns**
- Campaigns with CTR below 0.2% with significant impressions (>1000).
- Example: "3 campaigns have CTR below 0.2% with 5,000+ impressions. Review ad copy or targeting relevance."

**Rule 10 — Bidding Strategy Mismatch**
- From Placement report: campaigns using "Dynamic bids - up and down" where CVR is poor on some placements.
- Suggest switching to "Fixed bids" or "Down only" where appropriate.
- Example: "Campaign 'ExactTXL' uses dynamic up/down but Product Pages CVR is 0%. Consider switching to down-only."

> **[ALI TO FILL]:** Review all 10 rules above. Add, remove, or modify based on your expertise. These are starting points — you know what insights matter most.

---

## AI Chat Architecture (Layer 3 — OpenAI)

### System Prompt Structure

```
You are AdPilot, an expert Amazon PPC strategist. You analyze Sponsored Products 
campaign data and provide actionable recommendations.

METHODOLOGY:
- [Ali's PPC principles in his own words — NOT copy-pasted from Ad Labs]
- [Bidding philosophy: base-bid-worst framework explanation]
- [When to scale vs when to cut]
- [How to interpret placement data]
- [Organic dependency thinking]

CURRENT USER CONTEXT:
- Target ACOS: {user_target_acos}%
- Date range: {start_date} to {end_date}
- Total campaigns: {campaign_count}
- Total spend: ${total_spend}
- Overall ACOS: {overall_acos}%

DATA SUMMARY:
{structured_summary_from_layer_1_and_2}

RULES:
1. Use the methodology above as your primary framework
2. Also draw from your general advertising and business knowledge
3. When advice comes from the methodology, say so
4. When drawing from general knowledge, indicate that
5. Always be specific — reference actual campaign names, ASINs, search terms
6. Provide actionable next steps, not vague suggestions
```

### What Goes Into `structured_summary`

NOT raw CSV rows. Instead, pre-computed compact summary:

```json
{
  "tactic_breakdown": {
    "Brand": { "spend": 120, "sales": 1333, "acos": 9.0, "spend_share": 12 },
    "NonBrand_Exact": { "spend": 380, "sales": 1583, "acos": 24.0, "spend_share": 38 }
  },
  "placement_breakdown": {
    "Top of Search": { "spend": 450, "cpc": 1.20, "cvr": 9.2, "acos": 22 },
    "Product Pages": { "spend": 300, "cpc": 0.55, "cvr": 3.4, "acos": 35 }
  },
  "top_search_terms": [...top 20 by spend with all metrics...],
  "harvesting_candidates": [...terms with orders > 1 in broad/auto...],
  "negation_candidates": [...terms with high spend, 0 orders...],
  "asin_performance": [...top ASINs with spend, sales, acos, dependency ratio...],
  "generated_insights": [...the 10 insight cards already computed...]
}
```

This keeps token count under ~2000 tokens per request. Cost per chat message: fraction of a cent.

### Token Optimization Strategy
- Structured summary is generated ONCE per upload, cached in Supabase `insights` table
- Chat sends: system prompt (~500 tokens) + summary (~1500 tokens) + user question (~50 tokens) + conversation history (last 5 messages)
- Estimated cost per chat session (20 questions): ~$0.05-0.15 with GPT-4o

---

## Frontend Component Structure

```
src/
├── components/
│   ├── auth/
│   │   └── LoginPage.jsx          — Google/email login via Supabase
│   ├── upload/
│   │   └── ReportUploader.jsx     — Drag-drop for 3 report files
│   │   └── TargetAcosInput.jsx    — Set target ACOS during onboarding
│   ├── dashboard/
│   │   └── DashboardLayout.jsx    — Main layout container
│   │   └── InsightCards.jsx       — Top 10 proactive insight cards
│   │   └── MetricsSummary.jsx     — Key KPIs (total spend, ACOS, orders, sales)
│   ├── charts/
│   │   └── TacticSpendChart.jsx   — Spend by tactic (pie/donut)
│   │   └── AcosbyTacticChart.jsx  — ACOS by tactic vs target line (bar)
│   │   └── PlacementChart.jsx     — CPC/CVR/Spend by placement (grouped bar)
│   │   └── TopSearchTerms.jsx     — Top keywords table with sparklines
│   │   └── AsinPerformance.jsx    — ASIN-level spend vs sales (scatter/bar)
│   │   └── WastedSpendChart.jsx   — Wasted spend breakdown (treemap)
│   │   └── SpendTrendChart.jsx    — Daily spend/sales trend (line)
│   ├── chat/
│   │   └── ChatPanel.jsx          — Slide-out AI chat panel
│   │   └── ChatMessage.jsx        — Individual message bubble
│   │   └── ChatInput.jsx          — Input with send button
│   ├── common/
│   │   └── Navbar.jsx
│   │   └── Sidebar.jsx
│   │   └── LoadingState.jsx
│   │   └── EmptyState.jsx
├── services/
│   ├── supabase.js                — Supabase client init
│   ├── reportParser.js            — Parse & normalize uploaded files
│   ├── insightEngine.js           — All 10 insight rules + computations
│   ├── openai.js                  — OpenAI API integration
│   └── dataLinker.js              — Cross-report merging logic
├── hooks/
│   ├── useAuth.js                 — Auth state management
│   ├── useReports.js              — Report data state
│   └── useChat.js                 — Chat state & history
├── utils/
│   ├── formulas.js                — PPC formulas (ACOS, RPC, CPA, etc.)
│   ├── formatters.js              — Currency, percentage, number formatting
│   └── constants.js               — Thresholds, colors, config
└── App.jsx
```

---

## UI Design Principles

- **Dark mode default** — PPC managers and traders prefer dark interfaces
- **Color system:** Green = performing well (below target ACOS), Red = problem (above target), Amber = watch zone (near target)
- **Insight cards:** Styled as notification-like cards with severity colors and icons. Critical = red left border, Opportunity = green, Warning = amber
- **Charts:** Clean, minimal gridlines. Every chart has a one-line subtitle explaining what it shows in plain english
- **Chat panel:** Slides in from right. User can see dashboard and chat simultaneously. Chat messages use same color coding — AI recommendations that suggest scaling are green-tinted, cost warnings are amber
- **Typography:** Clean sans-serif. Numbers in monospace for readability. Large KPI numbers at top
- **Empty state:** Friendly illustration + "Upload your SP reports to unlock insights" with drag-drop zone
- **Responsive:** Desktop-first but functional on tablet

---

## Scaling Blueprint (Future Phases)

### Phase 2 — SB Reports
Add new parser module for:
- SB Attributed Purchases Report → halo sales detection
- SB Category Benchmark Report → competitive positioning

New insight rules:
- Halo product discovery
- Under-investment detection (top efficiency + bottom impression share)

New charts:
- Halo sales breakdown
- Benchmark quartile positioning

### Phase 3 — SD Reports
Add Sponsored Display parser and insights.

### Phase 4 — API Integration
Replace manual CSV upload with Amazon Advertising API connection. Auto-refresh data daily. n8n or scheduled serverless function pulls data automatically.

### Phase 5 — Multi-Account
Agency mode — manage multiple brands from one login. Account switcher in navbar. Comparative benchmarks across accounts.

### How Scaling Works Technically
Each report type is a self-contained module with:
1. Its own parser function in `reportParser.js`
2. Its own insight rules in `insightEngine.js`
3. Its own chart components in `charts/`
4. Its own database table in Supabase

Adding a new report type = adding a new module. Zero rewrites to existing code.

---

## Build Checkpoints

> **IMPORTANT INSTRUCTION FOR CLAUDE CODE:**  
> At every checkpoint below, STOP completely. Show Ali what has been built. Ask him to review and confirm before proceeding to the next phase. Do NOT continue to the next checkpoint without Ali's explicit approval. If Ali requests modifications, implement them before moving forward.

### Checkpoint 1 — Project Setup
- [ ] Vite + React + Tailwind initialized
- [ ] Supabase project connected
- [ ] Folder structure created as specified above
- [ ] Environment variables configured (.env)
- **⏸ STOP: Show Ali the project structure and confirm setup is correct**

### Checkpoint 2 — Authentication
- [ ] Login page with Google and email auth
- [ ] Protected routes — redirect to login if not authenticated
- [ ] User stored in Supabase `users` table
- [ ] Logout functionality
- **⏸ STOP: Show Ali the login flow. Test login/logout. Confirm before proceeding**

### Checkpoint 3 — Upload & Parse
- [ ] Upload page with drag-drop for 3 files
- [ ] Target ACOS input
- [ ] Report parser — validates columns, cleans data, normalizes field names
- [ ] Data stored in Supabase tables
- [ ] Error handling for wrong file format / missing columns
- **⏸ STOP: Upload the real SP reports. Verify data parsed correctly in Supabase. Ali confirms**

### Checkpoint 4 — Insight Engine
- [ ] All 10 insight rules implemented in `insightEngine.js`
- [ ] `formulas.js` complete with all PPC calculations
- [ ] Structured summary generated from uploaded data
- [ ] Insights stored in `insights` table
- **⏸ STOP: Show Ali the generated insights from his real data. Review each insight for accuracy. This is the most critical checkpoint — the insights must be correct**

### Checkpoint 5 — Dashboard Charts
- [ ] MetricsSummary (top-level KPIs)
- [ ] All 7 chart components rendering with real data
- [ ] Color coding based on target ACOS
- [ ] Charts are responsive and readable
- **⏸ STOP: Show Ali the full dashboard with charts. Review visual design and chart accuracy**

### Checkpoint 6 — Insight Cards UI
- [ ] 10 insight cards displayed at top of dashboard
- [ ] Severity color coding (critical/warning/opportunity)
- [ ] Cards are scrollable and clickable for detail
- **⏸ STOP: Show Ali the insight cards integrated into dashboard layout. Full visual review**

### Checkpoint 7 — AI Chat Panel
- [ ] Chat panel slides out from right side
- [ ] OpenAI integration working with system prompt
- [ ] Structured summary passed as context
- [ ] Chat history maintained within session
- [ ] Typing indicator while AI responds
- **⏸ STOP: Ali tests the chat with real questions about his data. Verify AI responses are accurate and use PPC methodology correctly**

### Checkpoint 8 — UI Polish & Dark Mode
- [ ] Dark mode implemented as default
- [ ] All colors, typography, spacing finalized
- [ ] Empty states designed
- [ ] Loading states for upload processing and AI responses
- [ ] Navbar and overall layout polished
- **⏸ STOP: Full visual review. Ali confirms the UI is stunning and ready for LinkedIn**

### Checkpoint 9 — Deployment
- [ ] Environment variables set in Vercel
- [ ] Supabase security rules configured (row-level security)
- [ ] Build succeeds with no errors
- [ ] Deployed to Vercel with custom domain (optional)
- **⏸ STOP: Test the live URL end-to-end. Ali uploads reports, reviews insights, tests chat. Final sign-off**

---

## Security Notes

- Supabase Row Level Security (RLS) enabled — users can only see their own data
- OpenAI API key stored as server-side environment variable, never exposed to frontend
- Use Supabase Edge Functions or Vercel serverless functions for OpenAI calls — never call OpenAI directly from the browser
- File uploads validated on both client and server side — only accept .xlsx and .csv

---

## LinkedIn Presentation Strategy

When AdPilot is complete, the LinkedIn post should demonstrate:
1. **The problem** — "Most PPC dashboards show you numbers. You still have to figure out what they mean."
2. **The solution** — "AdPilot tells you the 10 most important things about your campaigns before you even ask."
3. **The demo** — Screen recording: upload reports → dashboard populates → insight cards appear → ask AI a deep question → get specific, actionable answer
4. **The credibility** — "Built with 4+ years of Amazon PPC expertise baked into the insight engine."