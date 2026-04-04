import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Plus, Users, User as UserIcon, Bell, MessageCircle, Gift, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FCF9] flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-[#F8FCF9] px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#88D4B9] rounded-full flex items-center justify-center overflow-hidden">
            {/* Mascot placeholder */}
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=booxie&backgroundColor=88D4B9" alt="Mascot" className="w-8 h-8" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-[#006A4E] leading-tight">Booxie</h1>
            <span className="text-[10px] text-gray-500 leading-tight">Secondhand books</span>
          </div>
        </div>
        
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#FFF8E7] px-2 py-1 rounded-full">
              <Star className="w-3 h-3 text-[#FFB800] fill-[#FFB800]" />
              <span className="text-xs font-bold text-[#FFB800]">1250 points</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-700">
              <button className="relative p-1">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
              <button className="relative p-1" onClick={() => navigate('/chat')}>
                <MessageCircle className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
              <button className="p-1">
                <Gift className="w-5 h-5" />
              </button>
              <button className="w-5 h-5 rounded-full overflow-hidden border border-gray-200">
                <img src="https://flagcdn.com/w20/gb.png" alt="English" className="w-full h-full object-cover" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 relative">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      {user && (
        <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-20 pb-safe">
          <NavItem to="/" icon={<Home className="w-6 h-6" />} label="Home" />
          <NavItem to="/search" icon={<Search className="w-6 h-6" />} label="Search" />
          <NavItem to="/sell" icon={<div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center"><Plus className="w-4 h-4" /></div>} label="Sell" />
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
