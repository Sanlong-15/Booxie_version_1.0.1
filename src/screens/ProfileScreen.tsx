import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logOut, db, deleteBook, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Settings, LogOut, Package, Heart, Star, Award, MessageCircle, Trash2, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ORDER_TABS = ['Orders', 'Listing', 'Coupon'];

export default function ProfileScreen() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Orders');
  const [userBooks, setUserBooks] = useState<any[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'Listing' && user) {
      fetchUserBooks();
    }
  }, [activeTab, user]);

  const fetchUserBooks = async () => {
    if (!user) return;
    setIsLoadingBooks(true);
    try {
      // Simplified query to avoid requiring composite indexes in dev environment
      const q = query(
        collection(db, 'books'),
        where('sellerId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      let books = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in memory instead of Firestore to avoid composite index requirements
      books.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setUserBooks(books);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'books');
    } finally {
      setIsLoadingBooks(false);
    }
  };

  const handleCleanUp = async () => {
    if (userBooks.length === 0) return;
    if (!window.confirm(`Clean up oldest 4 books to free up data space?`)) return;
    
    setIsLoadingBooks(true);
    const booksToDelete = [...userBooks].reverse().slice(0, 4);
    
    for (const book of booksToDelete) {
      try {
        await deleteBook(book.id);
      } catch (err) {
        console.error("Cleanup individual delete failed", err);
      }
    }
    
    await fetchUserBooks();
  };

  const handleDeleteBook = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this listing?')) return;
    
    setIsDeleting(bookId);
    try {
      await deleteBook(bookId);
      setUserBooks(prev => prev.filter(b => b.id !== bookId));
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      localStorage.removeItem('guestMode');
      navigate('/welcome');
    } catch (error) {
      console.error("Logout failed", error);
      // Even if firebase logout fails, clear local state and go to welcome
      localStorage.removeItem('guestMode');
      navigate('/welcome');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FCF9] font-sans">
      {/* Header */}
      <div className="px-4 pt-2 pb-4 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account</p>
        </div>
        <button 
          onClick={() => navigate('/settings')}
          className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-24">
        {/* Main Profile Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          {/* User Info */}
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate('/edit-profile')}
              className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#006A4E] shrink-0"
            >
              {profile?.photoURL || user?.photoURL ? (
                <img src={profile?.photoURL || user?.photoURL || ''} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-[#006A4E] flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : (user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'G')}
                </div>
              )}
            </button>
            <div>
              <h2 className="text-base font-bold text-gray-900">{profile?.name || user?.displayName || 'Guest User'}</h2>
              <p className="text-xs text-gray-500">{profile?.email || user?.email || 'Guest Account'}</p>
              {profile?.phone && <p className="text-xs text-gray-500 mb-2">{profile.phone}</p>}
              <button 
                onClick={() => navigate('/membership')}
                className="px-3 py-1 bg-[#006A4E] text-white text-[10px] font-bold rounded-md"
              >
                Membership
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-gray-200 mb-4"></div>

          {/* Admin Access Button (Only visible to admins) */}
          {(profile?.role === 'admin' || user?.email === 'sh6025010078@camtech.edu.kh') && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-between p-3 mb-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Settings className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-sm font-bold text-gray-900">Admin Dashboard</span>
              </div>
              <span className="text-xs text-gray-500">Manage Platform</span>
            </button>
          )}

          {/* Saving Points Card */}
          <div className="border border-[#006A4E] rounded-xl p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#006A4E] rounded-full flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Saving Points</h3>
                  <p className="text-[10px] text-gray-500">Use for discount when purchasing</p>
                </div>
              </div>
              <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">{profile?.rewardPoints || 0} Points</span>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-[10px] text-gray-900 mb-1">
                <span>{profile?.rewardPoints >= 1500 ? 'Platinum level' : profile?.rewardPoints >= 1000 ? 'Gold level' : 'Silver level'}</span>
                <span>{profile?.rewardPoints || 0}/2000</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#006A4E] transition-all duration-500 rounded-full" 
                  style={{ width: `${Math.min(((profile?.rewardPoints || 0) / 2000) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <div className="text-center flex-1">
                <p className="font-bold text-gray-900 text-sm">{profile?.purchasedCount || 0}</p>
                <p className="text-[10px] text-gray-900">Purchased</p>
              </div>
              <div className="text-center flex-1">
                <p className="font-bold text-gray-900 text-sm">{profile?.soldCount || 0}</p>
                <p className="text-[10px] text-gray-900">Sold</p>
              </div>
              <div className="text-center flex-1">
                <p className="font-bold text-gray-900 text-sm">{profile?.donatedCount || 0}</p>
                <p className="text-[10px] text-gray-900">Donate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => navigate('/orders')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Package className="w-6 h-6 text-gray-900" />
            <span className="text-xs font-bold text-gray-900">My Order</span>
            <span className="text-[10px] text-gray-400">3 Active</span>
          </button>
          <button 
            onClick={() => navigate('/donations')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Heart className="w-6 h-6 text-gray-900" />
            <span className="text-xs font-bold text-gray-900">Donation</span>
            <span className="text-[10px] text-gray-400">8 Books</span>
          </button>
          <button 
            onClick={() => navigate('/favorites')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Star className="w-6 h-6 text-gray-900" />
            <span className="text-xs font-bold text-gray-900">Favorite</span>
            <span className="text-[10px] text-gray-400">12 Items</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-gray-200/60 p-1 rounded-full flex">
          {ORDER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-bold rounded-full transition-colors ${
                activeTab === tab 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'Orders' && (
            <div className="space-y-4">
              {/* Mock Order Card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm relative">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Order #12345</p>
                    <p className="text-xs text-gray-500 mt-0.5">Placed on Nov 10, 2025</p>
                  </div>
                  <span className="px-3 py-1 bg-[#006A4E] text-white text-[10px] font-bold rounded-full">Delivered</span>
                </div>
                
                <button 
                  onClick={() => navigate('/order/12345')}
                  className="flex gap-4 items-center mt-4 text-left w-full"
                >
                  <div className="w-16 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=100&h=150" alt="Book" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">Before the coffee gets cold</h4>
                    <p className="text-xs text-gray-500 mt-1">Condition: Good</p>
                    <p className="text-base font-bold text-[#006A4E] mt-2">10$</p>
                  </div>
                </button>
              </div>
            </div>
          )}
          {activeTab === 'Listing' && (
            <div className="space-y-4">
              {userBooks.length > 0 && (
                <div className="flex justify-between items-center bg-amber-50 p-3 rounded-2xl border border-amber-100">
                   <div className="flex items-center gap-2">
                     <Trash2 className="w-4 h-4 text-amber-600" />
                     <div>
                       <p className="text-[10px] font-bold text-amber-900">Database Optimizer</p>
                       <p className="text-[9px] text-amber-700">Remove old books to help with limits</p>
                     </div>
                   </div>
                   <button 
                     onClick={handleCleanUp}
                     disabled={isLoadingBooks}
                     className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm"
                   >
                     Clean Up (4)
                   </button>
                </div>
              )}
              {isLoadingBooks ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#006A4E] animate-spin mb-2" />
                  <p className="text-xs text-gray-500">Loading your listings...</p>
                </div>
              ) : userBooks.length > 0 ? (
                <AnimatePresence>
                  {userBooks.map(book => (
                    <motion.div 
                      key={book.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm relative group overflow-hidden"
                    >
                      <div 
                        onClick={() => navigate(`/book/${book.id}`)}
                        className="flex gap-4 items-center text-left w-full cursor-pointer"
                      >
                        <div className="w-16 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                          {book.imageUrl ? (
                            <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                              <Package className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-8">
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{book.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{book.author}</p>
                          <div className="flex items-center gap-2 mt-2">
                             <p className="text-base font-bold text-[#006A4E]">{book.price}$</p>
                             <span className="text-[10px] bg-[#E8F5E9] text-[#006A4E] px-2 py-0.5 rounded-full font-medium">{book.condition}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                      
                      {/* Delete Button */}
                      <button 
                        onClick={(e) => handleDeleteBook(e, book.id)}
                        disabled={isDeleting === book.id}
                        className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      >
                        {isDeleting === book.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">No active listings</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto">Items you list for sale will appear here for you to manage.</p>
                  <button 
                    onClick={() => navigate('/sell')}
                    className="mt-6 px-6 py-2 bg-[#006A4E] text-white text-xs font-bold rounded-full shadow-lg shadow-[#006A4E]/20"
                  >
                    Start Selling
                  </button>
                </div>
              )}
            </div>
          )}
          {activeTab === 'Coupon' && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No coupons available.</p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-red-500 font-bold hover:bg-red-50 transition-colors mt-6"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>

      {/* Floating Chat Button */}
      <div className="fixed bottom-28 left-0 right-0 md:max-w-md md:mx-auto pointer-events-none z-30 w-full">
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
