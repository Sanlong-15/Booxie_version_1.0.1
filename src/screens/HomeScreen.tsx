import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where, doc, getDoc, setDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { BookOpen, Search, Heart, Star, ChevronRight, MessageCircle, Loader2, Filter, X, Camera, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface BookListing {
  id: string;
  title: string;
  author: string;
  price: number;
  imageUrl?: string;
  condition: string;
  type: string;
  sellerName: string;
  sellerId: string;
  createdAt?: any;
}

const CATEGORIES = [
  { id: 'All', label: 'All', icon: 'https://cdn-icons-png.flaticon.com/512/1048/1048927.png' },
  { id: 'Textbook', label: 'Textbooks', icon: 'https://lh3.googleusercontent.com/d/1gBac4HB_fvzjXfK9d7hW0baFjuqbSz9u' },
  { id: 'English', label: 'English', icon: 'https://lh3.googleusercontent.com/d/1AmUQyGxG0RePF4kwfeqvPJOt2EOeFi5S' },
  { id: 'Science', label: 'Science', icon: 'https://lh3.googleusercontent.com/d/1J4KjM6YwRr0RDuazZ6Qyirp37ZQ9hVIl' },
  { id: 'Novels', label: 'Novels', icon: 'https://lh3.googleusercontent.com/d/1bPAh10cr4W4jNkilGR_yKNCnFuifT_4B' },
  { id: 'Grade 12', label: 'Grade 12', icon: 'https://lh3.googleusercontent.com/d/18Aj2zUXaHnZeWcZomnLlWqSo_wq3GslT' },
];

export default function HomeScreen() {
  const [books, setBooks] = useState<BookListing[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Fetch favorites
      const fetchFavorites = async () => {
        try {
          const favRef = doc(db, 'users', user.uid);
          const favSnap = await getDoc(favRef);
          if (favSnap.exists() && favSnap.data().favorites) {
            setFavorites(favSnap.data().favorites);
          }
        } catch (error: any) {
          console.warn("Error fetching favorites (quota?):", error.message);
          // Register but don't crash
          try { handleFirestoreError(error, OperationType.GET, `users/${user.uid}`); } catch(e) {}
        }
      };
      fetchFavorites();
    }

    let q = query(
      collection(db, 'books'),
      where('status', '==', 'available'),
      ...(selectedGenre !== 'All' ? [where('category', '==', selectedGenre)] : []),
      limit(20) // Get more items then sort
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let booksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BookListing[];
      
      // Sort in memory to avoid needing composite indexes
      booksData.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

    setBooks(booksData.slice(0, 6)); // Show a subset after sorting (3 rows of 2)
    }, (error: any) => {
      console.warn("HomeScreen: Firestore status listener error", error.message);
      // Suppress the big JSON throw for quota errors in listeners to avoid UI noise
      if (error.message.toLowerCase().includes('quota') || error.message.toLowerCase().includes('limit exceeded')) {
        try { handleFirestoreError(error, OperationType.LIST, 'books'); } catch (e) {}
        return;
      }
      handleFirestoreError(error, OperationType.LIST, 'books');
    });

    return () => unsubscribe();
  }, [user, selectedGenre]);

  const getRatingInfo = (condition: string) => {
    const cond = condition.toLowerCase().replace('-', ' ');
    if (cond === 'new') return { stars: 5, rating: 5.0 };
    if (cond === 'like new') return { stars: 5, rating: 4.8 };
    if (cond === 'good') return { stars: 5, rating: 4.5 };
    if (cond === 'normal' || cond === 'used') return { stars: 4, rating: 4.0 };
    return { stars: 5, rating: 4.5 };
  };

  const toggleFavorite = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    if (!user) return;

    const newFavorites = favorites.includes(bookId)
      ? favorites.filter(id => id !== bookId)
      : [...favorites, bookId];

    setFavorites(newFavorites);

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { favorites: newFavorites }, { merge: true });
    } catch (error) {
      console.error("Error updating favorites:", error);
      // Revert on error
      setFavorites(favorites);
    }
  };

  // Use some mock books if empty to show the design
  const displayBooks = books.length > 0 ? books : [
    { id: '1', title: 'International Advance Mathematics', author: 'Author 1', price: 1.125, condition: 'good', type: 'sale', sellerName: 'Seller 1', sellerId: '1', imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=300&h=400' },
    { id: '2', title: 'Book set 12', author: 'Author 2', price: 6.25, condition: 'good', type: 'sale', sellerName: 'Seller 2', sellerId: '2', imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=300&h=400' },
    { id: '3', title: 'Khmer Literature', author: 'Author 3', price: 1.00, condition: 'Intermediate', type: 'sale', sellerName: 'Seller 3', sellerId: '3', imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=300&h=400' },
    { id: '4', title: 'TOEFL Practice', author: 'Author 4', price: 2.00, condition: 'Intermediate', type: 'sale', sellerName: 'Seller 4', sellerId: '4', imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300&h=400' },
  ];

  return (
    <div className="p-4 font-sans bg-[#F8FCF9] min-h-full pb-24 relative">
      {/* Hero Section */}
      <div className="text-center mb-6 mt-2">
        <h2 className="text-lg font-bold text-[#006A4E] mb-1">Buy, sell and donate books</h2>
        <p className="text-xs text-gray-500 px-4 leading-relaxed">
          Cambodia's first platform for sustainable learning.<br/>
          Save money, reduce waste, and support students
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="flex items-center border border-[#006A4E] rounded-full bg-white overflow-hidden p-1 shadow-sm">
          <div className="flex-1 flex items-center pl-4">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Search for textbooks..." 
              className="flex-1 bg-transparent border-none outline-none px-2 text-sm text-gray-700 placeholder-gray-400 min-w-0"
              onClick={() => navigate('/search')}
            />
          </div>
          <div className="flex items-center gap-1 pr-1">
            <button className="bg-[#006A4E] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#005C44] transition-colors shrink-0">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Book Categories Filter */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Top Categories</h3>
          <button onClick={() => navigate('/search')} className="text-[#006A4E] text-sm font-medium">View all</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 scroll-smooth">
          {CATEGORIES.map(cat => (
            <div 
              key={cat.id} 
              onClick={() => setSelectedGenre(cat.id)}
              className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer shrink-0 transition-transform active:scale-95"
            >
              <div className={`w-16 h-16 rounded-full border flex items-center justify-center overflow-hidden shadow-sm transition-all p-2 ${
                selectedGenre === cat.id ? 'border-booxie-green bg-booxie-green/5 ring-4 ring-booxie-green/10' : 'border-gray-200 bg-white hover:border-[#006A4E]'
              }`}>
                <img src={cat.icon} alt={cat.label} className="w-full h-full object-contain" />
              </div>
              <span className={`text-[11px] text-center leading-tight font-medium ${
                selectedGenre === cat.id ? 'text-booxie-green font-bold' : 'text-gray-700'
              }`}>{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Best-selling books */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">
            {selectedGenre === 'All' ? 'Best-selling books' : `${selectedGenre} Picks`}
          </h3>
          <button onClick={() => navigate('/search')} className="text-[#006A4E] text-sm font-medium">View all</button>
        </div>
        
        {books.length === 0 && selectedGenre !== 'All' ? (
          <div className="bg-white rounded-3xl p-8 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
              <Filter className="w-6 h-6 text-gray-300" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No books found</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-[200px]">We couldn't find any books in {selectedGenre} right now.</p>
            <button 
              onClick={() => setSelectedGenre('All')}
              className="mt-4 text-booxie-green text-xs font-bold underline"
            >
              Show all books
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence>
              {displayBooks.map((book, idx) => {
                const { rating } = getRatingInfo(book.condition);
                return (
                  <motion.div 
                    key={book.id} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => navigate(`/book/${book.id}`)}
                    className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-all group"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-square bg-[#F3F4F6] shrink-0 p-2">
                      {book.imageUrl ? (
                        <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                      <button 
                        onClick={(e) => toggleFavorite(e, book.id)}
                        className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm"
                      >
                        <Heart className={`w-4 h-4 ${favorites.includes(book.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                      </button>
                    </div>
                    
                    <div className="p-3 flex flex-col flex-1">
                      <h4 className="font-bold text-gray-900 text-[13px] line-clamp-1 mb-2 leading-tight">{book.title}</h4>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-medium text-gray-600 bg-white border border-gray-200 px-2.5 py-0.5 rounded-md shadow-sm capitalize">
                          {book.condition}
                        </span>
                        <div className="flex items-center gap-0.5 ml-auto">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((starIdx) => (
                              <Star 
                                key={starIdx} 
                                className={`w-2.5 h-2.5 ${starIdx <= Math.ceil(rating) ? 'text-[#FFB800] fill-[#FFB800]' : 'text-gray-200'}`} 
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-gray-500 font-bold ml-0.5">({rating.toFixed(1)})</span>
                        </div>
                      </div>
                      
                      <div className="mt-auto">
                        <div className="flex items-end gap-1.5 mb-3">
                          <span className="font-bold text-[#006A4E] text-base">
                            {book.price}$
                          </span>
                          <span className="text-[10px] text-red-400 line-through mb-0.5">
                            {(book.price * 1.5).toFixed(1)}$
                          </span>
                        </div>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart({ ...book, originalPrice: book.price * 1.5 });
                            navigate('/cart');
                          }}
                          className="w-full bg-[#006A4E] text-white text-[11px] font-bold py-2.5 rounded-xl hover:bg-[#005C44] transition-colors shadow-sm active:scale-95 duration-200"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Donation Books Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Donation books</h3>
          <button onClick={() => navigate('/donations')} className="text-[#006A4E] text-sm font-medium">View all</button>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8F5F0] flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/donations')}>
          <div className="w-16 h-16 bg-[#006A4E] rounded-xl flex items-center justify-center shrink-0">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-sm">Free Books for Students</h4>
            <p className="text-xs text-gray-500 mt-1">Browse books donated by the community to support your studies.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* News & Promotions */}
      <div className="mb-8">
        <h3 className="font-bold text-gray-900 mb-4">News & Promotions</h3>
        <div 
          onClick={() => navigate('/search')}
          className="w-full bg-[#E8F5F0] rounded-2xl overflow-hidden relative flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow"
        >
          <img src="https://lh3.googleusercontent.com/d/1z5VOQKth40YJQBb_GYVceG3mIt034e31" alt="High School Awards 2026" className="w-full h-auto object-contain" referrerPolicy="no-referrer" />
          {/* Pagination dots */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            <div className="w-4 h-1.5 bg-white rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <div className="fixed bottom-28 left-0 right-0 max-w-md mx-auto pointer-events-none z-30">
        <button 
          onClick={() => navigate('/gemini')}
          className="absolute right-4 w-14 h-14 bg-[#006A4E] rounded-full shadow-lg flex items-center justify-center text-white hover:bg-[#005C44] transition-colors pointer-events-auto"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-[#006A4E]"></span>
        </button>
      </div>
    </div>
  );
}
