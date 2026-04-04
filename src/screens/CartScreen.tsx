import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ChevronRight } from 'lucide-react';

// Mock data for cart items
const initialCartItems = [
  {
    id: '1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    price: 15.00,
    image: 'https://picsum.photos/seed/gatsby/100/150',
    condition: 'Good'
  },
  {
    id: '2',
    title: '1984',
    author: 'George Orwell',
    price: 12.50,
    image: 'https://picsum.photos/seed/1984/100/150',
    condition: 'Like New'
  }
];

export default function CartScreen() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(initialCartItems);

  const handleRemove = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="flex flex-col h-full bg-booxie-bg font-sans">
      <header className="px-6 pt-6 pb-4 flex items-center gap-4 bg-white shadow-sm z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Your Cart</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-lg font-medium">Your cart is empty</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-4 text-booxie-green font-medium hover:underline"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm flex gap-4 items-center">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-16 h-24 object-cover rounded-lg shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{item.author}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold text-booxie-green">${item.price.toFixed(2)}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md">{item.condition}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemove(item.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="bg-white p-6 border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600 font-medium">Total</span>
            <span className="text-2xl font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
          </div>
          <button className="w-full bg-booxie-green text-white py-4 rounded-xl font-bold text-lg hover:bg-booxie-green-dark transition-colors flex items-center justify-center gap-2">
            Proceed to Checkout
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
