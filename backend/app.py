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
#   PUT    http://localhost:5001/api/products/1/stock      → restock: update stock, return full product
#   DELETE http://localhost:5001/api/products/1            → delete a product
#   POST   http://localhost:5001/api/auth/google-login     → verify Google token, return JWT
#
# =============================================================================

import os
from dotenv import load_dotenv

load_dotenv()

import sqlite3
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, decode_token
from jwt.exceptions import ExpiredSignatureError, DecodeError
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# -----------------------------------------------------------------------------
# Create the Flask app and enable CORS
# -----------------------------------------------------------------------------
app = Flask(__name__)

# CORS lets your React app (running at localhost:5173) call this API.
# Without this, the browser would block the request with a CORS error.
CORS(app, origins=[
    "http://localhost:5173",
    "https://online-shopping-store-pi.vercel.app"
])

# JWT configuration — secret key is loaded from .env
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "fallback-secret-change-me")
jwt = JWTManager(app)

# Google OAuth client ID — loaded from .env
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

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
# Helper decorator: require_role(role)
# -----------------------------------------------------------------------------
import functools

def require_roles(required_roles):
    """Decorator factory that protects a route with JWT + role check.

    Usage:
        @app.route("/api/some-admin-route", methods=["PUT"])
        @require_roles(["admin", "cashier"])
        def my_view():
            ...

    What it does:
      1. Reads the Authorization header — expects "Bearer <jwt-token>"
      2. Decodes the JWT using the app's secret key
      3. Reads the "role" claim embedded in the token
      4. If the role is in required_roles → calls the original view function
      5. If the token is missing           → 401 Unauthorized
      6. If the token is invalid/expired   → 401 Unauthorized
      7. If the role does not match        → 403 Forbidden
    """
    def decorator(fn):
        @functools.wraps(fn)   # preserve the original function's name for Flask routing
        def wrapper(*args, **kwargs):
            # ── Step 1: extract token from the Authorization header ──────────
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return jsonify({"error": "Missing or malformed Authorization header"}), 401

            token = auth_header.split(" ", 1)[1]  # everything after "Bearer "

            # ── Step 2: decode and validate the JWT ──────────────────────────
            try:
                # decode_token is a flask-jwt-extended helper that uses the
                # app's JWT_SECRET_KEY and rejects expired tokens automatically.
                decoded = decode_token(token)
            except Exception:
                return jsonify({"error": "Invalid or expired token"}), 401

            # ── Step 3: check the role claim ─────────────────────────────────
            user_role = decoded.get("role") or decoded.get("additional_claims", {}).get("role")
            if user_role not in required_roles:
                return jsonify({"error": f"Forbidden: requires one of {required_roles}"}), 403

            # ── Step 4: all good — call the real view function ───────────────
            return fn(*args, **kwargs)
        return wrapper
    return decorator


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
# Route 7 — Restock a product (Admin)  PUT /api/products/<id>/stock
# -----------------------------------------------------------------------------
@app.route("/api/products/<int:product_id>/stock", methods=["PUT"])
@require_roles(["admin"])   # ← JWT required; role must be "admin"
def restock_product(product_id):
    """Update the stock field and return the full updated product row.

    Why PUT instead of PATCH?
      PATCH = partial update (we already use it above for quick +/- adjustments).
      PUT   = full replacement of a resource — here we're setting an exact new
              stock value and returning the complete product back to the caller.

    Expected request body:
      { "stock": 25 }

    Possible responses:
      200 + full product JSON   — success
      400 + error message       — stock is missing, not an integer, or negative
      404 + error message       — no product with that id exists

    Example (curl):
      curl -X PUT http://localhost:5001/api/products/3/stock \
           -H "Content-Type: application/json" \
           -d '{"stock": 25}'

    React usage:
      const res = await fetch(`http://localhost:5001/api/products/${id}/stock`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
      const updatedProduct = await res.json();
    """
    # ── Step 1: Read the JSON body sent by the client ──────────────────────────
    data = request.get_json()   # returns None if the body is not valid JSON

    # Pull out the "stock" field (will be None if the key is missing)
    new_stock = data.get("stock") if data else None

    # ── Step 2: Validate the input ─────────────────────────────────────────────
    # We need stock to be:
    #   - present in the body
    #   - an integer (not a float, string, etc.)
    #   - 0 or higher (can't have negative stock)
    if new_stock is None or not isinstance(new_stock, int) or new_stock < 0:
        return jsonify({"error": "stock must be a non-negative integer"}), 400

    # ── Step 3: Check the product exists ───────────────────────────────────────
    con = get_connection()

    row = con.execute(
        "SELECT * FROM products WHERE id = ?",
        (product_id,)
    ).fetchone()

    if row is None:
        con.close()
        return jsonify({"error": f"Product with id {product_id} not found"}), 404

    # ── Step 4: Update the stock column ────────────────────────────────────────
    con.execute(
        "UPDATE products SET stock = ? WHERE id = ?",
        (new_stock, product_id)   # ? placeholders keep SQL injection out
    )
    con.commit()   # write the change to disk

    # ── Step 5: Fetch the updated row and return it ────────────────────────────
    # We re-fetch so the response reflects exactly what is now in the database.
    updated_row = con.execute(
        "SELECT * FROM products WHERE id = ?",
        (product_id,)
    ).fetchone()

    con.close()

    return jsonify(dict(updated_row)), 200   # full product object back to caller


