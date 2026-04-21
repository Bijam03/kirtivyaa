# 🍰 Kirtivyaa — Home Bakery App (MERN Stack)

A fully production-ready MERN e-commerce app for **Kirti Agarwal's home bakery in Pune**.

---

## 🚀 Quick Start

### 1. Install everything
```bash
npm install
cd backend  && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Configure environment
```bash
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` and fill in:
- `MONGO_URI` — from MongoDB Atlas
- `JWT_SECRET` — any long random string
- `CLOUDINARY_*` — from Cloudinary dashboard
- `WHATSAPP_NUMBER` — Kirti's WhatsApp (e.g. `919876543210`)
- `RAZORPAY_*` — from Razorpay dashboard (optional)

Edit `frontend/.env`:
- `REACT_APP_API_URL=http://localhost:5000/api`
- `REACT_APP_WHATSAPP_NUMBER` — same number
- `REACT_APP_RAZORPAY_KEY_ID` — Razorpay key

### 3. Seed database
```bash
npm run seed
```
Creates 10 products + admin: `kirti@kirtivyaa.in` / `Kirti@12345`

### 4. Run
```bash
npm run dev   # starts both servers
```
- Frontend → http://localhost:3000
- Backend  → http://localhost:5000

---

## ⚙️ Admin Panel — http://localhost:3000/admin

### Tabs

| Tab | What you can do |
|---|---|
| **📊 Dashboard** | Revenue stats, monthly revenue, pending orders count, recent orders, order pipeline chart |
| **🏠 Homepage** | Control every homepage section — Today's Special, Best Sellers, New Arrivals, Featured Hampers, Featured Products — all without code |
| **🎂 Products** | Add/edit/delete products with Cloudinary image upload. Toggle flags (Available, Featured, Today's Special, Best Seller, New Arrival, Hamper) inline per row |
| **📦 Orders** | View all orders, filter by status/name/phone, update order status with one click, send WhatsApp update directly to customer |
| **👥 Customers** | View all registered customers, see order count per customer, block/unblock accounts, promote to admin |
| **⚙️ Settings** | Change brand name, WhatsApp number, delivery areas, free delivery threshold, open/close store, show announcement banner, hero text — all live |

### Key Admin Powers

**Today's Special** — Only ONE product can be "Today's Special". Setting a new one auto-removes the previous. Shows countdown timer on homepage.

**Homepage sections** — Drag-and-drop style selection. Pick which products appear in Best Sellers, New Arrivals, Gift Hampers sections. Remove them with one click.

**Store open/close** — Toggle the store offline instantly (e.g. for holidays). Shows a closed banner across the site.

**Announcement banner** — Set any text (e.g. "Diwali special offer! Use code DIWALI20") and toggle it on/off without deployment.

**Order WhatsApp** — Send a pre-filled WhatsApp message to any customer's number directly from the orders table.

---

## 📡 API Endpoints

### Products (Public)
```
GET  /api/products              — All products (filter/sort/paginate)
GET  /api/products/featured     — Featured products
GET  /api/products/today-special — Today's Special product
GET  /api/products/bestsellers  — Best sellers
GET  /api/products/new-arrivals — New arrivals
GET  /api/products/hampers      — Featured gift hampers
GET  /api/products/:id          — Single product
```

### Products (Admin)
```
POST   /api/products            — Create (multipart, Cloudinary upload)
PUT    /api/products/:id        — Update (multipart)
PATCH  /api/products/:id/flags  — Quick flag toggle (no image re-upload)
DELETE /api/products/:id        — Delete + remove from Cloudinary
POST   /api/products/:id/reviews — Add review (logged in)
```

### Orders
```
POST /api/orders                — Place order (login required)
GET  /api/orders/my             — My orders (login required)
GET  /api/orders/track/:num     — Public tracking by order number
GET  /api/orders                — All orders (admin)
PUT  /api/orders/:id/status     — Update status (admin)
```

### Settings
```
GET /api/admin/settings         — Public (frontend reads brand info)
PUT /api/admin/settings         — Update (admin only)
```

### Admin
```
GET /api/admin/dashboard        — Stats + recent orders
GET /api/admin/users            — All customers (search/paginate)
PUT /api/admin/users/:id/role   — Change role
PUT /api/admin/users/:id/block  — Block / unblock
```

---

## 🔒 Security Features

- Helmet (15 HTTP security headers)
- Rate limiting: 200 req/15min global, 20 attempts/15min on auth
- MongoDB injection prevention (express-mongo-sanitize)
- XSS input sanitization (xss-clean)
- HTTP parameter pollution prevention (hpp)
- JWT token verification on every request
- Server-side price verification (client prices ignored)
- Minimum order ₹200, max qty 10/item
- WhatsApp confirmation required before placing order
- Login required for cart, checkout, and orders

---

## ☁️ Deploy (Free Tier)

### MongoDB Atlas
1. cloud.mongodb.com → New M0 cluster
2. Database user + IP allowlist
3. Copy connection string to `MONGO_URI`

### Cloudinary
1. cloudinary.com → Sign up free
2. Dashboard → copy Cloud Name, API Key, API Secret

### Backend → Render
1. render.com → New Web Service → GitHub repo
2. Root Dir: `backend` | Build: `npm install` | Start: `npm start`
3. Add all env vars from `backend/.env`

### Frontend → Vercel
1. vercel.com → New Project → GitHub repo
2. Root Dir: `frontend` | Build: `npm run build`
3. Env vars: `REACT_APP_API_URL=https://your-render-url.onrender.com/api`

### After Deploying
```bash
# Run seeder against Atlas (update MONGO_URI in .env first)
npm run seed
```

---

## 🎂 Admin Login
- **Email**: `kirti@kirtivyaa.in`
- **Password**: `Kirti@12345`

> ⚠️ Change password immediately after first login!
