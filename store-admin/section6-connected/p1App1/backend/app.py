# =============================================================================
# backend/app.py — Flask API reading from SQLite (products.db)
# =============================================================================
#
# SETUP (run these once before starting the server):
#   python3 init_db.py        ← creates the products table
#   python3 seed_products.py  ← fills the table with sample data
#
# START THE SERVER:
#   python3 app.py
#
# ENDPOINTS:
#   GET    http://localhost:5001/api/health                → {"status": "ok"}
#   GET    http://localhost:5001/api/products              → list of all products
#   GET    http://localhost:5001/api/products/1            → one product by id
#   POST   http://localhost:5001/api/products              → create a new product
#   PUT    http://localhost:5001/api/products/1            → update all fields
#   PATCH  http://localhost:5001/api/products/1/stock      → update stock count only
#   DELETE http://localhost:5001/api/products/1            → delete a product
#
# =============================================================================

import os
import sqlite3
from flask import Flask, jsonify, request
from flask_cors import CORS

# -----------------------------------------------------------------------------
# Create the Flask app and enable CORS
# -----------------------------------------------------------------------------
app = Flask(__name__)

# CORS lets your React app (running at localhost:5173) call this API.
# Without this, the browser would block the request with a CORS error.
CORS(app, origins=["http://localhost:5173"])

# Build the full path to the database file, e.g.:
#   /Users/yourname/Desktop/Data/backend/products.db
DB_PATH = os.path.join(os.path.dirname(__file__), "products.db")


# -----------------------------------------------------------------------------
# Helper: open a connection and make rows behave like dictionaries
# -----------------------------------------------------------------------------
def get_connection():
    """Open and return a new SQLite connection.

    row_factory = sqlite3.Row lets us do row["name"] instead of row[1].
    Remember to call con.close() when you're done.
    """
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row   # rows act like dicts
    return con


# -----------------------------------------------------------------------------
# Route 1 — Health check
# -----------------------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health():
    """Simple check that the server is running.

    Test it: curl http://localhost:5001/api/health
    """
    return jsonify({"status": "ok"}), 200


# -----------------------------------------------------------------------------
# Route 2 — Get all products
# -----------------------------------------------------------------------------
@app.route("/api/products", methods=["GET"])
def get_products():
    """Select every row from the products table and return it as JSON.

    How it works:
      1. Open a connection to products.db
      2. Run SELECT * FROM products
      3. Convert each row to a plain dict (so jsonify can handle it)
      4. Close the connection
      5. Return the list as a JSON array

    React usage:
      const res = await fetch("http://localhost:5001/api/products")
      const products = await res.json()   // → array of product objects
    """
    con = get_connection()

    # fetchall() returns all matching rows
    rows = con.execute("SELECT * FROM products").fetchall()

    con.close()  # always close the connection when finished

    # Convert sqlite3.Row objects → plain Python dicts → JSON
    products = [dict(row) for row in rows]

    return jsonify(products), 200


