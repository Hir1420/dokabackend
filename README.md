# E-commerce Backend API

Node.js + Express + Prisma (SQLite) REST API for the DOKA e-commerce frontend.

## Setup

```bash
npm install
cp .env.example .env   # optional, defaults exist
npx prisma generate
npx prisma db push
npm run db:seed
```

## Run

```bash
npm run dev    # http://localhost:3001
```

When it starts correctly you’ll see: **`API running at http://localhost:3001`** in the same terminal.

**Check it’s running:** open in browser or run:
```bash
curl http://localhost:3001/api/categories
```

### If you don’t see “API running” / “Address already in use”

Port **3001** is already in use (often the backend from an earlier run).

- **Option A – Use the existing API:**  
  If `curl http://localhost:3001/api/categories` returns JSON, the API is already running. Use the app as normal; no need to start it again.

- **Option B – Restart the backend in this terminal:**  
  1. Stop whatever is using 3001 (close the other terminal where you ran `npm run dev`, or run):
     ```bash
     lsof -ti :3001 | xargs kill -9
     ```
  2. From the **backend** folder run:
     ```bash
     npm run dev
     ```
  3. You should then see: **`API running at http://localhost:3001`**.

## API

- **Auth** (no auth required for login/register)
  - `POST /api/auth/register` — body: `{ name, email, password }`
  - `POST /api/auth/login` — body: `{ email, password }`
  - `GET /api/auth/me` — requires `Authorization: Bearer <token>`

- **Categories** (GET public; POST/PUT/DELETE require admin token)
  - `GET /api/categories` — list all
  - `GET /api/categories/:slug` — one by slug
  - `POST /api/categories` — body: `{ slug, name, image }`
  - `PUT /api/categories/:slug` — body: `{ name?, image? }`
  - `DELETE /api/categories/:slug`

- **Products** (GET public; POST/PUT/DELETE require admin token)
  - `GET /api/products` — query: `?categoryId=&search=&trending=1&featured=1`
  - `GET /api/products/:id` — one by id
  - `POST /api/products` — create (admin)
  - `PUT /api/products/:id` — update (admin)
  - `DELETE /api/products/:id` — delete (admin)

- **Hero (carousel)** (GET public; PUT requires admin token)
  - `GET /api/hero` — list all hero slides (for home page carousel)
  - `PUT /api/hero` — replace all slides (admin). Body: array of `{ image, title, subtitle, cta?, link? }`. `link` = product ID for CTA button.

- **Orders**
  - `POST /api/orders` — create order (body: `{ items: [{ productId, quantity, price }], shippingAddress }`)
  - `GET /api/orders/my` — my orders (auth required)
  - `GET /api/orders` — all orders (admin)
  - `GET /api/orders/:id` — one order (auth)
  - `PATCH /api/orders/:id` — update status (admin), body: `{ status }`

## Admin user (after seed)

- Email: `admin@doka.com`
- Password: `admin123`

Use this account to log in on the Admin page (type `admin` to open it) and manage products.
