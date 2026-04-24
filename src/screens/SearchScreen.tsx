import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Search, ChevronDown, Heart, ArrowLeft, Star, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import BooxieLogo from '../components/BooxieLogo';
import { useCart } from '../context/CartContext';

interface BookListing {
  id: string;
  title: string;
  author: string;
  price: number;
  oldPrice?: number;
  imageUrl?: string;
  condition: string;
  type: string;
  sellerName: string;
  rating?: number;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allBooks, setAllBooks] = useState<BookListing[]>([]);
  const [results, setResults] = useState<BookListing[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const getRatingInfo = (condition: string) => {
    const cond = condition.toLowerCase().replace('-', ' ');
    if (cond === 'new') return { stars: 5, rating: 5.0 };
    if (cond === 'like new') return { stars: 5, rating: 4.8 };
    if (cond === 'good') return { stars: 5, rating: 4.5 };
    if (cond === 'normal' || cond === 'used') return { stars: 4, rating: 4.0 };
    return { stars: 5, rating: 4.5 };
  };

  useEffect(() => {
    // Fetch all available books initially
    const fetchAllData = async () => {
      setIsSearching(true);
      try {
        const q = query(collection(db, 'books'), where('status', '==', 'available'));
        const querySnapshot = await getDocs(q);
        const booksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BookListing[];
        setAllBooks(booksData);
        setResults(booksData);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'books');
      } finally {
        setIsSearching(false);
      }
    };
    fetchAllData();
  }, []);

  useEffect(() => {
    // Client-side filtering logic
    let filtered = [...allBooks];

    // Search Query Filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(lowerQuery) || 
        book.author.toLowerCase().includes(lowerQuery)
      );
    }

    // Dropdown Filters
    Object.entries(selectedFilters).forEach(([filter, val]) => {
      if (filter === 'Category') {
        if (val === 'Donation') {
          filtered = filtered.filter(b => b.type === 'donation');
        } else {
          filtered = filtered.filter((b: any) => 
            (b.category === val) || 
            (val === 'Textbooks' && b.category === 'Textbook')
          );
        }
      } else if (filter === 'Grade') {
        filtered = filtered.filter((b: any) => b.grade === val);
      } else if (filter === 'Condition') {
        const target = val.toLowerCase().replace('-', ' ');
        filtered = filtered.filter(b => b.condition?.toLowerCase().replace('-', ' ') === target);
      } else if (filter === 'Price') {
        if (val === '0.5-5$') {
          filtered = filtered.filter(b => {
             const p = (b as any).price;
             return p >= 0.5 && p <= 5;
          });
        } else if (val === '6-10$') {
          filtered = filtered.filter(b => {
             const p = (b as any).price;
             return p >= 6 && p <= 10;
          });
        } else if (val === '10$<') {
          filtered = filtered.filter(b => {
             const p = (b as any).price;
             return p > 10;
          });
        }
      } else if (filter === 'Set') {
        filtered = filtered.filter((b: any) => 
          val === 'Set' ? b.isSet === true : (b.isSet === false || !b.isSet)
        );
      }
    });

    setResults(filtered);
  }, [selectedFilters, searchQuery, allBooks]);

  const bookPrice = (book: any) => {
    return book.price || 0;
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Re-filtering is already handled by the useEffect watching searchQuery
  };

  const filterOptions = {
    Category: ['Donation', 'Textbooks', 'Grade 12', 'Grade 9', 'Exam Paper', 'Science', 'Social Study', 'English', 'Novels'],
    Grade: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'],
    Condition: ['New', 'Like new', 'Good', 'Normal'],
    Price: ['0.5-5$', '6-10$', '10$<'],
    Set: ['Set', 'Single']
  };

  const handleFilterSelect = (filter: string, option: string) => {
    setActiveDropdown(null);
    
    // Toggle filter: if same option selected again, clear it
    const newFilters = { ...selectedFilters };
    if (newFilters[filter] === option) {
      delete newFilters[filter];
    } else {
      newFilters[filter] = option;
    }
    setSelectedFilters(newFilters);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FCF9] font-sans">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between bg-[#F8FCF9] z-10">
        <button onClick={() => navigate('/')} className="relative z-50 p-2 -ml-2 text-gray-800">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-bold text-gray-900">Book Categories</h1>
          <span className="text-xs text-gray-500">Find books by category and grade.</span>
        </div>
        <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
          <BooxieLogo className="w-12 h-12" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-3">
        <form onSubmit={handleSearch} className="relative flex items-center w-full border-[1.5px] border-[#006A4E] rounded-full bg-white overflow-hidden shadow-sm">
          <div className="pl-4 pr-2 text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for textbooks, subjects, or grade levels..."
            className="flex-1 py-3 text-xs focus:outline-none bg-transparent placeholder:text-gray-400"
          />
          <div className="pr-1.5">
            <button 
              type="submit"
              className="bg-[#006A4E] text-white text-xs font-medium px-5 py-2 rounded-full hover:bg-[#00523B] transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {Object.keys(filterOptions).map((filter) => {
            const isSelected = !!selectedFilters[filter];
            return (
              <button 
                key={filter}
                onClick={() => setActiveDropdown(filter)}
                className={`flex items-center gap-1.5 px-4 py-2 bg-white border ${
                  isSelected ? 'border-[#006A4E] bg-[#E8F5F0] text-[#006A4E]' : 'border-gray-100 text-gray-500'
                } rounded-full text-[11px] font-bold whitespace-nowrap shadow-sm transition-all duration-300 active:scale-95`}
              >
                {isSelected ? selectedFilters[filter] : filter}
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${activeDropdown === filter ? 'rotate-180' : ''}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Modern Filter Overlay */}
      <AnimatePresence>
        {activeDropdown && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveDropdown(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[40px] px-6 pt-10 pb-12 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-200 rounded-full" />
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Select {activeDropdown}</h3>
                  <p className="text-xs text-gray-400 mt-1">Refine your book search</p>
                </div>
                <button 
                  onClick={() => setActiveDropdown(null)}
                  className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto no-scrollbar pb-6 capitalize">
                {filterOptions[activeDropdown as keyof typeof filterOptions].map((option) => {
                  const isActive = selectedFilters[activeDropdown!] === option;
                  return (
                    <motion.button
                      key={option}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleFilterSelect(activeDropdown!, option)}
                      className={`flex items-center justify-between px-4 py-4 rounded-2xl border-2 transition-all text-sm font-bold ${
                        isActive 
                          ? 'border-[#006A4E] bg-[#E8F5F0] text-[#006A4E]' 
                          : 'border-gray-50 bg-gray-50 text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <span>{option}</span>
                      {isActive && <Check className="w-4 h-4" />}
                    </motion.button>
                  );
                })}
              </div>
              
              <button 
                onClick={() => setActiveDropdown(null)}
                className="w-full mt-6 bg-[#006A4E] text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-[#006A4E]/20 active:scale-95 transition-all"
              >
                Apply Selection
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Book Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {isSearching ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#006A4E] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {results.map((book) => (
              <div 
                key={book.id}
                onClick={() => navigate(`/book/${book.id}`)}
                className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow group"
              >
                {/* Image Container */}
                <div className="relative aspect-square bg-[#F3F4F6] shrink-0 p-2">
                  {book.imageUrl ? (
                    <img src={book.imageUrl} alt={book.title} className="w-full h-full object-contain rounded-xl" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-gray-400 text-xs">No image</span>
                    </div>
                  )}
                  <button 
                    className="absolute top-3 right-3 p-1.5 bg-white rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Content */}
                <div className="p-3 flex flex-col flex-1">
                  <h4 className="font-bold text-gray-900 text-sm line-clamp-1 mb-2 leading-tight">{book.title}</h4>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-medium text-gray-600 bg-white border border-gray-200 px-2.5 py-0.5 rounded-md shadow-sm">
                      {book.condition || 'Good'}
                    </span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((starIdx) => (
                          <Star 
                            key={starIdx} 
                            className={`w-2.5 h-2.5 ${starIdx <= Math.ceil(getRatingInfo(book.condition).rating) ? 'text-[#FFB800] fill-[#FFB800]' : 'text-gray-200'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-[8px] text-gray-500 ml-0.5">({getRatingInfo(book.condition).rating.toFixed(1)})</span>
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex items-end gap-1.5 mb-3">
                      <span className="font-bold text-[#006A4E] text-base">
                        {book.type === 'donation' ? 'Free' : `${book.price}$`}
                      </span>
                      {book.oldPrice ? (
                        <span className="text-[10px] text-red-400 line-through mb-1">
                          {book.oldPrice}$
                        </span>
                      ) : (
                        <span className="text-[10px] text-red-400 line-through mb-1">
                          {(book.price * 1.5).toFixed(1)}$
                        </span>
                      )}
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart({ ...book, originalPrice: book.oldPrice || book.price * 1.5 });
                        navigate('/cart');
                      }}
                      className="w-full bg-[#006A4E] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#00523B] transition-colors shadow-sm active:scale-95 duration-200"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
