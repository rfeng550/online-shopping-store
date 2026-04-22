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

    # ── Laptops — new additions ────────────────────────────────────────────────
    {
        "name":           "HP Spectre x360 14",
        "price":          1299.00,
        "image":          "https://picsum.photos/seed/hpspectre/400/300",
        "category":       "laptops",
        "stock":          6,
        "description":    "2-in-1 convertible with an OLED touchscreen. Incredibly thin bezels, built-in pen, and stunning 3K display.",
        "featured":       0,
        "on_sale":        1,
        "original_price": 1449.00,   # ~10% off
    },
    {
        "name":           "Acer Swift 5",
        "price":          799.00,
        "image":          "https://picsum.photos/seed/acerswift/400/300",
        "category":       "laptops",
        "stock":          9,
        "description":    "Ultra-thin at just 0.57 inches. 14-inch Full HD IPS display, Intel Core i7, and all-day battery at under 1kg.",
        "featured":       0,
        "on_sale":        0,
        "original_price": None,
    },
    {
        "name":           "Razer Blade 14",
        "price":          1799.00,
        "image":          "https://picsum.photos/seed/razerblade/400/300",
        "category":       "laptops",
        "stock":          3,
        "description":    "The world's smallest 14-inch gaming laptop. AMD Ryzen 9, NVIDIA RTX 4070, and a 165Hz QHD display in a CNC aluminium body.",
        "featured":       1,
        "on_sale":        0,
        "original_price": None,
    },

    # ── Tablets — new additions ────────────────────────────────────────────────
    {
        "name":           "Google Pixel Tablet",
        "price":          499.00,
        "image":          "https://picsum.photos/seed/pixeltablet/400/300",
        "category":       "tablets",
        "stock":          10,
        "description":    "Android tablet designed to work seamlessly as a smart home hub. Includes a charging speaker dock and 11-inch display.",
        "featured":       1,
        "on_sale":        0,
        "original_price": None,
    },
    {
        "name":           "Lenovo Tab P12 Pro",
        "price":          549.00,
        "image":          "https://picsum.photos/seed/lenovotab/400/300",
        "category":       "tablets",
        "stock":          7,
        "description":    "12.6-inch Super AMOLED display with stunning visuals. Quad speakers with Dolby Atmos for an immersive multimedia experience.",
        "featured":       0,
        "on_sale":        0,
        "original_price": None,
    },

    # ── Audio — new additions ──────────────────────────────────────────────────
    {
        "name":           "Beats Studio Pro",
        "price":          349.00,
        "image":          "https://picsum.photos/seed/beatspro/400/300",
        "category":       "audio",
        "stock":          12,
        "description":    "Premium wireless headphones with personalized spatial audio. USB-C charging, 40 hours of listening time, and transparency mode.",
        "featured":       0,
        "on_sale":        1,
        "original_price": 399.00,    # ~13% off
    },
    {
        "name":           "Samsung Galaxy Buds2 Pro",
        "price":          149.00,
        "image":          "https://picsum.photos/seed/galaxybuds/400/300",
        "category":       "audio",
        "stock":          25,
        "description":    "Compact earbuds with 3D audio and intelligent ANC. IPX7 water resistance and up to 8 hours of playback per charge.",
        "featured":       0,
        "on_sale":        1,
        "original_price": 199.00,    # 25% off
    },
    {
        "name":           "JBL Tune 760NC",
        "price":          99.00,
        "image":          "https://picsum.photos/seed/jbltune/400/300",
        "category":       "audio",
        "stock":          30,
        "description":    "Foldable over-ear headphones with active noise cancellation. 35 hours of battery life and JBL Pure Bass sound.",
        "featured":       0,
        "on_sale":        0,
        "original_price": None,
    },
    {
        "name":           "Beyerdynamic DT 990 Pro",
        "price":          159.00,
        "image":          "https://picsum.photos/seed/beyerdynamic/400/300",
        "category":       "audio",
        "stock":          8,
        "description":    "Open-back studio reference headphones. Legendary sound quality for mixing, mastering, and critical listening.",
        "featured":       0,
        "on_sale":        0,
        "original_price": None,
    },

    # ── Accessories — new additions ────────────────────────────────────────────
    {
        "name":           "Keychron K2 Wireless Keyboard",
        "price":          89.00,
        "image":          "https://picsum.photos/seed/keychron/400/300",
        "category":       "accessories",
        "stock":          17,
        "description":    "Compact 75% mechanical keyboard with Bluetooth 5.1 and hot-swappable switches. Works on Mac and Windows.",
        "featured":       0,
        "on_sale":        1,
        "original_price": 109.00,    # ~18% off
    },
    {
        "name":           "Elgato Stream Deck MK.2",
        "price":          149.00,
        "image":          "https://picsum.photos/seed/streamdeck/400/300",
        "category":       "accessories",
        "stock":          9,
        "description":    "15 customizable LCD keys for one-touch control of your apps, tools, and platforms. Ideal for content creators.",
        "featured":       0,
        "on_sale":        0,
        "original_price": None,
    },
    {
        "name":           "CalDigit TS4 Thunderbolt 4 Dock",
        "price":          329.00,
        "image":          "https://picsum.photos/seed/caldigit/400/300",
        "category":       "accessories",
        "stock":          5,
        "description":    "18 ports including Thunderbolt 4, USB-A, SD card, and 2.5G Ethernet. Powers your MacBook at up to 98W.",
        "featured":       1,
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
