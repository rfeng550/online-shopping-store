import React, { useState, useEffect } from 'react';

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editingStockId, setEditingStockId] = useState(null);
  const [newStockValue, setNewStockValue] = useState('');

  useEffect(() => {
    // Note: Flask server is running on port 5001 according to app.py
    fetch('http://localhost:5001/api/products')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      })
      .then(data => {
        // Our old mock API had 'status', so we will generate it if the backend doesn't supply it
        const formattedData = data.map(p => ({
          ...p,
          status: p.status || (p.stock > 0 ? 'Active' : 'Out of Stock')
        }));
        setProducts(formattedData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Extract unique categories for the dropdown
  const categories = [...new Set(products.map(p => p.category))];

  // Filtering products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === '' || product.category === category;
    const matchesLowStock = !lowStockOnly || product.stock < 5;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const handleRestockClick = (product) => {
    setEditingStockId(product.id);
    setNewStockValue(product.stock);
  };

  const handleSaveStock = async (id) => {
    const stockToSave = parseInt(newStockValue, 10) || 0;
    
    try {
      // Send PUT request to update stock in Flask backend
      const res = await fetch(`http://localhost:5001/api/products/${id}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stock: stockToSave })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update stock');
      }
      
      const updatedProduct = await res.json();
      
      // Update local state smoothly without re-rendering everything
      setProducts(products.map(p => 
        p.id === id ? { ...p, stock: updatedProduct.stock, status: updatedProduct.status || p.status } : p
      ));
      
      setEditingStockId(null);
      setError(null); // Clear any past errors
    } catch (err) {
      setError(`Failed to save stock: ${err.message}`);
    }
  };

  if (loading) return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Loading...</div>;
  if (error) return <div style={{ padding: '20px', fontFamily: 'sans-serif', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Admin Inventory</h1>
      
      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <div>
          <label htmlFor="search">Search: </label>
          <input 
            id="search"
            type="text" 
            placeholder="Search by name..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            style={{ padding: '5px' }}
          />
        </div>
        
        <div>
          <label htmlFor="category">Category: </label>
          <select 
            id="category"
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            style={{ padding: '5px' }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input 
              type="checkbox" 
              checked={lowStockOnly} 
              onChange={(e) => setLowStockOnly(e.target.checked)} 
            />
            Low Stock Only (&lt; 5)
          </label>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '10px' }}>ID</th>
            <th style={{ padding: '10px' }}>Name</th>
            <th style={{ padding: '10px' }}>Category</th>
            <th style={{ padding: '10px' }}>Price</th>
            <th style={{ padding: '10px' }}>Stock</th>
            <th style={{ padding: '10px' }}>Status</th>
            <th style={{ padding: '10px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map(product => {
            const isLowStock = product.stock < 5;
            return (
              <tr 
                key={product.id} 
                style={{ 
                  borderBottom: '1px solid #ddd',
                  backgroundColor: isLowStock ? '#fff9c4' : 'transparent', // Light yellow for low stock
                  transition: 'background-color 0.2s'
                }}
              >
                <td style={{ padding: '10px' }}>{product.id}</td>
                <td style={{ padding: '10px' }}>{product.name}</td>
                <td style={{ padding: '10px' }}>{product.category}</td>
                <td style={{ padding: '10px' }}>${product.price.toFixed(2)}</td>
                <td style={{ padding: '10px' }}>
                  {editingStockId === product.id ? (
                    <input 
                      type="number" 
                      value={newStockValue} 
                      onChange={(e) => setNewStockValue(e.target.value)}
                      style={{ width: '60px', padding: '5px' }}
                      min="0"
                    />
                  ) : (
                    <span style={{ fontWeight: isLowStock ? 'bold' : 'normal', color: isLowStock ? '#d32f2f' : 'inherit' }}>
                      {product.stock}
                    </span>
                  )}
                </td>
                <td style={{ padding: '10px' }}>{product.status}</td>
                <td style={{ padding: '10px' }}>
                  {editingStockId === product.id ? (
                    <button 
                      onClick={() => handleSaveStock(product.id)}
                      style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                      Save
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleRestockClick(product)}
                      style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                      Restock
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {filteredProducts.length === 0 && (
            <tr>
              <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No products found matching your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
