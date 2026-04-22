# =============================================================================
# backend/seed_products.py — Populate the products table with sample data
# =============================================================================
#
# RUN AFTER init_db.py has created the database:
#
#   python3 seed_products.py
#
# This script clears all existing rows and re-inserts the PRODUCTS list,
# so it's safe to re-run any time you want a clean slate.
#
# SQLite boolean note:
#   featured and on_sale are stored as INTEGER — 1 = True, 0 = False.
#
# =============================================================================

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "products.db")

# -----------------------------------------------------------------------------
# Product data  (no 'id' — let AUTOINCREMENT assign it)
# 18 products: 5 laptops · 4 tablets · 5 audio · 4 accessories
# -----------------------------------------------------------------------------
PRODUCTS = [

    # ── Laptops (5) ───────────────────────────────────────────────────────────
    {
        "name":           "MacBook Pro 14-inch (M3)",
        "price":          1599.00,
        "image":          "https://picsum.photos/seed/macbook/400/300",
        "category":       "laptops",
        "stock":          12,
        "description":    "The ultimate pro laptop with the M3 chip. Delivers game-changing performance and up to 22 hours of battery life.",
        "featured":       1,
        "on_sale":        0,
        "original_price": None,
    },
    {
        "name":           "Dell XPS 15",
        "price":          1299.00,
        "image":          "https://picsum.photos/seed/dell/400/300",
        "category":       "laptops",
        "stock":          8,
        "description":    "A stunning 15-inch OLED display combined with incredible power. Perfect for creators and students alike.",
        "featured":       0,
        "on_sale":        1,
        "original_price": 1499.00,   # was $1499, now 13% off
    },
    {
        "name":           "Lenovo ThinkPad X1 Carbon",
        "price":          1499.00,
        "image":          "https://picsum.photos/seed/thinkpad/400/300",
        "category":       "laptops",
        "stock":          5,
        "description":    "Ultralight and ultra-powerful laptop designed for professionals. Legendary keyboard comfort and robust security.",
        "featured":       0,
        "on_sale":        0,
        "original_price": None,
    },
    {
        "name":           "ASUS ROG Zephyrus G14",
        "price":          1349.00,
        "image":          "https://picsum.photos/seed/asus/400/300",
        "category":       "laptops",
        "stock":          7,
        "description":    "14-inch gaming powerhouse with AMD Ryzen 9 and NVIDIA RTX 4060. Stunning 144Hz display in a compact chassis.",
        "featured":       1,
        "on_sale":        0,
        "original_price": None,
    },
    {
        "name":           "Microsoft Surface Laptop 5",
        "price":          999.00,
        "image":          "https://picsum.photos/seed/surface/400/300",
        "category":       "laptops",
        "stock":          9,
        "description":    "Sleek and lightweight with a gorgeous touchscreen display. Runs Windows 11 natively with all-day battery life.",
        "featured":       0,
        "on_sale":        1,
        "original_price": 1199.00,   # was $1199, now ~17% off
    },

    # ── Tablets (4) ───────────────────────────────────────────────────────────
    {
        "name":           "iPad Air (M1)",
        "price":          599.00,
        "image":          "https://picsum.photos/seed/ipad/400/300",
        "category":       "tablets",
        "stock":          15,
        "description":    "Lightweight and versatile with the M1 chip. Supports Apple Pencil for all your note-taking needs.",
        "featured":       1,
        "on_sale":        0,
        "original_price": None,
    },
    {
        "name":           "Samsung Galaxy Tab S9",
        "price":          799.00,
        "image":          "https://picsum.photos/seed/samsungtab/400/300",
        "category":       "tablets",
        "stock":          6,
        "description":    "Experience vibrant colors on a stunning AMOLED display. Comes with the S Pen included.",
        "featured":       0,
        "on_sale":        0,
        "original_price": None,
    },
    {
        "name":           "iPad mini (6th Generation)",
        "price":          499.00,
        "image":          "https://picsum.photos/seed/ipadmini/400/300",
        "category":       "tablets",
        "stock":          13,
        "description":    "The most portable iPad with an 8.3-inch Liquid Retina display and USB-C connectivity. Perfect for on-the-go.",
        "featured":       0,
        "on_sale":        0,
        "original_price": None,
    },
    {
        "name":           "Microsoft Surface Pro 9",
        "price":          1099.00,
        "image":          "https://picsum.photos/seed/surfacepro/400/300",
        "category":       "tablets",
        "stock":          4,
        "description":    "The most versatile 2-in-1 device. Detachable keyboard lets you switch between laptop and tablet in seconds.",
        "featured":       1,
        "on_sale":        0,
        "original_price": None,
    },

    # ── Audio (5) ─────────────────────────────────────────────────────────────
    {
        "name":           "Sony WH-1000XM5 Headphones",
        "price":          349.00,
        "image":          "https://picsum.photos/seed/sony/400/300",
        "category":       "audio",
        "stock":          20,
        "description":    "Industry-leading noise cancellation to help you focus. Exceptional sound quality and all-day comfort.",
        "featured":       1,
        "on_sale":        0,
        "original_price": None,
    },
    {
        "name":           "AirPods Pro (2nd Generation)",
        "price":          249.00,
        "image":          "https://picsum.photos/seed/airpods/400/300",
        "category":       "audio",
        "stock":          18,
        "description":    "Rich audio quality with intelligent noise cancellation. The perfect everyday companion for campus life.",
        "featured":       0,
        "on_sale":        1,
        "original_price": 299.00,    # was $299, now ~17% off
    },
    {
        "name":           "Bose QuietComfort 45",
        "price":          279.00,
        "image":          "https://picsum.photos/seed/bose/400/300",
        "category":       "audio",
        "stock":          16,
        "description":    "Premium noise-cancelling headphones with legendary Bose audio. 24-hour battery and plush ear cushions.",
        "featured":       0,
        "on_sale":        1,
        "original_price": 349.00,    # was $349, now 20% off
    },
    {
        "name":           "Sennheiser Momentum 4 Wireless",
        "price":          349.00,
        "image":          "https://picsum.photos/seed/sennheiser/400/300",
        "category":       "audio",
        "stock":          8,
        "description":    "60-hour battery life with adaptive noise cancellation. Audiophile-grade sound in a sleek foldable design.",
        "featured":       0,
        "on_sale":        0,
        "original_price": None,
    },
    {
        "name":           "Jabra Evolve2 85 Headset",
        "price":          449.00,
        "image":          "https://picsum.photos/seed/jabra/400/300",
        "category":       "audio",
        "stock":          6,
        "description":    "Professional wireless headset with 37 hours of battery. Outstanding call clarity and music performance.",
        "featured":       0,
        "on_sale":        0,
        "original_price": None,
    },

    # ── Accessories (4) ───────────────────────────────────────────────────────
    {
        "name":           "Logitech MX Master 3S Wireless Mouse",
        "price":          99.00,
        "image":          "https://picsum.photos/seed/logitech/400/300",
        "category":       "accessories",
        "stock":          10,
        "description":    "Advanced ergonomic mouse for ultimate comfort and productivity. Ultra-fast scrolling and customizable buttons.",
        "featured":       0,
        "on_sale":        0,
        "original_price": None,
    },
    {
        "name":           "Anker 735 USB-C Charger (65W)",
        "price":          49.00,
        "image":          "https://picsum.photos/seed/anker/400/300",
        "category":       "accessories",
        "stock":          14,
        "description":    "Compact and powerful charger for all your devices. Charges laptops, phones, and tablets quickly.",
        "featured":       0,
        "on_sale":        0,
        "original_price": None,
    },
    {
        "name":           "Portable Monitor 15.6 inch",
        "price":          159.00,
        "image":          "https://picsum.photos/seed/monitor/400/300",
        "category":       "accessories",
        "stock":          11,
        "description":    "Expand your workspace anywhere with this lightweight 1080p portable monitor. Connects via USB-C or HDMI.",
        "featured":       0,
        "on_sale":        0,
        "original_price": None,
    },
    {
        "name":           "Samsung T7 Shield Portable SSD 1TB",
        "price":          89.00,
        "image":          "https://picsum.photos/seed/samsung/400/300",
        "category":       "accessories",
        "stock":          22,
        "description":    "Rugged, fast, and reliable. IP65-rated with transfer speeds up to 1,050 MB/s. USB-C and USB-A compatible.",
        "featured":       0,
        "on_sale":        0,
        "original_price": None,
    },
]


# -----------------------------------------------------------------------------
# Seed function
# -----------------------------------------------------------------------------
def seed():
    try:
        con = sqlite3.connect(DB_PATH)
        cur = con.cursor()

        # Clear existing rows so re-running always gives a clean state
        cur.execute("DELETE FROM products")
        # Reset the AUTOINCREMENT counter so IDs start from 1 again
        cur.execute("DELETE FROM sqlite_sequence WHERE name='products'")

        # Insert every product dict as a row
        cur.executemany(
            """
            INSERT INTO products (name, price, image, category, stock, description, featured, on_sale, original_price)
            VALUES (:name, :price, :image, :category, :stock, :description, :featured, :on_sale, :original_price)
            """,
            PRODUCTS,
        )

        con.commit()
        inserted = cur.rowcount
        con.close()

        print(f"✅  Seeded {inserted} products into {DB_PATH}")
        print(f"    Breakdown: 5 laptops · 4 tablets · 5 audio · 4 accessories")

    except sqlite3.OperationalError as e:
        print(f"❌  Database error: {e}")
        print("    Have you run 'python3 init_db.py' first?")

    except Exception as e:
        print(f"❌  Unexpected error: {e}")


# -----------------------------------------------------------------------------
# Entry point
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    seed()
