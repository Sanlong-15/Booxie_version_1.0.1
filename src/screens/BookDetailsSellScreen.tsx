import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { ChevronLeft, ChevronDown } from 'lucide-react';

export default function BookDetailsSellScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const titleInputRef = React.useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: 'Textbook',
    isbn: '',
    price: '',
    condition: 'Used',
    description: '',
    imageUrl: '',
    backCoverUrl: ''
  });

  useEffect(() => {
    if (location.state?.scannedData) {
      const { title, author, description, price, imageUrl, backCoverUrl } = location.state.scannedData;
      setFormData(prev => ({
        ...prev,
        title: title || prev.title,
        author: author || prev.author,
        description: description || prev.description,
        price: price ? price.toString() : prev.price,
        imageUrl: imageUrl || prev.imageUrl,
        backCoverUrl: backCoverUrl || prev.backCoverUrl
      }));
    }
  }, [location.state]);

  const handleSellClick = () => {
    setShowConfirm(true);
  };

  const confirmSell = async () => {
    if (!auth.currentUser) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      const bookData = {
        title: formData.title,
        author: formData.author,
        category: formData.category,
        isbn: formData.isbn,
        description: formData.description,
        price: Number(formData.price),
        sellerId: auth.currentUser.uid,
        sellerName: auth.currentUser.displayName || 'Anonymous',
        status: 'available',
        condition: formData.condition.toLowerCase().replace(' ', '-'),
        type: 'sale',
        createdAt: serverTimestamp(),
        imageUrl: formData.imageUrl,
        backCoverUrl: formData.backCoverUrl
      };

      await addDoc(collection(db, 'books'), bookData);
      setShowConfirm(false);
      setShowSuccess(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'books');
      setError('Failed to list book.');
      setShowConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-full bg-white flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 bg-booxie-green rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
        <p className="text-gray-500 text-center mb-8">Your book has been successfully listed.</p>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-booxie-green text-white py-4 rounded-full font-bold text-lg shadow-lg shadow-booxie-green/30 hover:bg-booxie-green-dark transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm shrink-0">
        <button onClick={() => navigate('/sell')} className="relative z-50 p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">{isEditing ? 'Adjust Details' : 'Review Listing'}</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="flex-1 p-4 flex flex-col">
        {/* Images Preview */}
        {(formData.imageUrl || formData.backCoverUrl) && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
            {formData.imageUrl && (
              <div className="relative shrink-0">
                <img src={formData.imageUrl} alt="Front cover" className="h-32 w-24 object-cover rounded-lg bg-white p-1 shadow-sm" />
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">Front</span>
              </div>
            )}
            {formData.backCoverUrl && (
              <div className="relative shrink-0">
                <img src={formData.backCoverUrl} alt="Back cover" className="h-32 w-24 object-cover rounded-lg bg-white p-1 shadow-sm" />
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">Back</span>
              </div>
            )}
          </div>
        )}

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-4">{error}</div>}

        {isEditing ? (
          <div className="space-y-4 pb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Book Title</label>
              <input 
                ref={titleInputRef}
                type="text" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-booxie-green"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Author</label>
                <input 
                  type="text" 
                  value={formData.author}
                  onChange={e => setFormData({...formData, author: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-booxie-green"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">ID</label>
                <input 
                  type="text" 
                  value={formData.isbn}
                  onChange={e => setFormData({...formData, isbn: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-booxie-green"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Book Category</label>
              <div className="relative">
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-booxie-green"
                >
                  <option value="Textbook">Textbook</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Condition</label>
              <div className="flex gap-2">
                {['New', 'Like New', 'Used'].map(cond => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setFormData({...formData, condition: cond})}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                      formData.condition === cond 
                        ? 'bg-booxie-green text-white border-booxie-green' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Price ( $ ) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-booxie-green"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea 
                rows={3}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-booxie-green"
                placeholder="Describe the condition of the book"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{formData.title || 'Untitled Book'}</h2>
              <p className="text-gray-500 mt-1">{formData.author || 'Unknown Author'}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">{formData.category}</span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">{formData.condition}</span>
              {formData.isbn && <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">ISBN: {formData.isbn}</span>}
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Price</p>
              <p className="text-3xl font-bold text-booxie-green">${formData.price || '0.00'}</p>
            </div>

            {formData.description && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-900 leading-relaxed">{formData.description}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons - Static at bottom */}
      <div className="p-4 bg-white border-t border-gray-100 flex gap-3 shrink-0">
        {isEditing ? (
          <>
            <button 
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-booxie-green text-white py-3.5 rounded-full font-bold text-sm shadow-md shadow-booxie-green/20 hover:bg-booxie-green-dark transition-colors"
            >
              Save Changes
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => navigate('/sell')}
              className="flex-1 bg-white border border-gray-200 text-gray-700 py-3.5 rounded-full font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
            <button 
              onClick={() => setIsEditing(true)}
              className="flex-1 bg-white border border-gray-200 text-gray-700 py-3.5 rounded-full font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors"
            >
              Adjust
            </button>
            <button 
              onClick={handleSellClick}
              disabled={isSubmitting}
              className="flex-1 bg-booxie-green text-white py-3.5 rounded-full font-bold text-sm shadow-md shadow-booxie-green/20 hover:bg-booxie-green-dark transition-colors disabled:opacity-50"
            >
              Sell
            </button>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Listing</h3>
            <p className="text-gray-600 text-sm mb-6">Are you sure you want to sell this book?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-full font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSell}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-full font-bold text-sm text-white bg-booxie-green hover:bg-booxie-green-dark transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Listing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
