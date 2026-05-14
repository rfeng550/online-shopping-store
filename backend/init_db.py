# =============================================================================
# backend/init_db.py — Create the SQLite database and table schema
# =============================================================================
#
# RUN ONCE to create products.db with the correct table schema:
#
#   python init_db.py
#
# After this, run seed_products.py to populate the table with data.
# Delete products.db and re-run both scripts to start completely fresh.
#
# =============================================================================

import sqlite3
import os

# Path to the database file (same folder as this script)
DB_PATH = os.path.join(os.path.dirname(__file__), "products.db")

# -----------------------------------------------------------------------------
# Create table schema
# -----------------------------------------------------------------------------
def init_db():
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    # Create the products table if it doesn't already exist.
    # SQLite stores booleans as INTEGER: 1 = True, 0 = False.
    cur.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            name           TEXT    NOT NULL,
            price          REAL    NOT NULL,
            image          TEXT,
            category       TEXT,
            stock          INTEGER NOT NULL DEFAULT 0,
            description    TEXT,
            featured       INTEGER NOT NULL DEFAULT 0,
            on_sale        INTEGER NOT NULL DEFAULT 0,
            original_price REAL    DEFAULT NULL
        )
    """)

    # Create the users table for Google OAuth sign-in.
    # role must be one of: "admin", "cashier", "customer"
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id    INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT    NOT NULL UNIQUE,
            name  TEXT    NOT NULL,
            role  TEXT    NOT NULL DEFAULT 'customer'
        )
    """)

    # Seed one default admin user.
    # INSERT OR IGNORE means this is safe to re-run — it won't duplicate the row.
    cur.execute("""
        INSERT OR IGNORE INTO users (email, name, role)
        VALUES ('rfeng550@gmail.com', 'Admin', 'admin')
    """)

    # Create orders table to record transactions (POS or online)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            total REAL NOT NULL,
            phone TEXT,
            status TEXT NOT NULL DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)

    # Create order_items table to record products within an order
    cur.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price_at_purchase REAL NOT NULL,
            FOREIGN KEY(order_id) REFERENCES orders(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        )
    """)

    con.commit()
    con.close()
    print(f"✅  Schema ready: {DB_PATH}")
    print("    Tables: products, users, orders, order_items")
    print("    Default admin: rfeng550@gmail.com")
    print("    Run 'python seed_products.py' to populate the products table.")


if __name__ == "__main__":
    init_db()