# -----------------------------------------------------------------------------
# Route 3 — Get one product by id
# -----------------------------------------------------------------------------
@app.route("/api/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    """Find a single product by its id.

    The <int:product_id> part in the URL:
      - Captures the number from the URL, e.g. /api/products/3  →  product_id = 3
      - Flask automatically rejects non-integer values (letters, etc.)

    Returns:
      - 200 + product JSON  if the id exists
      - 404 + error JSON    if the id does not exist

    React usage:
      const res = await fetch(`http://localhost:5001/api/products/${id}`)
      if (res.ok) {
        const product = await res.json()
      }
    """
    con = get_connection()

    # The ? placeholder safely injects product_id into the SQL query.
    # Never use f-strings in SQL — that opens the door to SQL injection.
    row = con.execute(
        "SELECT * FROM products WHERE id = ?",
        (product_id,)   # must be a tuple, hence the trailing comma
    ).fetchone()        # fetchone() returns one row or None

    con.close()

    # If no row was found, return a 404 error
    if row is None:
        return jsonify({"error": f"Product with id {product_id} not found"}), 404

    # Row found — return it as a JSON object
    return jsonify(dict(row)), 200


# -----------------------------------------------------------------------------
# Route 4 — Create a new product  (Admin)
# -----------------------------------------------------------------------------
@app.route("/api/products", methods=["POST"])
def create_product():
    """Insert a new product into the database.

    Expects a JSON body with: name, price, image, category, stock,
    description, featured (0/1), on_sale (0/1).
    Returns the new product's id.
    """
    data = request.get_json()

    # Validate the two fields we can't leave empty
    if not data or not data.get("name") or data.get("price") is None:
        return jsonify({"error": "name and price are required"}), 400

    con = get_connection()
    cur = con.execute(
        """
        INSERT INTO products (name, price, image, category, stock, description, featured, on_sale)
        VALUES (:name, :price, :image, :category, :stock, :description, :featured, :on_sale)
        """,
        {
            "name":        data.get("name"),
            "price":       float(data.get("price", 0)),
            "image":       data.get("image", ""),
            "category":    data.get("category", ""),
            "stock":       int(data.get("stock", 0)),
            "description": data.get("description", ""),
            "featured":    int(bool(data.get("featured", 0))),
            "on_sale":     int(bool(data.get("on_sale", 0))),
        },
    )
    con.commit()
    new_id = cur.lastrowid   # the auto-assigned id for the new row
    con.close()

    return jsonify({"message": "created", "id": new_id}), 201


# -----------------------------------------------------------------------------
# Route 5 — Update all fields of a product  (Admin)
# -----------------------------------------------------------------------------
@app.route("/api/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    """Replace all fields of an existing product.

    Returns 404 if the product does not exist.
    """
    data = request.get_json()

    con = get_connection()

    # Check the product exists first
    row = con.execute("SELECT id FROM products WHERE id = ?", (product_id,)).fetchone()
    if row is None:
        con.close()
        return jsonify({"error": f"Product {product_id} not found"}), 404

    con.execute(
        """
        UPDATE products
        SET name=:name, price=:price, image=:image, category=:category,
            stock=:stock, description=:description,
            featured=:featured, on_sale=:on_sale
        WHERE id=:id
        """,
        {
            "name":        data.get("name"),
            "price":       float(data.get("price", 0)),
            "image":       data.get("image", ""),
            "category":    data.get("category", ""),
            "stock":       int(data.get("stock", 0)),
            "description": data.get("description", ""),
            "featured":    int(bool(data.get("featured", 0))),
            "on_sale":     int(bool(data.get("on_sale", 0))),
            "id":          product_id,
        },
    )
    con.commit()
    con.close()

    return jsonify({"message": "updated", "id": product_id}), 200


# -----------------------------------------------------------------------------
# Route 6 — Update stock count only  (Admin)
# -----------------------------------------------------------------------------
@app.route("/api/products/<int:product_id>/stock", methods=["PATCH"])
def update_stock(product_id):
    """Update only the stock field of a product.

    Expects: {"stock": <non-negative integer>}
    Useful for quick +/- stock adjustments in the admin UI.
    """
    data = request.get_json()
    stock = data.get("stock") if data else None

    # Validate: stock must be present and non-negative
    if stock is None or not isinstance(stock, int) or stock < 0:
        return jsonify({"error": "stock must be a non-negative integer"}), 400

    con = get_connection()
    row = con.execute("SELECT id FROM products WHERE id = ?", (product_id,)).fetchone()
    if row is None:
        con.close()
        return jsonify({"error": f"Product {product_id} not found"}), 404

    con.execute("UPDATE products SET stock = ? WHERE id = ?", (stock, product_id))
    con.commit()
    con.close()

    return jsonify({"message": "stock updated", "id": product_id, "stock": stock}), 200


# -----------------------------------------------------------------------------
# Route 7 — Delete a product  (Admin)
# -----------------------------------------------------------------------------
@app.route("/api/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    """Permanently delete a product row from the database.

    Returns 404 if the product does not exist.
    """
    con = get_connection()
    row = con.execute("SELECT id FROM products WHERE id = ?", (product_id,)).fetchone()
    if row is None:
        con.close()
        return jsonify({"error": f"Product {product_id} not found"}), 404

    con.execute("DELETE FROM products WHERE id = ?", (product_id,))
    con.commit()
    con.close()

    return jsonify({"message": "deleted", "id": product_id}), 200


if __name__ == "__main__":
    # Check that the database file exists before starting
    if not os.path.exists(DB_PATH):
        print("⚠️  products.db not found!")
        print("    Run: python3 init_db.py  then  python3 seed_products.py")
    else:
        print(f"✅  Connected to: {DB_PATH}")

    # debug=True → server restarts automatically when you save this file
    # host="0.0.0.0" → accessible from any device on your local network
    # port=5001 → port 5000 is reserved by macOS AirPlay Receiver
    app.run(host="0.0.0.0", port=5001, debug=True)
