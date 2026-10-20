# ScopeBridg 🌍✨

ScopeBridg is a global, end-to-end Property Listing, Nanny Booking, and Shuttle Management platform designed to bridge luxury travel stays with premium on-demand hospitality workflows. Operating seamlessly across multiple international destinations, ScopeBridg provides specialized, independent portals and tools for all participants in the accommodation lifecycle.

---

## 🌟 Key Features

### 1. 🏨 Guest & Traveler Experience
* **Curated Global Portfolio**: Search and discover high-end residences in Johannesburg, Cape Town, London, Dubai, New York, Paris, Bali, and more.
* **Smart Proximity Filters**: Easily find rooms relative to generic central districts: Shopping, Business Hubs, Dining & Groceries, or Transit Terminals.
* **Integrated Live Web Grounding**: Search live listings, ticket platforms, and weather guides directly via embedded Google Search and Google Maps.
* **Custom Room Bidding**: Make live pricing bids for properties experiencing high interest and demand.
* **On-Call Specialized Add-Ons**: Book verified professional **Super Nannies** and **VIP Shuttle Chauffeurs** during the room checkout workflow.

### 2. 🏘️ Host & Property Owner Portal
* **Single & Multi-Unit Support**: Complete oversight of pricing multipliers, base rates, weekend premiums, and corporate-negotiated rates.
* **Multi-Channel Distribution Manager**: Synchronize inventory availability status with direct channels or external global OTAs (such as Airbnb, Booking.com, LekkeSlaap, and Expedia).
* **Payment Merchant Gateway Manager**: Direct configuration for leading instant EFT, card processing, and mobile QR providers (like Paystack, Ozow, Yoco, SnapScan, and Peach Payments).
* **Quotation & Invoicing Hub**: Draft, review, approve, and send customized commercial quotes or PDF-compatible tax invoices to corporate or private clients.

### 3. 🛡️ Executive Super Administrator Hub
* **Audit & Compliance Panel**: Review system audit alerts, flag potential listing pricing surges, and review security events.
* **Access & Registration Controller**: Review, accept, or reject newly registered profiles (Hosts, Nannies, Drivers) with custom notes.
* **Live Wallet Adjustments**: Oversee and credit guest virtual wallets or loyalty balances.

### 4. 🍼 Professional Childcare (Super Nanny) Portal
* **Shift Calendar**: Manage booking statuses, active sessions, hourly rates, and child profile instructions.
* **Live Activity Logger**: Create progress reports, meal notes, nap logs, and emotional logs for parents to view in real-time.

### 5. 🚗 Executive VIP Shuttle Driver Portal
* **Transit Queue**: View pending airport transfers, pickup location coordinates, and group sizes.
* **Dispatch Logs**: Accept trips and track completion history in real-time.

### 6. 📺 Lobby Kiosk & Smart QR Code Station
* **Lobby Presentation**: An elegant, terminal-optimized view of hot properties.
* **Smart QR Station**: Dynamic, high-fidelity QR Code generator for every room, letting walk-in guests scan and instantly launch specific property details directly on their mobile device.

### 7. 🤖 24/7 Virtual Host & Concierge (Gemini-Powered)
* Powered by Google's latest `@google/genai` TypeScript SDK, providing seamless offline chat, check-in smart lock pins, local guides, and Wi-Fi access details.

---

## 🔒 Production Credentials

To access the platform's full set of control panels and role selectors in production without mock helpers:

* **Production Username**: `superadmin` *(or email `nightscope58@gmail.com`)*
* **Production Password**: `SuperAdmin@2026!`
* **Primary Role**: `super_admin` *(Kenneth Mathunywa)*

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (v18+) installed.

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
This boots up the Vite-powered React client multiplexed with the Express API server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Build for Production
Compiles optimized static client assets and bundles the Node.js server middleware:
```bash
npm run build
```

### 4. Start Production Server
```bash
npm start
```

---

## 🛠️ Technology Stack

* **Frontend**: React 19, TypeScript 5, Vite 8
* **Styling**: Tailwind CSS v4 (Zero-pill, beautiful modern system)
* **Backend**: Express API Gateway with Vite middleware mounting
* **AI Model Routing**: Google Gemini AI (`@google/genai` SDK)
* **Visuals**: Lucide Icons, Recharts Dynamic Reporting Engine
* **Utility**: high-fidelity SVG Canvas Mapping and React QR Code Station
