import React, { createContext, useContext, useState, useEffect } from 'react';
import baseurl from '../baseurl/ApiService';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = async () => {
    try {
      const customerId = localStorage.getItem('customer_id');
      if (!customerId) return;

      const parsedCustomerId = JSON.parse(customerId);
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${baseurl}/api/cart/${parsedCustomerId}`, {
        method: 'GET',
        headers: headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setCartCount(data.length);
        }
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  // Fetch cart count on mount
  useEffect(() => {
    fetchCartCount();
  }, []);

  const updateCartCount = (newCount) => {
    setCartCount(newCount);
  };

  const incrementCartCount = () => {
    setCartCount(prev => prev + 1);
  };

  const decrementCartCount = () => {
    setCartCount(prev => Math.max(0, prev - 1));
  };

  return (
    <CartContext.Provider value={{ 
      cartCount, 
      updateCartCount, 
      incrementCartCount, 
      decrementCartCount,
      fetchCartCount 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 