# -----------------------------------------------------------------------------
# Route 8 — Delete a product  (Admin)
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


# -----------------------------------------------------------------------------
# Route 9 — Google Sign-In  (Auth)
# -----------------------------------------------------------------------------
@app.route("/api/auth/google-login", methods=["POST"])
def google_login():
    """Verify a Google credential token and return a signed JWT.

    Flow:
      1. Receive the Google ID token from the React frontend
      2. Verify it with Google's servers using the google-auth library
      3. Extract email + name from the verified token payload
      4. Look up the user in our 'users' table by email
         - If not found, auto-register them as "customer"
      5. Issue a JWT containing user id, email, and role
      6. Return the JWT to the frontend

    Expected request body:
      { "credential": "<google-id-token-string>" }

    Possible responses:
      200 + { "token": "..." }   — success
      400 + error message        — missing credential field
      401 + error message        — invalid/expired Google token
    """
    data = request.get_json()
    credential = data.get("credential") if data else None

    if not credential:
        return jsonify({"error": "Missing credential"}), 400

    try:
        # Verify the token against Google's public certificates.
        # This call also checks the token expiry and audience (client_id).
        id_info = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        # Token is invalid or expired
        return jsonify({"error": f"Invalid token: {str(e)}"}), 401

    # Extract user details from the verified token payload
    email = id_info.get("email")
    name  = id_info.get("name", email)   # fall back to email if no name

    # Look up or create user in the database
    con = get_connection()

    row = con.execute(
        "SELECT * FROM users WHERE email = ?", (email,)
    ).fetchone()

    if row is None:
        # New user — register with default "customer" role
        cur = con.execute(
            "INSERT INTO users (email, name, role) VALUES (?, ?, ?)",
            (email, name, "customer")
        )
        con.commit()
        user_id   = cur.lastrowid
        user_role = "customer"
    else:
        user_id   = row["id"]
        user_role = row["role"]
        name      = row["name"]   # use the stored name (e.g. "Admin")

    con.close()

    # Create a JWT that includes user info as additional claims
    token = create_access_token(
        identity=str(user_id),
        additional_claims={
            "email": email,
            "name":  name,
            "role":  user_role,
        }
    )

    return jsonify({"token": token}), 200


# -----------------------------------------------------------------------------
# Route 9 — POS Checkout (Admin / Cashier)
# -----------------------------------------------------------------------------
@app.route("/api/pos/checkout", methods=["POST"])
@require_roles(["admin", "cashier"])
def pos_checkout():
    """Process a POS sale.

    Expects: { "items": [ {"id": 1, "quantity": 2}, ... ] }
    Deducts stock and creates an order record.
    """
    data = request.get_json()
    if not data or "items" not in data or not isinstance(data["items"], list):
        return jsonify({"error": "Invalid payload. Expected { 'items': [...] }"}), 400

    items = data["items"]
    if not items:
        return jsonify({"error": "Cart is empty"}), 400

    con = get_connection()
    try:
        con.execute("BEGIN TRANSACTION")
        
        total_price = 0.0
        processed_items = []

        for item in items:
            product_id = item.get("id")
            quantity = item.get("quantity")
            
            if not isinstance(product_id, int) or not isinstance(quantity, int) or quantity <= 0:
                raise ValueError("Invalid item format")

            row = con.execute("SELECT name, price, stock FROM products WHERE id = ?", (product_id,)).fetchone()
            if not row:
                raise ValueError(f"Product ID {product_id} not found")
            
            stock = row["stock"]
            price = row["price"]
            name = row["name"]
            
            if stock < quantity:
                raise ValueError(f"Not enough stock for {name}. Available: {stock}, Requested: {quantity}")

            con.execute("UPDATE products SET stock = stock - ? WHERE id = ?", (quantity, product_id))
            
            total_price += price * quantity
            processed_items.append({
                "product_id": product_id,
                "quantity": quantity,
                "price": price
            })

        cur = con.cursor()
        cur.execute("INSERT INTO orders (total) VALUES (?)", (total_price,))
        order_id = cur.lastrowid

        for p_item in processed_items:
            cur.execute(
                "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)",
                (order_id, p_item["product_id"], p_item["quantity"], p_item["price"])
            )

        con.commit()
        return jsonify({"message": "Sale completed successfully", "order_id": order_id}), 200

    except ValueError as e:
        con.rollback()
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        con.rollback()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        con.close()


