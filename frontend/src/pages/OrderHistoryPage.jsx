import React, { useState, useEffect } from 'react';

// Helper function to encode Date and Phone into a unique tracking string
function encodeOrderId(dateString, phone, id) {
  const datePart = new Date(dateString + 'Z').toISOString().replace(/[-:T.Z]/g, '').slice(2, 8); // YYMMDD
  const infoString = `${datePart}-${phone || id}`;
  // Use a simple hash to make it look like a professional code, or just Base64 encode it
  // We'll use Base64 and take the first 8-10 chars, making it uppercase
  try {
    const b64 = btoa(infoString).replace(/=/g, '').toUpperCase();
    return b64.substring(0, 10);
  } catch (e) {
    return `ORD-${id}`; // Fallback just in case
  }
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      
      let url = `${API_URL}/api/orders`;
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        // Guest mode
        const storedOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]');
        if (storedOrders.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }
        url += `?guest_ids=${storedOrders.join(',')}`;
      }

      try {
        const res = await fetch(url, { headers });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch orders');
        }
        
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [API_URL]);

  if (loading) {
    return <div style={styles.page}><p>Loading order history...</p></div>;
  }

  if (error) {
    return <div style={styles.page}><p style={{color: 'red'}}>{error}</p></div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Order History</h1>
        
        {orders.length === 0 ? (
          <p style={styles.emptyMsg}>You have no order history yet.</p>
        ) : (
          <div style={styles.orderList}>
            {orders.map(order => (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderHeader}>
                  <div style={styles.orderMeta}>
                    <span style={styles.orderId}>Order #{encodeOrderId(order.created_at, order.phone, order.id)}</span>
                    <span style={styles.orderDate}>
                      {new Date(order.created_at + 'Z').toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.orderTotal}>
                    ${order.total.toFixed(2)}
                  </div>
                </div>
                
                <div style={styles.orderItems}>
                  <table style={styles.itemsTable}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Item</th>
                        <th style={styles.th}>Price</th>
                        <th style={styles.th}>Qty</th>
                        <th style={styles.thRight}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map(item => (
                        <tr key={item.id} style={styles.tr}>
                          <td style={styles.td}>{item.name}</td>
                          <td style={styles.td}>${item.price_at_purchase.toFixed(2)}</td>
                          <td style={styles.td}>{item.quantity}</td>
                          <td style={styles.tdRight}>${(item.price_at_purchase * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '40px 20px',
    fontFamily: "'Inter', sans-serif",
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: '24px',
  },
  emptyMsg: {
    color: '#64748b',
    fontSize: '16px',
    fontStyle: 'italic',
  },
  orderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#f1f5f9',
    borderBottom: '1px solid #e2e8f0',
  },
  orderMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  orderId: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
  },
  orderDate: {
    fontSize: '14px',
    color: '#64748b',
  },
  orderTotal: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#059669',
  },
  orderItems: {
    padding: '20px 24px',
  },
  itemsTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    paddingBottom: '12px',
    color: '#64748b',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e2e8f0',
  },
  thRight: {
    textAlign: 'right',
    paddingBottom: '12px',
    color: '#64748b',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e2e8f0',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '12px 0',
    fontSize: '15px',
    color: '#334155',
  },
  tdRight: {
    padding: '12px 0',
    fontSize: '15px',
    color: '#334155',
    textAlign: 'right',
    fontWeight: '600',
  },
};
