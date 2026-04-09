import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Search, ChevronDown, ChevronUp, Heart, ArrowLeft, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const [results, setResults] = useState<BookListing[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch real data on mount
    const fetchInitialData = async () => {
      setIsSearching(true);
      try {
        const q = query(collection(db, 'books'), where('status', '==', 'available'));
        const querySnapshot = await getDocs(q);
        const booksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BookListing[];
        setResults(booksData);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'books');
      } finally {
        setIsSearching(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setIsSearching(true);
    
    try {
      const q = query(collection(db, 'books'), where('status', '==', 'available'));
      const querySnapshot = await getDocs(q);
      
      const booksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BookListing[];

      if (!searchQuery.trim()) {
        setResults(booksData);
      } else {
        const lowerQuery = searchQuery.toLowerCase();
        const filtered = booksData.filter(book => 
          book.title.toLowerCase().includes(lowerQuery) || 
          book.author.toLowerCase().includes(lowerQuery)
        );
        setResults(filtered);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'books');
    } finally {
      setIsSearching(false);
    }
  };

  const filterOptions = {
    Category: ['Textbooks', 'Grade 12', 'Grade 9', 'Exam Paper', 'Science', 'Social Study', 'English', 'Novels'],
    Grade: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'],
    Condition: ['Like new', 'Good', 'Normal'],
    Price: ['0.5-5$', '6-10$', '10$<'],
    Set: ['Set', 'Single']
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
      <div className="px-4 pb-4 relative" ref={dropdownRef}>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {Object.keys(filterOptions).map((filter) => (
            <div key={filter} className="relative">
              <button 
                onClick={() => setActiveDropdown(activeDropdown === filter ? null : filter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-white border ${activeDropdown === filter ? 'border-[#006A4E]' : 'border-gray-200'} rounded-lg text-xs font-medium text-gray-600 whitespace-nowrap shadow-sm transition-colors`}
              >
                {filter}
                {activeDropdown === filter ? (
                  <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
              
              {/* Dropdown Menu */}
              {activeDropdown === filter && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-2 max-h-64 overflow-y-auto">
                  {filterOptions[filter as keyof typeof filterOptions].map((option) => (
                    <button
                      key={option}
                      onClick={() => setActiveDropdown(null)}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

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
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow"
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] bg-gray-100 shrink-0">
                  {book.imageUrl ? (
                    <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-gray-400 text-xs">No image</span>
                    </div>
                  )}
                  <button 
                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Toggle favorite logic here
                    }}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Content */}
                <div className="p-3 flex flex-col flex-1">
                  <h4 className="font-bold text-gray-900 text-sm line-clamp-1 mb-2">{book.title}</h4>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                      {book.condition}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 text-[#FFB800] fill-[#FFB800]" />
                      ))}
                      <span className="text-[8px] text-gray-500 ml-0.5">({(book.rating || 5.0).toFixed(1)})</span>
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex items-end gap-1.5 mb-2">
                      <span className="font-bold text-[#006A4E] text-sm">
                        {book.type === 'donation' ? 'Free' : `${book.price}$`}
                      </span>
                      {book.oldPrice && (
                        <span className="text-[10px] text-red-400 line-through mb-0.5">
                          {book.oldPrice}$
                        </span>
                      )}
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart({ ...book, originalPrice: book.oldPrice || book.price * 1.5 });
                        navigate('/cart');
                      }}
                      className="w-full bg-[#006A4E] text-white text-xs font-medium py-2 rounded-lg hover:bg-[#00523B] transition-colors"
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
