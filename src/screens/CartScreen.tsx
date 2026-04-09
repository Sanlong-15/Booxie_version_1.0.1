import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import BooxieLogo from '../components/BooxieLogo';

export default function CartScreen() {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, toggleSelection, removeFromCart } = useCart();

  const total = cartItems
    .filter(item => item.selected)
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="flex flex-col h-full bg-[#F8FCF9] font-sans">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 flex items-center justify-between bg-[#F8FCF9] z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="relative z-50 p-2 -ml-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">My Cart</h1>
            <p className="text-xs text-gray-500">A place where you can buy books</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-[#E8F5F0]">
          <BooxieLogo className="w-8 h-8" />
        </div>
      </header>

      <div className="flex-1 px-4 overflow-y-auto">
        {/* Cart List Container */}
        <div className="bg-white rounded-3xl p-4 shadow-sm shadow-gray-200/50 mb-6">
          <div className="space-y-6">
            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Your cart is empty.</div>
            ) : (
              cartItems.map((item, index) => (
                <React.Fragment key={item.id}>
                <div className="flex gap-3 items-center">
                  {/* Checkbox */}
                  <button 
                    onClick={() => toggleSelection(item.id)}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${item.selected ? 'bg-[#006A4E] border-[#006A4E]' : 'border-gray-300 bg-white'}`}
                  >
                    {item.selected && <Check className="w-3 h-3 text-white" />}
                  </button>

                  {/* Image */}
                  <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 cursor-pointer" onClick={() => navigate(`/book/${item.id}`)}>
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1 cursor-pointer" onClick={() => navigate(`/book/${item.id}`)}>{item.title}</h3>
                    
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">
                        50% OFF
                      </span>
                      <span className="text-[10px] text-gray-500">Discounted price</span>
                    </div>
                    
                    <div className="mt-1.5 flex items-end justify-between">
                      <div className="flex items-end gap-1.5">
                        <span className="font-black text-[#006A4E] text-base">${item.price.toFixed(2)}</span>
                        {item.originalPrice && (
                          <span className="text-xs text-gray-400 line-through mb-0.5">${item.originalPrice.toFixed(2)}</span>
                        )}
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 bg-gray-50 rounded-full px-2 py-1 border border-gray-100">
                        <button 
                          onClick={() => {
                            if (item.quantity === 1) {
                              removeFromCart(item.id);
                            } else {
                              updateQuantity(item.id, -1);
                            }
                          }}
                          className="w-5 h-5 flex items-center justify-center rounded-full bg-white shadow-sm text-gray-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-3 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center rounded-full bg-[#006A4E] shadow-sm text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Divider */}
                {index < cartItems.length - 1 && (
                  <div className="w-full h-px bg-gray-100"></div>
                )}
              </React.Fragment>
            )))}
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="bg-white border-t border-gray-100 p-4 z-20 mt-auto sticky bottom-0">
        <div className="flex justify-between items-center mb-4 px-2">
          <span className="text-gray-500">Total</span>
          <span className="text-xl font-bold text-[#006A4E]">${total.toFixed(2)}</span>
        </div>
        <button 
          onClick={() => navigate('/checkout')}
          disabled={cartItems.filter(i => i.selected).length === 0}
          className="w-full bg-[#006A4E] text-white py-4 rounded-full font-bold text-base shadow-lg shadow-[#006A4E]/20 hover:bg-[#005C44] transition-colors disabled:opacity-50"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
