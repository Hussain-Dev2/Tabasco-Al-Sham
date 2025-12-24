import React, { useState } from 'react';
import { products } from './config';
import ProductCard from './components/ProductCard';
import CartSummary from './components/CartSummary';
import CategoryTabs from './components/CategoryTabs';

function App() {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);
      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...currentCart, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === productId);
      if (existingItem.quantity === 1) {
        return currentCart.filter((item) => item.id !== productId);
      } else {
        return currentCart.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
    });
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const getProductQuantity = (productId) => {
    const item = cart.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-center">
          <h1 className="text-xl font-bold text-gray-800">🍔 Burger Joint</h1>
        </div>
        
        {/* Categories */}
        <div className="max-w-md mx-auto">
          <CategoryTabs 
            selectedCategory={selectedCategory} 
            onSelectCategory={setSelectedCategory} 
          />
        </div>
      </div>

      {/* Product List */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="h-full">
              <ProductCard
                product={product}
                quantity={getProductQuantity(product.id)}
                onAdd={addToCart}
                onRemove={removeFromCart}
              />
            </div>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No items found in this category.
          </div>
        )}
      </main>

      {/* Footer / Cart */}
      <CartSummary cartItems={cart} />
    </div>
  );
}

export default App;
