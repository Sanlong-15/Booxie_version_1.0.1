import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Search, SlidersHorizontal, Clock, X, BookOpen } from 'lucide-react';
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
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<BookListing[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  // Mock recent searches
  const [recentSearches, setRecentSearches] = useState(['Biology 101', 'Calculus', 'Harry Potter']);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    
    // Add to recent searches
    if (!recentSearches.includes(searchQuery)) {
      setRecentSearches(prev => [searchQuery, ...prev].slice(0, 5));
    }

    try {
      // In a real app, you'd use a full-text search solution like Algolia or Typesense
      // For this demo, we'll fetch all available books and filter client-side
      const q = query(collection(db, 'books'), where('status', '==', 'available'));
      const querySnapshot = await getDocs(q);
      
      const booksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BookListing[];

      const lowerQuery = searchQuery.toLowerCase();
      const filtered = booksData.filter(book => 
        book.title.toLowerCase().includes(lowerQuery) || 
        book.author.toLowerCase().includes(lowerQuery)
      );

      setResults(filtered);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'books');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setHasSearched(false);
    setResults([]);
  };

  return (
    <div className="flex flex-col h-full bg-booxie-bg font-sans">
      <div className="p-6 pb-2 bg-white shadow-sm z-10">
        <form onSubmit={handleSearch} className="relative flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, authors..."
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-10 py-3.5 focus:outline-none focus:ring-2 focus:ring-booxie-green focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <button 
            type="button"
            className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!hasSearched ? (
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Recent Searches</h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchQuery(term);
                    // setTimeout to allow state to update before searching
                    setTimeout(() => handleSearch(), 0);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  {term}
                </button>
              ))}
            </div>
          </div>
        ) : isSearching ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-booxie-green border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
              {results.length} Results Found
            </h3>
            {results.map((book) => (
              <div 
                key={book.id}
                onClick={() => navigate(`/book/${book.id}`)}
                className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="w-20 h-28 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative">
                  {book.imageUrl ? (
                    <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  {book.type === 'donation' && (
                    <div className="absolute top-1 left-1 bg-booxie-green text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                      FREE
                    </div>
                  )}
                </div>
                <div className="flex-1 py-1 flex flex-col">
                  <h4 className="font-bold text-gray-900 line-clamp-2 leading-tight mb-1">{book.title}</h4>
                  <p className="text-sm text-gray-500 mb-2">{book.author}</p>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <span className="font-black text-booxie-green text-lg">
                      {book.type === 'donation' ? '0' : `$${book.price.toFixed(2)}`}
                    </span>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                        {book.condition}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No results found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search terms or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