# -----------------------------------------------------------------------------
# Route 10 — Online Checkout (Public / Customer)
# -----------------------------------------------------------------------------
@app.route("/api/checkout", methods=["POST"])
def online_checkout():
    """Process an online store checkout.

    Expects: { "items": [ {"id": 1, "quantity": 2}, ... ] }
    If Authorization header is provided, links the order to the user.
    """
    data = request.get_json()
    if not data or "items" not in data or not isinstance(data["items"], list):
        return jsonify({"error": "Invalid payload. Expected { 'items': [...] }"}), 400

    items = data["items"]
    phone = data.get("phone")
    if not items:
        return jsonify({"error": "Cart is empty"}), 400

    # Check for optional auth token to link user
    user_id = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            decoded = decode_token(token)
            user_id = decoded.get("sub")
        except Exception:
            pass # Ignore invalid token for guest checkout

    con = get_connection()
    try:
        con.execute("BEGIN TRANSACTION")
        
        total_price = 0.0
        processed_items = []

        for item in items:
            product_id = item.get("id")
            quantity = item.get("quantity")
            
            if not isinstance(product_id, int) or not isinstance(quantity, int) or quantity <= 0:
                raise ValueError("Invalid item format")

            row = con.execute("SELECT name, price, stock FROM products WHERE id = ?", (product_id,)).fetchone()
            if not row:
                raise ValueError(f"Product ID {product_id} not found")
            
            stock = row["stock"]
            price = row["price"]
            name = row["name"]
            
            if stock < quantity:
                raise ValueError(f"Not enough stock for {name}. Available: {stock}, Requested: {quantity}")

            con.execute("UPDATE products SET stock = stock - ? WHERE id = ?", (quantity, product_id))
            
            total_price += price * quantity
            processed_items.append({
                "product_id": product_id,
                "quantity": quantity,
                "price": price
            })

        cur = con.cursor()
        if user_id:
            cur.execute("INSERT INTO orders (user_id, total, phone) VALUES (?, ?, ?)", (user_id, total_price, phone))
        else:
            cur.execute("INSERT INTO orders (total, phone) VALUES (?, ?)", (total_price, phone))
        order_id = cur.lastrowid

        for p_item in processed_items:
            cur.execute(
                "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)",
                (order_id, p_item["product_id"], p_item["quantity"], p_item["price"])
            )

        con.commit()
        return jsonify({"message": "Order placed successfully", "order_id": order_id}), 200

    except ValueError as e:
        con.rollback()
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        con.rollback()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        con.close()

# -----------------------------------------------------------------------------
# Route 11 — Order History (Customer / Admin)
# -----------------------------------------------------------------------------
@app.route("/api/orders", methods=["GET"])
def get_orders():
    """Fetch order history.
    Admins see all orders. Customers see their own.
    Guests see orders matching guest_ids (only where user_id IS NULL).
    """
    auth_header = request.headers.get("Authorization", "")
    user_role = None
    user_id = None
    
    if auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ", 1)[1]
            decoded = decode_token(token)
            user_id = decoded.get("sub")
            user_role = decoded.get("role") or decoded.get("additional_claims", {}).get("role")
        except Exception:
            pass # Treat as guest if token is invalid

    con = get_connection()
    if user_role == "admin":
        orders = con.execute("SELECT * FROM orders ORDER BY created_at DESC").fetchall()
    elif user_role in ["customer", "cashier"] and user_id:
        orders = con.execute("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
    else:
        # Guest mode
        guest_ids_param = request.args.get("guest_ids")
        if not guest_ids_param:
            con.close()
            return jsonify([]), 200
            
        # Parse guest_ids (e.g., "1,2,3")
        try:
            guest_ids = [int(gid) for gid in guest_ids_param.split(",") if gid.strip()]
        except ValueError:
            con.close()
            return jsonify({"error": "Invalid guest_ids parameter"}), 400
            
        if not guest_ids:
            con.close()
            return jsonify([]), 200

        # Create placeholders for IN clause
        placeholders = ",".join("?" * len(guest_ids))
        query = f"SELECT * FROM orders WHERE id IN ({placeholders}) AND user_id IS NULL ORDER BY created_at DESC"
        orders = con.execute(query, guest_ids).fetchall()

    order_list = []
    for o in orders:
        o_dict = dict(o)
        items = con.execute("""
            SELECT oi.*, p.name 
            FROM order_items oi 
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        """, (o["id"],)).fetchall()
        o_dict["items"] = [dict(i) for i in items]
        order_list.append(o_dict)
        
    con.close()
    return jsonify(order_list), 200

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
