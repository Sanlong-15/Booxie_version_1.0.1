import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import { motion } from 'framer-motion';
import { Rabbit, BookOpen } from 'lucide-react';

import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import SellScreen from './screens/SellScreen';
import BookDetailScreen from './screens/BookDetailScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatScreen from './screens/ChatScreen';
import RewardsScreen from './screens/RewardsScreen';
import GeminiChatScreen from './screens/GeminiChatScreen';
import CommunityHubScreen from './screens/CommunityHubScreen';
import CartScreen from './screens/CartScreen';
import ProfileScreen from './screens/ProfileScreen';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4FBF7]">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
          {/* Background circle */}
          <div className="absolute inset-0 bg-[#88D4B9] rounded-full opacity-80"></div>
          
          {/* Mascot placeholder (using icons to approximate the rabbit with books) */}
          <div className="relative z-10 flex flex-col items-center">
            <Rabbit className="w-24 h-24 text-white drop-shadow-md" strokeWidth={1.5} />
            <div className="flex -mt-4 gap-1">
              <BookOpen className="w-8 h-8 text-blue-600 fill-blue-500 drop-shadow-sm" />
              <BookOpen className="w-8 h-8 text-blue-700 fill-blue-600 drop-shadow-sm" />
            </div>
          </div>
        </div>
        
        <motion.h1 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl font-bold text-[#006A4E] tracking-tight"
        >
          Booxie
        </motion.h1>
      </motion.div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/welcome" />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/signup" element={<SignupScreen />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<HomeScreen />} />
              <Route path="search" element={<SearchScreen />} />
              <Route path="sell" element={<SellScreen />} />
              <Route path="book/:id" element={<BookDetailScreen />} />
              <Route path="chat" element={<ChatListScreen />} />
              <Route path="chat/:id" element={<ChatScreen />} />
              <Route path="rewards" element={<RewardsScreen />} />
              <Route path="gemini" element={<GeminiChatScreen />} />
              <Route path="community" element={<CommunityHubScreen />} />
              <Route path="cart" element={<CartScreen />} />
              <Route path="profile" element={<ProfileScreen />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}


