import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Truck, CreditCard, CheckCircle2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { AbaPayIcon, AcledaPayIcon, CashIcon } from '../components/PaymentIcons';
import { useCart } from '../context/CartContext';
import BooxieLogo from '../components/BooxieLogo';

export default function CheckoutScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, clearCart } = useCart();
  
  // If a single book is passed via state (Buy Now), use it. Otherwise use selected cart items.
  const singleBook = location.state?.book;
  const checkoutItems = singleBook 
    ? [{ ...singleBook, quantity: 1, selected: true }] 
    : cartItems.filter(item => item.selected);
    
  const subtotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 1.00;
  const total = subtotal + deliveryFee;
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [shippingMethod, setShippingMethod] = useState('J&T Express');
  const [paymentMethod, setPaymentMethod] = useState('ABA PAY');
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const shippingMethods = ['J&T Express', 'Jalat', 'VET Express'];
  const paymentMethods = [
    { id: 'ABA PAY', label: 'ABA PAY', icon: <AbaPayIcon /> },
    { id: 'ACLEDA Pay', label: 'ACLEDA Pay', icon: <AcledaPayIcon /> },
    { id: 'Cash Pay', label: 'Cash Pay', icon: <CashIcon /> }
  ];

  const handlePlaceOrder = () => {
    if (!fullName || !phone || !address) {
      setErrorMessage('Please fill in your full name, phone number, and address to proceed with the order.');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
      return;
    }
    setErrorMessage('');
    setShowConfirmation(true);
  };

  const handleConfirmOrder = async () => {
    if (checkoutItems.length === 0) {
      navigate('/receipt');
      return;
    }

    setIsProcessing(true);
    try {
      // Update all items in checkout
      for (const item of checkoutItems) {
        if (item.id) {
          const bookRef = doc(db, 'books', item.id);
          await updateDoc(bookRef, {
            status: 'sold'
          });
        }
      }

      const orderData = {
        orderId: 'BX' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        items: checkoutItems,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        total: total,
        paymentMethod: paymentMethod,
        shippingAddress: {
          name: fullName,
          phone: phone,
          address: address
        }
      };

      if (!singleBook) {
        clearCart();
      }
      navigate('/receipt', { state: { orderData } });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `books`);
      setErrorMessage('Failed to process order. Please try again.');
      setShowConfirmation(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FCF9] font-sans relative">
      {/* Error Message Toast */}
      {errorMessage && (
        <div className="fixed top-20 left-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl shadow-sm text-sm font-medium flex items-start gap-2">
            <span className="text-red-500 mt-0.5">⚠️</span>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between bg-[#F8FCF9] sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={() => navigate('/cart')} className="relative z-50 p-2 -ml-2 text-gray-800">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 ml-4">Order Confirmation</h1>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-[#E8F5F0]">
          <BooxieLogo className="w-8 h-8" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {/* Shipping Address */}
        <div className="bg-[#F2F2F2] rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-[#006A4E]" />
            <span className="text-sm text-gray-700">Shipping Address</span>
          </div>
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Full Name" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-white rounded-xl px-4 py-3 text-sm outline-none placeholder:text-gray-300"
            />
            <input 
              type="tel" 
              placeholder="Phone Number" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white rounded-xl px-4 py-3 text-sm outline-none placeholder:text-gray-300"
            />
            <input 
              type="text" 
              placeholder="Your Address" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-white rounded-xl px-4 py-3 text-sm outline-none placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Shipping Method */}
        <div className="bg-[#F2F2F2] rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-4 h-4 text-[#006A4E]" />
            <span className="text-sm text-gray-700">Shipping Method</span>
          </div>
          <div className="space-y-2">
            {shippingMethods.map(method => (
              <div 
                key={method}
                onClick={() => setShippingMethod(method)}
                className={`flex items-center justify-between bg-white rounded-xl px-4 py-3 cursor-pointer border ${shippingMethod === method ? 'border-[#006A4E]' : 'border-transparent'}`}
              >
                <span className="text-sm font-medium text-gray-800">{method}</span>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${shippingMethod === method ? 'border-[#006A4E]' : 'border-gray-300'}`}>
                  {shippingMethod === method && <div className="w-3 h-3 rounded-full bg-[#006A4E]"></div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-[#F2F2F2] rounded-2xl p-4 mb-4">
          <div className="mb-3">
            <span className="text-sm text-gray-700">Payment Method</span>
          </div>
          <div className="space-y-2">
            {paymentMethods.map(method => (
              <div 
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`flex items-center justify-between bg-white rounded-xl px-4 py-3 cursor-pointer border ${paymentMethod === method.id ? 'border-[#006A4E]' : 'border-transparent'}`}
              >
                <div className="flex items-center gap-3">
                  {method.icon}
                  <span className="text-sm font-medium text-gray-800">{method.label}</span>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === method.id ? 'border-[#006A4E]' : 'border-gray-300'}`}>
                  {paymentMethod === method.id && <div className="w-3 h-3 rounded-full bg-[#006A4E]"></div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-[#F2F2F2] rounded-2xl p-4 mb-4">
          <div className="mb-3">
            <span className="text-sm text-gray-700">Order Summary</span>
          </div>
          <div className="space-y-3 mb-4">
            {checkoutItems.map((item, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden shrink-0">
                  <img src={item.image || item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{item.title}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                    <span className="text-sm font-bold text-[#006A4E]">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="w-full h-px bg-gray-200 mb-4"></div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-800 font-medium">
              <span>Shipping Fee</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-900 font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {/* Place Order Button */}
        <div className="flex justify-center mt-6 mb-4">
          <button 
            onClick={handlePlaceOrder}
            className="bg-[#006A4E] text-white px-12 py-3 rounded-full font-medium text-sm shadow-md hover:bg-[#005C44] transition-colors"
          >
            Place Order
          </button>
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-xs flex flex-col items-center text-center animate-in fade-in zoom-in duration-200 shadow-xl">
            <p className="text-base text-gray-800 mb-8">Are you sure you want to buy it?</p>
            <div className="flex gap-4 w-full justify-center">
              <button 
                onClick={handleConfirmOrder}
                disabled={isProcessing}
                className="bg-[#006A4E] text-white px-6 py-2.5 rounded-full font-medium text-sm hover:bg-[#005C44] transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Confirm'}
              </button>
              <button 
                onClick={() => setShowConfirmation(false)}
                disabled={isProcessing}
                className="bg-transparent text-gray-800 px-6 py-2.5 rounded-full font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
