import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { GoogleGenAI, Type } from '@google/genai';
import { Camera, Upload, Loader2, Sparkles } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function SellScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    price: '',
    condition: 'good',
    type: 'sale'
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      await scanBookWithAI(base64String, file.type);
    };
    reader.readAsDataURL(file);
  };

  const scanBookWithAI = async (base64Data: string, mimeType: string) => {
    setIsScanning(true);
    setError('');
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            { text: 'Analyze this image of a book cover, receipt, or invoice. Extract the book title, author, and a brief description. If it is a receipt/invoice, extract the price too. Return as JSON.' },
            { inlineData: { data: base64Data, mimeType } }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              description: { type: Type.STRING },
              price: { type: Type.NUMBER }
            },
            required: ['title', 'author']
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        author: data.author || prev.author,
        description: data.description || prev.description,
        price: data.price ? data.price.toString() : prev.price
      }));
    } catch (err) {
      console.error(err);
      setError('Failed to scan book. Please enter details manually.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      const bookData = {
        title: formData.title,
        author: formData.author,
        description: formData.description,
        price: formData.type === 'donation' ? 0 : Number(formData.price),
        sellerId: auth.currentUser.uid,
        sellerName: auth.currentUser.displayName || 'Anonymous',
        status: 'available',
        condition: formData.condition,
        type: formData.type,
        createdAt: serverTimestamp(),
        // In a real app, we'd upload the image to Firebase Storage and get the URL
        imageUrl: previewUrl || '' 
      };

      await addDoc(collection(db, 'books'), bookData);
      navigate('/');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'books');
      setError('Failed to list book.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 pb-24 bg-booxie-bg min-h-full font-sans">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">List a Book</h2>
        <p className="text-gray-500 text-sm">Sell or donate your used books easily.</p>
      </div>

      {/* AI Scanner Section */}
      <div className="mb-8">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed border-booxie-green/30 rounded-2xl bg-booxie-green-light flex flex-col items-center justify-center cursor-pointer hover:bg-booxie-green/10 transition-colors relative overflow-hidden shadow-sm"
        >
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-booxie-green-dark font-medium">
                {isScanning ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span>AI is scanning...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-8 h-8 mb-2 text-booxie-green" />
                    <span>Tap to scan another</span>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 text-booxie-green shadow-sm">
                <Sparkles className="w-7 h-7" />
              </div>
              <span className="text-booxie-green font-bold text-lg">Scan Cover with AI</span>
              <span className="text-booxie-green/70 text-sm mt-1">Auto-fill details instantly</span>
            </>
          )}
        </div>
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex bg-gray-100 p-1 rounded-xl mb-2">
          <button
            type="button"
            onClick={() => setFormData({...formData, type: 'sale'})}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${formData.type === 'sale' ? 'bg-white shadow-sm text-booxie-green' : 'text-gray-500'}`}
          >
            For Sale
          </button>
          <button
            type="button"
            onClick={() => setFormData({...formData, type: 'donation'})}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${formData.type === 'donation' ? 'bg-white shadow-sm text-booxie-green' : 'text-gray-500'}`}
          >
            Donation
          </button>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Title</label>
          <input 
            required
            type="text" 
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-booxie-green shadow-sm"
            placeholder="e.g., The Great Gatsby"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Author</label>
          <input 
            required
            type="text" 
            value={formData.author}
            onChange={e => setFormData({...formData, author: e.target.value})}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-booxie-green shadow-sm"
            placeholder="e.g., F. Scott Fitzgerald"
          />
        </div>

        <div className="flex gap-4">
          {formData.type === 'sale' && (
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Price ($)</label>
              <input 
                required
                type="number" 
                step="0.01"
                min="0"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-booxie-green shadow-sm"
                placeholder="0.00"
              />
            </div>
          )}

          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Condition</label>
            <select 
              value={formData.condition}
              onChange={e => setFormData({...formData, condition: e.target.value})}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-booxie-green shadow-sm"
            >
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Description</label>
          <textarea 
            rows={3}
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-booxie-green shadow-sm"
            placeholder="Add any details about the book's condition or edition..."
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || isScanning}
          className="w-full bg-booxie-green text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-booxie-green/30 hover:bg-booxie-green-dark transition-colors disabled:opacity-50 mt-8"
        >
          {isSubmitting ? 'Listing...' : 'List Book'}
        </button>
      </form>
    </div>
  );
}
