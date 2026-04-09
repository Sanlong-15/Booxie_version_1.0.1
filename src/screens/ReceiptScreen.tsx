import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Download, Home, Printer, Share2 } from 'lucide-react';
import BooxieLogo from '../components/BooxieLogo';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReceiptScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state?.orderData;
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!orderData) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#F8FCF9] p-4">
        <p className="text-gray-500 mb-4">No order data found.</p>
        <button onClick={() => navigate('/')} className="bg-[#006A4E] text-white px-6 py-2 rounded-full">
          Go Home
        </button>
      </div>
    );
  }

  const { items, subtotal, deliveryFee, total, paymentMethod, shippingAddress, orderId, date } = orderData;

  const handleSavePDF = async () => {
    if (!receiptRef.current) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Booxie_Receipt_${orderId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Booxie Order Receipt',
          text: `Check out my Booxie order receipt! Order ID: ${orderId}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      alert('Sharing is not supported on this browser.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FCF9] font-sans">
      {/* Header */}
      <div className="px-4 py-6 flex flex-col items-center bg-white border-b border-gray-100">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Success!</h1>
        <p className="text-sm text-gray-500 mt-1">Your receipt has been generated</p>
      </div>

      <div className="flex-1 p-4">
        {/* Receipt Card */}
        <div ref={receiptRef} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
          {/* Decorative "cut" edges at top and bottom */}
          <div className="absolute top-0 left-0 right-0 flex justify-between px-4 -translate-y-1/2">
             {[...Array(10)].map((_, i) => (
               <div key={i} className="w-4 h-4 bg-[#F8FCF9] rounded-full"></div>
             ))}
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-2">
                <BooxieLogo className="w-8 h-8" />
                <span className="font-bold text-[#006A4E]">Booxie</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Order ID</p>
                <p className="text-sm font-mono font-bold text-gray-900">{orderId}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="text-gray-900 font-medium">{date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment Method</span>
                <span className="text-gray-900 font-medium">{paymentMethod}</span>
              </div>
            </div>

            <div className="w-full h-px border-t border-dashed border-gray-200 mb-6"></div>

            {/* Items */}
            <div className="space-y-4 mb-6">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Items</p>
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.title}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity || 1}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900">${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="w-full h-px border-t border-dashed border-gray-200 mb-6"></div>

            {/* Totals */}
            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-[#006A4E] pt-2">
                <span>Total Amount</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-2">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2">Shipping to</p>
              <p className="text-xs text-gray-700 font-medium leading-relaxed">
                {shippingAddress.name}<br/>
                {shippingAddress.phone}<br/>
                {shippingAddress.address}
              </p>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 translate-y-1/2">
             {[...Array(10)].map((_, i) => (
               <div key={i} className="w-4 h-4 bg-[#F8FCF9] rounded-full"></div>
             ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <button 
            onClick={handleSavePDF}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Save PDF
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {/* Footer Action */}
      <div className="p-4 pb-10">
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-[#006A4E] text-white py-4 rounded-full font-bold text-base shadow-lg shadow-[#006A4E]/20 hover:bg-[#005C44] transition-colors flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>
      </div>
    </div>
  );
}
