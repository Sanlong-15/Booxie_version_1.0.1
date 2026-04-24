import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Plus, Users, User as UserIcon, Bell, MessageCircle, Gift, Star, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BooxieLogo from './BooxieLogo';
import QuotaWarning from './QuotaWarning';

export default function Layout() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'KH'>('EN');

  const hideHeaderRoutes = ['/search'];
  const shouldShowHeader = !hideHeaderRoutes.includes(location.pathname);

  const showBottomNavRoutes = ['/', '/search', '/sell', '/community', '/profile'];
  const shouldShowBottomNav = showBottomNavRoutes.includes(location.pathname);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'EN' ? 'KH' : 'EN');
  };

  const isGeminiChat = location.pathname === '/gemini';

  return (
    <div className="h-full h-dvh bg-[#F8FCF9] flex flex-col md:max-w-md md:mx-auto md:shadow-2xl relative overflow-hidden font-sans w-full">
      <QuotaWarning />
      {/* Header */}
      {shouldShowHeader && (
        <header className="bg-[#F8FCF9] px-4 py-3 flex items-center justify-between z-50 relative shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
              <BooxieLogo className="w-10 h-10" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-[#006A4E] leading-tight">Booxie</h1>
              <span className="text-[10px] text-gray-500 leading-tight">Secondhand books</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <div 
                onClick={() => navigate('/profile')}
                className="flex items-center gap-1 bg-[#FFF8E7] px-2 py-1 rounded-full cursor-pointer hover:bg-[#FFE8B3] transition-colors shrink-0"
              >
                <Star className="w-3 h-3 text-[#FFB800] fill-[#FFB800]" />
                <span className="text-xs font-bold text-[#FFB800]">{profile?.rewardPoints || 0} pts</span>
              </div>
            )}
            
            <div className="flex items-center gap-1.5 text-gray-700 relative">
              {user && (
                <>
                  <button 
                    className="relative p-1 hover:bg-gray-100 rounded-full transition-colors shrink-0"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                  </button>

                  {showNotifications && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                      <div className="p-3 border-b border-gray-50 bg-gray-50">
                        <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        <div className="p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                          <p className="text-xs text-gray-800 font-medium">Your book "Khmer Literature" was sold!</p>
                          <span className="text-[10px] text-gray-400">2 hours ago</span>
                        </div>
                        <div className="p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                          <p className="text-xs text-gray-800 font-medium">You earned 50 points for logging in.</p>
                          <span className="text-[10px] text-gray-400">1 day ago</span>
                        </div>
                        <div className="p-3 hover:bg-gray-50 cursor-pointer transition-colors">
                          <p className="text-xs text-gray-800 font-medium">New message from Seller 2</p>
                          <span className="text-[10px] text-gray-400">2 days ago</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button className="relative p-1 hover:bg-gray-100 rounded-full transition-colors shrink-0" onClick={() => navigate('/chat')}>
                    <MessageCircle className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                  </button>
                </>
              )}
              
              <button 
                className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors shrink-0"
                onClick={toggleLanguage}
                title={`Switch to ${language === 'EN' ? 'Khmer' : 'English'}`}
              >
                {language === 'EN' ? (
                  <img src="https://flagcdn.com/w40/gb.png" alt="English" className="w-full h-full object-cover" />
                ) : (
                  <img src="https://flagcdn.com/w40/kh.png" alt="Khmer" className="w-full h-full object-cover" />
                )}
              </button>
              
              {!user && (
                <button 
                  onClick={() => navigate('/login')}
                  className="text-xs font-bold text-[#006A4E] px-2 py-1.5 border border-[#006A4E] rounded-full hover:bg-[#E8F5F0] transition-colors whitespace-nowrap"
                >
                  Log In
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 relative ${isGeminiChat ? 'overflow-hidden flex flex-col' : 'overflow-y-auto overflow-x-hidden'} ${shouldShowBottomNav ? 'pb-20' : ''}`}>
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      {shouldShowBottomNav && (
        <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex justify-between items-center z-20 pb-safe md:max-w-md md:mx-auto">
          <NavItem to="/" icon={<Home className="w-6 h-6" />} label="Home" />
          <NavItem to="/search" icon={<Search className="w-6 h-6" />} label="Search" />
          <NavItem to="/sell" icon={<div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center -mt-1"><Camera className="w-3.5 h-3.5" /></div>} label="Scan" />
          <NavItem to="/community" icon={<Users className="w-6 h-6" />} label="Community" />
          <NavItem to="/profile" icon={<UserIcon className="w-6 h-6" />} label="Profile" />
        </nav>
      )}
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex flex-col items-center gap-1 transition-colors
        ${isActive ? 'text-[#006A4E]' : 'text-gray-400 hover:text-gray-600'}
      `}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}
