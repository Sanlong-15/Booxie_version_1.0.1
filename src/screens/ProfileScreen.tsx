import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logOut } from '../firebase';
import { User, BookOpen, Heart, Settings, HelpCircle, LogOut, ChevronRight, Award } from 'lucide-react';

export default function ProfileScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: <BookOpen className="w-5 h-5" />, label: 'My Listings', onClick: () => {} },
    { icon: <Heart className="w-5 h-5" />, label: 'Saved Books', onClick: () => {} },
    { icon: <Award className="w-5 h-5" />, label: 'Rewards & Points', onClick: () => navigate('/rewards') },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', onClick: () => {} },
    { icon: <HelpCircle className="w-5 h-5" />, label: 'Help & Support', onClick: () => {} },
  ];

  return (
    <div className="flex flex-col h-full bg-booxie-bg font-sans">
      <header className="px-6 pt-8 pb-6 bg-booxie-green text-white rounded-b-[2rem] shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white rounded-full p-1 shadow-inner">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-500" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.displayName || 'Student Reader'}</h1>
            <p className="text-booxie-green-light text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <div className="flex-1 bg-white/20 rounded-xl p-3 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs font-medium text-booxie-green-light uppercase tracking-wider">Books Sold</p>
          </div>
          <div className="flex-1 bg-white/20 rounded-xl p-3 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold">450</p>
            <p className="text-xs font-medium text-booxie-green-light uppercase tracking-wider">Points</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex items-center gap-3 text-gray-700">
                <div className="text-booxie-green">{item.icon}</div>
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-2xl shadow-sm text-red-500 font-bold hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </div>
  );
}
