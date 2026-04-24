import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, deleteBook, signInAnonymously } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ArrowLeft, MessageCircle, Star, CheckCircle2, Package, Trash2, Loader2 } from 'lucide-react';
import BooxieLogo from '../components/BooxieLogo';

export default function BookDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { addToCart } = useCart();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

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
    if (!book) return;

    let currentUserId = user?.uid;
    let currentUserName = user?.displayName || profile?.name;
    
    // If guest, upgrade to anonymous auth to allow firestore writes
    if (!currentUserId && !profile?.uid) {
      try {
        const anonymousUser = await signInAnonymously();
        currentUserId = anonymousUser.uid;
        currentUserName = 'Guest Reader';
      } catch (err) {
        console.error("Anonymous sign in failed", err);
        navigate('/login', { state: { message: "Please log in to chat with sellers" } });
        return;
      }
    } else if (!currentUserId && profile?.uid === 'local-guest') {
       // Profile exists but it's a local guest literal, needs real auth
       try {
        const anonymousUser = await signInAnonymously();
        currentUserId = anonymousUser.uid;
        currentUserName = profile.name || 'Guest Reader';
      } catch (err) {
        navigate('/login', { state: { message: "Please log in to chat with sellers" } });
        return;
      }
    }
    
    if (!currentUserId) {
      navigate('/login');
      return;
    }

    try {
      // Look for existing conversation between these two for this book
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUserId)
      );
      const querySnapshot = await getDocs(q);
      
      let existingConvId = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(book.sellerId) && (data.bookId === book.id || data.bookTitle === book.title)) {
          existingConvId = doc.id;
        }
      });

      if (existingConvId) {
        navigate(`/chat/${existingConvId}`);
      } else {
        const convRef = await addDoc(collection(db, 'conversations'), {
          participants: [currentUserId, book.sellerId],
          participantNames: {
            [currentUserId]: currentUserName || 'Guest Reader',
            [book.sellerId]: book.sellerName || 'Seller'
          },
          bookId: book.id || 'id-unknown',
          bookTitle: book.title,
          updatedAt: serverTimestamp(),
          lastMessage: '',
          createdAt: serverTimestamp()
        });
        navigate(`/chat/${convRef.id}`);
      }
    } catch (error) {
      console.error("Chat initiation error:", error);
      // Fallback if firestore write actually fails due to rules
      if (profile?.isDemo) {
        navigate('/chat/demo-conversation');
      } else {
        handleFirestoreError(error, OperationType.CREATE, 'conversations');
      }
    }
  };

  const handleAddToCart = () => {
    if (book) {
      addToCart({ ...book, originalPrice: book.originalPrice || book.price * 1.5 });
      navigate('/cart');
    }
  };

  const handleDelete = async () => {
    if (!book || !id) return;
    if (!window.confirm('Are you sure you want to remove this listing?')) return;
    
    setIsDeleting(true);
    try {
      await deleteBook(id);
      navigate('/profile');
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center font-sans">Loading...</div>;
  }

  if (!book) {
    return <div className="p-8 text-center font-sans">Book not found.</div>;
  }

  return (
    <div className="bg-[#F8FCF9] min-h-screen pb-24 font-sans flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 flex justify-between items-center px-4 py-3 bg-[#F8FCF9]">
        <button 
          onClick={() => navigate('/')}
          className="relative z-50 p-2 -ml-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 truncate max-w-[200px]">{book.title}</h1>
        <div className="flex items-center gap-2">
          {book && user?.uid === book.sellerId && (
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
            >
              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            </button>
          )}
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-[#E8F5F0]">
            <BooxieLogo className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="px-4 pb-6">
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden pb-6">
          {/* Image Section */}
          <div className="w-full bg-[#006A4E] relative flex flex-col items-center justify-center p-4">
            {/* Decorative background shapes */}
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#80B5A6] rounded-tr-full opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#80B5A6] rounded-tl-full opacity-50"></div>
            
            <div className="flex gap-4 overflow-x-auto w-full snap-x snap-mandatory hide-scrollbar py-4 relative z-10">
              <div className="min-w-full flex justify-center snap-center">
                <div className="relative group">
                  <img src={book.imageUrl} alt="Front cover" className="h-[300px] w-auto object-contain rounded-xl shadow-2xl border-4 border-white/10" />
                  <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Front Cover</div>
                </div>
              </div>
              {book.backCoverUrl && (
                <div className="min-w-full flex justify-center snap-center">
                  <div className="relative group">
                    <img src={book.backCoverUrl} alt="Back cover" className="h-[300px] w-auto object-contain rounded-xl shadow-2xl border-4 border-white/10" />
                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Back Cover</div>
                  </div>
                </div>
              )}
            </div>

            {book.backCoverUrl && (
              <div className="flex gap-1.5 mt-2 relative z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-white opacity-100"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40"></div>
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="p-5">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{book.title}</h2>
            
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm border ${
                book.condition?.toLowerCase().replace('-', ' ') === 'new' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  : book.condition?.toLowerCase().replace('-', ' ') === 'like new'
                  ? 'bg-blue-50 text-blue-600 border-blue-100'
                  : book.condition?.toLowerCase().replace('-', ' ') === 'good'
                  ? 'bg-amber-50 text-amber-600 border-amber-100'
                  : 'bg-gray-50 text-gray-600 border-gray-100'
              }`}>
                {book.condition || 'Good'}
              </span>
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const cond = book.condition?.toLowerCase().replace('-', ' ') || 'good';
                    const rating = cond === 'new' ? 5 : cond === 'like new' ? 4.8 : cond === 'good' ? 4.5 : 4;
                    const fill = star <= Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : star === Math.ceil(rating) && rating % 1 !== 0 ? 'fill-yellow-400/50 text-yellow-400' : 'text-gray-200';
                    return <Star key={star} className={`w-3.5 h-3.5 ${fill}`} />;
                  })}
                </div>
                <span className="text-xs text-gray-500 font-bold">
                  ({(book.condition?.toLowerCase().replace('-', ' ') === 'new' ? 5.0 : book.condition?.toLowerCase().replace('-', ' ') === 'like new' ? 4.8 : book.condition?.toLowerCase().replace('-', ' ') === 'good' ? 4.5 : 4.0).toFixed(1)})
                </span>
              </div>
            </div>

            <div className="flex items-end gap-2 mb-4">
              <span className="text-xl font-bold text-red-500">
                {book.type === 'donation' ? 'Free' : `${book.price}$`}
              </span>
              {book.originalPrice && (
                <span className="text-sm text-gray-400 line-through mb-0.5">{book.originalPrice}$</span>
              )}
            </div>
            
            <div className="w-full h-px bg-gray-200 mb-4"></div>

            {/* Reward Section */}
            <div className="border border-[#006A4E] rounded-xl p-4 flex justify-between items-center mb-6">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Earn points from this purchase</p>
                <p className="text-sm text-blue-500">10 reward points</p>
              </div>
              <div className="w-10 h-10">
                <img src="https://cdn-icons-png.flaticon.com/512/4213/4213625.png" alt="Gift" className="w-full h-full object-contain" />
              </div>
            </div>

            <div className="w-full h-px bg-gray-200 mb-6"></div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {book.description || 'Covers advanced topics such as limits, sequences, integrals, probability, vectors in space, and differential equations.'}
              </p>
            </div>

            <div className="w-full h-px bg-gray-200 mb-6"></div>

            {/* Seller Info */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Seller information</h3>
              <div 
                onClick={() => navigate('/profile')}
                className="bg-[#E3F2FD] rounded-xl p-4 relative cursor-pointer hover:bg-[#D0E8FC] transition-colors"
              >
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-sm font-medium text-gray-700">{book.sellerName || 'Sara Chen'}</p>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center gap-1 mb-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-500">(4.5)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <Package className="w-4 h-4 text-[#8D6E63]" />
                  <span>Delivery with J&T Express (discounted rate)</span>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContactSeller();
                  }}
                  className="absolute top-4 right-4 bg-[#006A4E] text-white text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-[#005A42] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Chat
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-8">
              <button 
                onClick={handleAddToCart}
                className="flex-1 min-w-[120px] bg-gray-100 text-gray-900 rounded-full font-bold text-sm py-3.5 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                Add to cart
              </button>

              <button 
                onClick={handleContactSeller}
                className="flex-1 min-w-[120px] bg-blue-50 text-blue-600 border border-blue-200 rounded-full font-bold text-sm py-3.5 flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
