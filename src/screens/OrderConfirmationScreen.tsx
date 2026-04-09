import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, Package, CheckCircle2 } from 'lucide-react';
import { AbaPayIcon } from '../components/PaymentIcons';

export default function OrderConfirmationScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const book = location.state?.book;
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#F8FCF9] p-4">
        <p className="text-gray-500 mb-4">No book selected for order.</p>
        <button onClick={() => navigate('/')} className="bg-[#006A4E] text-white px-6 py-2 rounded-full">
          Go Back
        </button>
      </div>
    );
  }

  const handleConfirmOrder = () => {
    setIsProcessing(true);
    
    const orderData = {
      orderId: 'BX' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      items: [book],
      subtotal: book.price,
      deliveryFee: deliveryFee,
      total: total,
      paymentMethod: 'ABA PAY',
      shippingAddress: {
        name: 'John Doe',
        phone: '+855 12 345 678',
        address: '123 Street 456, Sangkat Toul Tompoung 1, Khan Chamkarmon, Phnom Penh'
      }
    };

    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      navigate('/receipt', { state: { orderData } });
    }, 1500);
  };

  const deliveryFee = 1.50;
  const total = book.price + deliveryFee;

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#F8FCF9] p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
        <p className="text-gray-500 mb-8">Your order for "{book.title}" has been placed successfully.</p>
        <p className="text-sm text-gray-400">Redirecting to home...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F8FCF9] font-sans">
      {/* Header */}
      <div className="px-4 py-4 flex items-center bg-white sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/')} className="relative z-50 p-2 -ml-2 text-gray-800">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 ml-2">Order Confirmation</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        {/* Item Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 flex gap-4">
          <div className="w-20 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
            {book.imageUrl ? (
              <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#006A4E]/10">
                <span className="text-xs text-[#006A4E] font-medium">No Image</span>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="font-bold text-gray-900 line-clamp-2 mb-1">{book.title}</h3>
            <p className="text-sm text-gray-500 mb-2">Seller: {book.sellerName || 'Anonymous'}</p>
            <span className="font-bold text-[#006A4E]">${book.price.toFixed(2)}</span>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#006A4E]" />
              Delivery Address
            </h3>
            <button className="text-sm text-blue-600 font-medium">Edit</button>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900 mb-1">John Doe (+855 12 345 678)</p>
            <p>123 Street 456, Sangkat Toul Tompoung 1</p>
            <p>Khan Chamkarmon, Phnom Penh</p>
          </div>
        </div>

        {/* Shipping Method */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-[#006A4E]" />
            Shipping Method
          </h3>
          <div className="flex items-center justify-between border border-[#006A4E] bg-[#E8F5F0] rounded-xl p-3">
            <div>
              <p className="font-medium text-gray-900 text-sm">J&T Express</p>
              <p className="text-xs text-gray-500">Estimated delivery: 1-2 days</p>
            </div>
            <span className="font-bold text-gray-900">${deliveryFee.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#006A4E]" />
              Payment Method
            </h3>
            <button className="text-sm text-blue-600 font-medium">Change</button>
          </div>
          <div className="flex items-center gap-3">
            <AbaPayIcon />
            <span className="text-sm text-gray-700 font-medium">ABA PAY</span>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 z-20">
        <div className="flex justify-between items-center mb-4 px-2">
          <span className="text-gray-500">Total Payment</span>
          <span className="text-xl font-bold text-[#006A4E]">${total.toFixed(2)}</span>
        </div>
        <button 
          onClick={handleConfirmOrder}
          disabled={isProcessing}
          className="w-full bg-[#006A4E] text-white rounded-full font-bold py-3.5 shadow-lg shadow-[#006A4E]/20 hover:bg-[#005A42] transition-colors disabled:opacity-70 flex justify-center items-center"
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            'Place Order'
          )}
        </button>
      </div>
    </div>
  );
}
