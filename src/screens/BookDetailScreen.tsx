import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, BookOpen, MessageCircle, User, Heart, ShoppingCart } from 'lucide-react';

export default function BookDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchBook = async () => {
      try {
        const docRef = doc(db, 'books', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBook({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `books/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  const handleContactSeller = async () => {
    if (!user || !book) return;

    try {
      // Check if conversation already exists
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.uid)
      );
      const querySnapshot = await getDocs(q);
      
      let existingConvId = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(book.sellerId) && data.bookId === book.id) {
          existingConvId = doc.id;
        }
      });

      if (existingConvId) {
        navigate(`/chat/${existingConvId}`);
      } else {
        // Create new conversation
        const convRef = await addDoc(collection(db, 'conversations'), {
          participants: [user.uid, book.sellerId],
          bookId: book.id,
          bookTitle: book.title,
          updatedAt: serverTimestamp(),
          lastMessage: ''
        });
        navigate(`/chat/${convRef.id}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'conversations');
    }
  };

  const handleAddToCart = () => {
    // In a real app, this would add to a cart context or database
    navigate('/cart');
  };

  if (loading) {
    return <div className="p-8 text-center font-sans">Loading...</div>;
  }

  if (!book) {
    return <div className="p-8 text-center font-sans">Book not found.</div>;
  }

  return (
    <div className="bg-booxie-bg min-h-full pb-24 font-sans">
      <div className="relative aspect-square bg-gray-100">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm z-10"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        
        <button 
          onClick={() => setIsSaved(!isSaved)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm z-10"
        >
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-900'}`} />
        </button>
        
        {book.imageUrl ? (
          <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-24 h-24 text-gray-300" />
          </div>
        )}
        
        {book.type === 'donation' && (
          <div className="absolute bottom-6 left-4 bg-booxie-green text-white font-bold px-4 py-1.5 rounded-full shadow-lg">
            FREE DONATION
          </div>
        )}
      </div>

      <div className="p-6 -mt-6 bg-white rounded-t-3xl relative z-10 shadow-[0_-8px_10px_-5px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{book.title}</h1>
          <span className="text-2xl font-black text-booxie-green ml-4">
            {book.type === 'donation' ? '0' : `$${book.price.toFixed(2)}`}
          </span>
        </div>
        
        <p className="text-gray-500 font-medium mb-6">{book.author}</p>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 bg-gray-50 p-3 rounded-2xl text-center border border-gray-100">
            <span className="block text-xs text-gray-400 uppercase font-bold mb-1">Condition</span>
            <span className="font-medium text-gray-900 capitalize">{book.condition}</span>
          </div>
          <div className="flex-1 bg-gray-50 p-3 rounded-2xl text-center border border-gray-100">
            <span className="block text-xs text-gray-400 uppercase font-bold mb-1">Type</span>
            <span className="font-medium text-gray-900 capitalize">{book.type}</span>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-bold text-gray-900 mb-2">Description</h3>
          <p className="text-gray-600 leading-relaxed text-sm">
            {book.description || 'No description provided.'}
          </p>
        </div>

        <div className="flex items-center gap-4 p-4 bg-booxie-green-light rounded-2xl mb-8">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
            <User className="w-6 h-6 text-booxie-green" />
          </div>
          <div>
            <p className="text-xs text-booxie-green font-bold uppercase">Seller</p>
            <p className="font-medium text-gray-900">{book.sellerName}</p>
          </div>
        </div>

        {user?.uid !== book.sellerId && (
          <div className="flex gap-3">
            {book.type !== 'donation' && (
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-booxie-green text-white py-4 rounded-xl font-bold shadow-lg shadow-booxie-green/30 hover:bg-booxie-green-dark transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
            )}
            <button 
              onClick={handleContactSeller}
              className={`${book.type === 'donation' ? 'flex-1 bg-booxie-green text-white shadow-lg shadow-booxie-green/30' : 'flex-1 bg-white text-booxie-green border-2 border-booxie-green'} py-4 rounded-xl font-bold hover:bg-booxie-green-light transition-colors flex items-center justify-center gap-2`}
            >
              <MessageCircle className="w-5 h-5" />
              Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
