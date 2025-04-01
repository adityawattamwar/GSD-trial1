import React, { useState, useEffect } from 'react';
import { FaPlus, FaSave, FaSync } from 'react-icons/fa';
import axios from '../../utils/axiosConfig';
import './AdminStyles.css';

const ProductManagement = () => {
  // State for form data
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    image: '',
    inStock: true,
    carbonFootprint: '',
    sustainabilityScore: '',
    recycledMaterials: false
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [products, setProducts] = useState([]);
  
  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);
  
  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/products');
      setProducts(response.data.products || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage('Error loading products: ' + (error.response?.data?.message || error.message));
      setLoading(false);
    }
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setMessage('');
      
      // Format data for API
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        carbonFootprint: formData.carbonFootprint ? parseFloat(formData.carbonFootprint) : 0,
        sustainabilityScore: formData.sustainabilityScore ? parseFloat(formData.sustainabilityScore) : 50
      };
      
      // Send to API
      const response = await axios.post('/api/products/admin', productData);
      
      if (response.data.success) {
        setMessage('Product successfully added!');
        setFormData({
          name: '',
          price: '',
          description: '',
          category: '',
          image: '',
          inStock: true,
          carbonFootprint: '',
          sustainabilityScore: '',
          recycledMaterials: false
        });
        
        // Refresh product list
        fetchProducts();
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setMessage('Error adding product: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="admin-page">
      <h1>Admin Product Management</h1>
      <p className="subtitle">Add new products to the store</p>
      
      {/* Message Display */}
      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      
      {/* Add Product Form */}
      <div className="admin-form">
        <h2><FaPlus /> Add New Product</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="name">Product Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter product name"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price ($) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Electronics, Clothing"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter product description"
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="image">Image URL</label>
              <input
                type="text"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="URL to product image (optional)"
              />
            </div>
          </div>
          
          <div className="form-section">
            <h3>Sustainability Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="carbonFootprint">Carbon Footprint (kg CO2e)</label>
                <input
                  type="number"
                  id="carbonFootprint"
                  name="carbonFootprint"
                  value={formData.carbonFootprint}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="sustainabilityScore">Sustainability Score (0-100)</label>
                <input
                  type="number"
                  id="sustainabilityScore"
                  name="sustainabilityScore"
                  value={formData.sustainabilityScore}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  placeholder="50"
                />
              </div>
            </div>
            
            <div className="form-row checkbox-row">
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="inStock"
                  name="inStock"
                  checked={formData.inStock}
                  onChange={handleChange}
                />
                <label htmlFor="inStock">In Stock</label>
              </div>
              
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="recycledMaterials"
                  name="recycledMaterials"
                  checked={formData.recycledMaterials}
                  onChange={handleChange}
                />
                <label htmlFor="recycledMaterials">Made from Recycled Materials</label>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? (
                <>
                  <FaSync className="fa-spin" /> Adding Product...
                </>
              ) : (
                <>
                  <FaSave /> Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Product List */}
      <div className="product-list">
        <h2>Products ({products.length})</h2>
        
        {products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Sustainability</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>{product.sustainabilityScore}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;