import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

export default function ProductCard({ id, name, price, image, category, stock, on_sale, original_price }) {
  const { addToCart } = useCart();
  const [flash, setFlash] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault(); // prevent Link navigation
    if (stock === 0) return;
    addToCart({ id, name, price, image, category, stock, on_sale });
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  };

  // Calculate discount % if this product has an original (higher) price
  const discountPct = on_sale && original_price && original_price > price
    ? Math.round((original_price - price) / original_price * 100)
    : null;

  // Determine stock status
  // Low stock threshold: < 5 (changed from < 10)
  let stockLabel, stockColor;
  if (stock === 0) {
    stockLabel = "Out of Stock";
    stockColor = "#e53e3e"; // red
  } else if (stock < 5) {
    stockLabel = `⚠️ Only ${stock} left!`;
    stockColor = "#dd6b20"; // orange
  } else {
    stockLabel = "In Stock";
    stockColor = "#38a169"; // green
  }

  return (
    <Link to={`/products/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
    <div style={styles.card}>
      {/* Sale badge — shows percentage off when original_price is available */}
      {on_sale ? (
        <span style={styles.saleBadge}>
          {discountPct ? `${discountPct}% OFF` : "Sale!"}
        </span>
      ) : null}

      {/* Product image */}
      <img src={image} alt={name} style={styles.image} />

      <div style={styles.body}>
        {/* Category badge */}
        <span style={styles.categoryBadge}>{category}</span>

        {/* Product name */}
        <h2 style={styles.name}>{name}</h2>

        {/* Price — shows original crossed out when on sale */}
        <div style={styles.priceRow}>
          <span style={styles.price}>${price.toFixed(2)}</span>
          {on_sale && original_price ? (
            <span style={styles.originalPrice}>${original_price.toFixed(2)}</span>
          ) : null}
        </div>

        {/* Stock status */}
        <p style={{ ...styles.stock, color: stockColor }}>● {stockLabel}</p>

        {/* Add to Cart button */}
        <button
          style={{
            ...styles.button,
            ...(flash ? styles.buttonFlash : {}),
            ...(stock === 0 ? styles.buttonDisabled : {}),
          }}
          disabled={stock === 0}
          onClick={handleAddToCart}
        >
          {stock === 0 ? "Unavailable" : flash ? "✓ Added!" : "Add to Cart"}
        </button>
      </div>
    </div>
    </Link>
  );
}

const styles = {
  card: {
    position: "relative",
    width: "280px",
    borderRadius: "3px",
    border: "1px solid #e0ddd8",
    boxShadow: "none",
    overflow: "hidden",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    backgroundColor: "#fff",
    transition: "border-color 0.15s ease",
  },
  saleBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    backgroundColor: "#c0392b",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "700",
    padding: "3px 8px",
    borderRadius: "2px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    zIndex: 1,
  },
  image: {
    width: "100%",
    height: "200px",
    objectFit: "cover",
    display: "block",
    backgroundColor: "#f5f3ef",
  },
  body: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  categoryBadge: {
    display: "inline-block",
    backgroundColor: "transparent",
    color: "#999",
    fontSize: "10px",
    fontWeight: "600",
    padding: "0",
    borderRadius: "0",
    textTransform: "uppercase",
    letterSpacing: "1px",
    width: "fit-content",
  },
  name: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "400",
    color: "#1a1a1a",
    lineHeight: "1.4",
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  price: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    color: "#1a1a1a",
  },
  priceRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: 0,
  },
  originalPrice: {
    fontSize: "13px",
    fontWeight: "400",
    color: "#aaa",
    textDecoration: "line-through",
  },
  stock: {
    margin: 0,
    fontSize: "12px",
    fontWeight: "500",
    letterSpacing: "0.2px",
  },
  button: {
    marginTop: "10px",
    padding: "10px",
    backgroundColor: "#1c1c1a",
    color: "#fff",
    border: "1px solid #1c1c1a",
    borderRadius: "2px",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    cursor: "pointer",
    width: "100%",
    transition: "background 0.15s ease",
  },
  buttonFlash: {
    backgroundColor: "#2e6b3e",
    borderColor: "#2e6b3e",
  },
  buttonDisabled: {
    backgroundColor: "#e8e5e0",
    borderColor: "#e8e5e0",
    color: "#aaa",
    cursor: "not-allowed",
  },
};
