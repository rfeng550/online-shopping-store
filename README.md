# Tech E-Commerce & POS System

A full-stack online shopping platform built with React and Flask, featuring a public storefront with Google OAuth login, a persistent shopping cart, an admin inventory dashboard, and a Point of Sale (POS) terminal with bulk discounting. The backend uses SQLite with role-based access control (customer, cashier, admin), and the frontend is deployed on Vercel with the API hosted on PythonAnywhere.

---

## Live Demo

|                       | URL                                          |
| --------------------- | -------------------------------------------- |
| **Frontend**    | https://online-shopping-store-pi.vercel.app/ |
| **Backend API** | https://raythehandsome.pythonanywhere.com    |

---

## Screenshot

![Screenshot](https://i.imgur.com/Vz1zmmP.jpeg)

---

## Run Locally

```bash
git clone https://github.com/rfeng550/online-shopping-store.git
```

**Terminal 1 — Backend** (runs on `http://localhost:5001`):

```bash
cd online-shopping-store/backend && pip install -r requirements.txt && python init_db.py && python seed_products.py && python app.py
```

**Terminal 2 — Frontend** (runs on `http://localhost:5173`):

```bash
cd online-shopping-store/frontend && npm install && npm run dev
```

---

## Features

### Customer-Facing (Frontend)

- **Product Catalog**: View products with clean, modern card layouts indicating out-of-stock or low-stock alerts.
- **Deep Backend Search**: Powerful search queries executed directly in the SQLite database, returning results instantly to the React frontend. Category filtering is also fully supported.
- **Cart Persistence**: Cart items survive page refreshes using browser LocalStorage.
- **Product Details & Badges**: Automatic discount percentage calculations (`% OFF`) and original price strike-throughs for items marked "On Sale".
- **Order History**: Authenticated customers can view their past orders with total amounts and status.

### Authentication & RBAC

- **Google OAuth Login**: Secure login mechanism returning signed JWTs from the backend.
- **Role-Based Access Control (RBAC)**: Secure routes tailored to three access levels:
  - `Customer`: Can browse products, add to cart, and checkout.
  - `Cashier`: Has access to the specialized POS terminal.
  - `Admin`: Has full access to the inventory dashboard, POS, and order export features.

### Admin & Inventory Management

- **Dashboard Search & Filter**: Instantly filter the inventory table by typing a name or selecting a category.
- **Product CRUD**: Add, edit, or delete products seamlessly without leaving the page.
- **Quick Stock Controls**: Update inventory levels on-the-fly using `+` and `-` buttons right from the table.
- **Sale / Discount System**: Check "On Sale", enter a discount percentage, and the system automatically recalculates the real price while saving the original MSRP.
- **Order Export (CSV)**: One-click download of all transaction histories as a `.csv` file.

### Point of Sale (POS) Terminal

- **Cashier Interface**: A split-screen, distraction-free UI tailored for fast checkout in a physical store.
- **Bulk Discounting**: Apply custom percentage discounts (e.g., 20% off) to the entire order. The system calculates the new subtotal and accurately computes taxes based on the discounted amount.
- **Real-Time Inventory Sync**: Completing a POS sale immediately deducts from the global stock.

---

## Tech Stack

| Layer      | Technologies                                 |
| ---------- | -------------------------------------------- |
| Frontend   | React 18, Vite, React Router, Context API    |
| Backend    | Python 3, Flask, Flask-JWT-Extended, SQLite3 |
| Deployment | Vercel (frontend), PythonAnywhere (backend)  |

---

## Project Structure

```text
online-shopping-store/
├── backend/
│   ├── app.py               # Main Flask application and API routes
│   ├── init_db.py           # SQLite schema definitions
│   ├── seed_products.py     # Mock data generator for the database
│   ├── requirements.txt     # Python dependencies
│   └── products.db          # SQLite Database (generated)
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components (e.g., ProtectedRoute)
│   │   ├── context/         # React Context (CartContext)
│   │   ├── hooks/           # Custom hooks (useProducts)
│   │   ├── pages/           # Page views (Home, Admin, POS, Store, etc.)
│   │   ├── App.jsx          # React Router configuration & Global Nav
│   │   └── main.jsx         # React DOM entry point
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite configuration
│
└── README.md
```

---

## API Endpoints Summary

| Method     | Endpoint                     | Description                                  | Auth Required          |
| :--------- | :--------------------------- | :------------------------------------------- | :--------------------- |
| `GET`    | `/api/products`            | Fetch all products (supports `?q=` search) | Public                 |
| `GET`    | `/api/products/<id>`       | Fetch a single product by ID                 | Public                 |
| `POST`   | `/api/auth/google`         | Verify Google credential and issue JWT       | Public                 |
| `POST`   | `/api/checkout`            | Process standard customer checkout           | `customer`           |
| `POST`   | `/api/pos/checkout`        | Process POS checkout (with discounts)        | `cashier`, `admin` |
| `POST`   | `/api/products`            | Create a new product                         | `admin`              |
| `PUT`    | `/api/products/<id>`       | Update an existing product                   | `admin`              |
| `PATCH`  | `/api/products/<id>/stock` | Quick update product stock (+/-)             | `admin`              |
| `DELETE` | `/api/products/<id>`       | Delete a product                             | `admin`              |
| `GET`    | `/api/orders`              | Get order history for a specific user        | `customer`           |
| `GET`    | `/api/admin/orders/export` | Download complete orders as CSV              | `admin`              |
