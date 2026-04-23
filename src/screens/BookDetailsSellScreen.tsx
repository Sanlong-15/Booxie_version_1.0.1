import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { ChevronLeft, ChevronDown, Sparkles, BookOpen, GraduationCap, Microscope, Globe, ScrollText, Library, Languages, Check } from 'lucide-react';
import { addRewardPoints, REWARD_POINTS } from '../lib/rewards';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { isGeminiQuotaError } from '../lib/geminiErrors';

const CATEGORIES = [
  { id: 'Textbook', icon: BookOpen },
  { id: 'Grade 12', icon: GraduationCap },
  { id: 'Grade 9', icon: GraduationCap },
  { id: 'Exam Paper', icon: ScrollText },
  { id: 'Science', icon: Microscope },
  { id: 'Social Study', icon: Globe },
  { id: 'English', icon: Languages },
  { id: 'Novels', icon: Library },
  { id: 'Story', icon: Library }
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Normal'];

export default function BookDetailsSellScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [aiRecommendedCategory, setAiRecommendedCategory] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
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
    condition: 'Good',
    description: '',
    imageUrl: '',
    backCoverUrl: '',
    type: 'sale' // 'sale' or 'donation'
  });

  useEffect(() => {
    if (location.state?.scannedData) {
      const { title, author, description, price, imageUrl, backCoverUrl, type, condition, isbn } = location.state.scannedData;
      setFormData(prev => ({
        ...prev,
        title: title || prev.title,
        author: author || prev.author,
        isbn: isbn || prev.isbn,
        description: description || prev.description,
        price: (price !== undefined && price !== null) ? price.toString() : prev.price,
        imageUrl: imageUrl || prev.imageUrl,
        backCoverUrl: backCoverUrl || prev.backCoverUrl,
        type: type || (price === 0 ? 'donation' : 'sale'),
        condition: condition || 'Good'
      }));

      // Trigger AI Recommendation
      if (title || author) {
        recommendCategory(title || '', author || '', description || '');
      }
    }
  }, [location.state]);

  const recommendCategory = async (title: string, author: string, desc: string) => {
    setIsRecommending(true);
    setQuotaExceeded(false);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Based on this book info: Title: "${title}", Author: "${author}", Description: "${desc}". 
      Select the best category from this list: ${CATEGORIES.map(c => c.id).join(', ')}. 
      Return only the category name. If unsure, return "Textbook".`;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
      });

      const recommendation = response.text?.trim();
      if (recommendation && CATEGORIES.some(c => c.id === recommendation)) {
        setAiRecommendedCategory(recommendation);
        setFormData(prev => ({ ...prev, category: recommendation }));
      }
    } catch (err: any) {
      console.error("AI Recommendation failed:", err);
      // Check for quota exceeded error (429) using shared helper
      if (isGeminiQuotaError(err)) {
        setQuotaExceeded(true);
      }
    } finally {
      setIsRecommending(false);
    }
  };

  const handleSellClick = () => {
    setShowConfirm(true);
  };

  const confirmSell = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const bookData = {
        title: formData.title,
        author: formData.author,
        category: formData.category,
        isbn: formData.isbn,
        description: formData.description,
        price: formData.type === 'donation' ? 0 : Number(formData.price),
        sellerId: auth.currentUser?.uid || 'guest-demo-id',
        sellerName: auth.currentUser?.displayName || 'Alex (Guest)',
        status: 'available',
        condition: formData.condition.toLowerCase().replace(' ', '-'),
        type: formData.type,
        createdAt: serverTimestamp(),
        imageUrl: formData.imageUrl,
        backCoverUrl: formData.backCoverUrl
      };

      // Try to save to Firestore, but proceed even if it fails (for guest demo)
      try {
        await addDoc(collection(db, 'books'), bookData);
        
        // Award points if logged in
        if (auth.currentUser) {
          const pointsToAward = formData.type === 'donation' ? REWARD_POINTS.DONATE : REWARD_POINTS.SELL;
          const rewardType = formData.type === 'donation' ? 'donated' : 'sold';
          await addRewardPoints(auth.currentUser.uid, pointsToAward, rewardType);
        }
      } catch (fsErr) {
        console.warn("Firestore save skipped or failed in guest mode:", fsErr);
      }

      setShowConfirm(false);
      setShowSuccess(true);
    } catch (err) {
      console.error("General error in confirmSell:", err);
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
        <p className="text-gray-500 text-center mb-8">
          Your book has been successfully listed for {formData.type === 'donation' ? 'donation' : 'sale'}.
        </p>
        <div className="w-full space-y-3">
          <button 
            onClick={() => navigate(formData.type === 'donation' ? '/donations' : '/search')}
            className="w-full bg-booxie-green text-white py-4 rounded-full font-bold text-lg shadow-lg shadow-booxie-green/30 hover:bg-booxie-green-dark transition-colors"
          >
            View {formData.type === 'donation' ? 'Donations' : 'Listings'}
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-gray-100 text-gray-700 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-colors"
          >
            Back to Home
          </button>
        </div>
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
          <div className="flex gap-3 overflow-x-auto pb-4 mb-2 hide-scrollbar">
            {formData.imageUrl && (
              <div className="relative shrink-0">
                <img src={formData.imageUrl} alt="Front cover" className="h-40 w-28 object-cover rounded-xl bg-white p-1 shadow-md border border-gray-100" />
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#006A4E] text-white text-[9px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg">FRONT</span>
              </div>
            )}
            {formData.backCoverUrl && (
              <div className="relative shrink-0">
                <img src={formData.backCoverUrl} alt="Back cover" className="h-40 w-28 object-cover rounded-xl bg-white p-1 shadow-md border border-gray-100" />
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#006A4E] text-white text-[9px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg">BACK</span>
              </div>
            )}
            {location.state?.scannedData?.extraImages?.map((url: string, i: number) => (
              <div key={i} className="relative shrink-0">
                <img src={url} alt={`Doc ${i}`} className="h-40 w-28 object-cover rounded-xl bg-white p-1 shadow-md border border-gray-100" />
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-gray-600 text-white text-[9px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg">DOCUMENT</span>
              </div>
            ))}
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
                <label className="block text-xs font-medium text-gray-600 mb-1">ISBN</label>
                <input 
                  type="text" 
                  value={formData.isbn}
                  onChange={e => setFormData({...formData, isbn: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-booxie-green"
                  placeholder="Scan to extract"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-widest">Book Category</label>
                {isRecommending && (
                  <span className="flex items-center gap-1 text-[10px] text-booxie-green animate-pulse font-bold">
                    <Sparkles className="w-3 h-3" /> AI Recommending...
                  </span>
                )}
                {!isRecommending && aiRecommendedCategory && (
                  <span className="flex items-center gap-1 text-[10px] text-booxie-green font-bold">
                    <Sparkles className="w-3 h-3" /> AI Selected
                  </span>
                )}
                {quotaExceeded && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                    <Sparkles className="w-3 h-3" /> Manual Selection Required (AI Quota Hit)
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = formData.category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({...formData, category: cat.id})}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 ${
                        isActive 
                          ? 'border-[#006A4E] bg-[#E8F5F0] text-[#006A4E] shadow-sm' 
                          : 'border-gray-50 bg-white text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1.5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                      <span className={`text-[10px] font-bold text-center leading-tight ${isActive ? 'text-[#006A4E]' : 'text-gray-500'}`}>
                        {cat.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-widest">Condition</label>
                <div className="hidden items-center gap-1 text-[10px] text-gray-400 font-medium sm:flex">
                  <Sparkles className="w-3 h-3" /> Auto-detected by AI
                </div>
              </div>
              <div className="flex gap-2">
                {CONDITIONS.map(cond => (
                  <div
                    key={cond}
                    className={`flex-1 flex items-center justify-center py-3.5 rounded-2xl text-[11px] font-bold transition-all border-2 relative ${
                      formData.condition === cond 
                        ? 'bg-[#006A4E] text-white border-[#006A4E] shadow-lg shadow-[#006A4E]/20' 
                        : 'bg-gray-50 text-gray-600 border-gray-100 cursor-not-allowed'
                    }`}
                  >
                    {cond}
                    {formData.condition === cond && (
                      <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-sm">
                        <Check className="w-3 h-3 text-[#006A4E]" strokeWidth={4} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 italic text-center">Condition is locked and verified by Booxie AI Vision.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Listing Type</label>
              <div className="flex gap-2">
                {['sale', 'donation'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({...formData, type})}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                      formData.type === type 
                        ? 'bg-booxie-green text-white border-booxie-green' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {type === 'sale' ? 'Sell' : 'Donate'}
                  </button>
                ))}
              </div>
            </div>

            {formData.type === 'sale' && (
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
            )}

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
              <p className="text-3xl font-bold text-booxie-green">
                {formData.type === 'donation' ? 'Free' : `$${formData.price || '0.00'}`}
              </p>
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
              {formData.type === 'donation' ? 'Donate' : 'Sell'}
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

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
