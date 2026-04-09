import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { BookOpen, Search, Heart, Star, ChevronRight, MessageCircle, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  { id: 'printed', label: 'Printed books', icon: '/cat-printed.png' },
  { id: 'english', label: 'English books', icon: '/cat-english.png' },
  { id: 'diploma', label: 'Diploma 9', icon: '/cat-diploma.png' },
  { id: 'exam', label: 'Exam subjects', icon: '/cat-exam.png' },
  { id: 'fiction', label: 'Fiction Book', icon: '/cat-fiction.png' },
];

export default function HomeScreen() {
  const [books, setBooks] = useState<BookListing[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
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
        } catch (error) {
          console.error("Error fetching favorites:", error);
        }
      };
      fetchFavorites();
    }

    let q = query(
      collection(db, 'books'),
      where('status', '==', 'available')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BookListing[];
      
      booksData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setBooks(booksData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'books');
    });

    return () => unsubscribe();
  }, [user]);

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
      <div className="relative mb-8">
        <div className="flex items-center border border-[#006A4E] rounded-full bg-white overflow-hidden p-1 pl-4">
          <Search className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search for textbooks, subjects, or grade levels..." 
            className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-gray-700 placeholder-gray-400"
            onClick={() => navigate('/search')}
          />
          <button className="bg-[#006A4E] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-[#005C44] transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* Book Categories */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Book categories</h3>
          <button onClick={() => navigate('/search')} className="text-[#006A4E] text-sm font-medium">View all</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
          {CATEGORIES.map(cat => (
            <div 
              key={cat.id} 
              onClick={() => navigate('/search')}
              className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full border border-gray-200 bg-white flex items-center justify-center overflow-hidden shadow-sm hover:border-[#006A4E] transition-colors p-2">
                <img src={cat.icon} alt={cat.label} className="w-full h-full object-contain" />
              </div>
              <span className="text-xs text-gray-700 text-center leading-tight">{cat.label}</span>
            </div>
          ))}
          <div 
            onClick={() => navigate('/search')}
            className="flex flex-col items-center justify-center min-w-[40px] cursor-pointer"
          >
            <ChevronRight className="w-6 h-6 text-gray-400 hover:text-[#006A4E] transition-colors" />
          </div>
        </div>
      </div>

      {/* Best-selling books */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Best-selling books</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {displayBooks.map(book => (
            <div 
              key={book.id} 
              onClick={() => navigate(`/book/${book.id}`)}
              className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex flex-col relative"
            >
              <button 
                onClick={(e) => toggleFavorite(e, book.id)}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm"
              >
                <Heart className={`w-4 h-4 ${favorites.includes(book.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
              </button>
              
              <div className="aspect-[3/4] w-full bg-gray-50 rounded-xl mb-3 overflow-hidden shrink-0">
                {book.imageUrl ? (
                  <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
              
              <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2 leading-tight h-10">{book.title}</h4>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-gray-600 border border-gray-300 rounded px-1.5 py-0.5">
                  {book.condition}
                </span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="w-2.5 h-2.5 text-[#FFB800] fill-[#FFB800]" />
                  ))}
                  <span className="text-[10px] text-gray-500 ml-0.5">(5.0)</span>
                </div>
              </div>
              
              <div className="mt-auto flex items-center justify-between mb-3">
                <div className="flex flex-col">
                  <span className="font-bold text-[#006A4E] text-sm leading-tight">
                    {book.price}$
                  </span>
                  <span className="text-[10px] text-red-500 line-through leading-tight">
                    {(book.price * 1.5).toFixed(2)}$
                  </span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart({ ...book, originalPrice: book.price * 1.5 });
                    navigate('/cart');
                  }}
                  className="bg-[#006A4E] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#005C44] transition-colors"
                >
                  Add to cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* News & Promotions */}
      <div className="mb-8">
        <h3 className="font-bold text-gray-900 mb-4">News & Promotions</h3>
        <div 
          onClick={() => navigate('/search')}
          className="w-full h-40 bg-[#E8F5F0] rounded-2xl overflow-hidden relative flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow"
        >
          <img src="/news-awards.png" alt="High School Awards 2026" className="w-full h-full object-cover" />
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
