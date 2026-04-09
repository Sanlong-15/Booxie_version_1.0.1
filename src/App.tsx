import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import { motion } from 'framer-motion';
import BooxieLogo from './components/BooxieLogo';

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
import CheckoutScreen from './screens/CheckoutScreen';
import OrderSuccessScreen from './screens/OrderSuccessScreen';
import OrderConfirmationScreen from './screens/OrderConfirmationScreen';
import ReceiptScreen from './screens/ReceiptScreen';
import ProfileScreen from './screens/ProfileScreen';
import BookDetailsSellScreen from './screens/BookDetailsSellScreen';
import ScanEditScreen from './screens/ScanEditScreen';
import PlaceholderScreen from './screens/PlaceholderScreen';

// Admin Screens
import AdminLayout from './screens/admin/AdminLayout';
import AdminDashboardScreen from './screens/admin/AdminDashboardScreen';
import AdminUsersScreen from './screens/admin/AdminUsersScreen';
import AdminListingsScreen from './screens/admin/AdminListingsScreen';
import AdminTransactionsScreen from './screens/admin/AdminTransactionsScreen';
import AdminModerationScreen from './screens/admin/AdminModerationScreen';
import AdminReportsScreen from './screens/admin/AdminReportsScreen';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4FBF7]">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="mb-6 flex items-center justify-center">
          <BooxieLogo className="w-40 h-40 drop-shadow-sm" />
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
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/signup" element={<SignupScreen />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<HomeScreen />} />
              <Route path="search" element={<SearchScreen />} />
              <Route path="sell" element={<SellScreen />} />
              <Route path="sell/edit" element={<ScanEditScreen />} />
              <Route path="sell/details" element={<BookDetailsSellScreen />} />
              <Route path="book/:id" element={<BookDetailScreen />} />
              <Route path="chat" element={<ChatListScreen />} />
              <Route path="chat/:id" element={<ChatScreen />} />
              <Route path="rewards" element={<RewardsScreen />} />
              <Route path="gemini" element={<GeminiChatScreen />} />
              <Route path="community" element={<CommunityHubScreen />} />
              <Route path="cart" element={<CartScreen />} />
              <Route path="checkout" element={<CheckoutScreen />} />
              <Route path="order-confirmation" element={<OrderConfirmationScreen />} />
              <Route path="order-success" element={<OrderSuccessScreen />} />
              <Route path="receipt" element={<ReceiptScreen />} />
              <Route path="profile" element={<ProfileScreen />} />
              
              {/* Placeholder Routes for missing links */}
              <Route path="settings" element={<PlaceholderScreen title="Settings" />} />
              <Route path="edit-profile" element={<PlaceholderScreen title="Edit Profile" />} />
              <Route path="membership" element={<PlaceholderScreen title="Membership" />} />
              <Route path="orders" element={<PlaceholderScreen title="My Orders" />} />
              <Route path="donations" element={<PlaceholderScreen title="Donations" />} />
              <Route path="favorites" element={<PlaceholderScreen title="Favorites" />} />
              <Route path="order/:id" element={<PlaceholderScreen title="Order Details" />} />
              <Route path="leaderboard" element={<PlaceholderScreen title="Leaderboard" />} />
              <Route path="earn-points" element={<PlaceholderScreen title="Earn Points" />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboardScreen />} />
              <Route path="users" element={<AdminUsersScreen />} />
              <Route path="listings" element={<AdminListingsScreen />} />
              <Route path="transactions" element={<AdminTransactionsScreen />} />
              <Route path="moderation" element={<AdminModerationScreen />} />
              <Route path="reports" element={<AdminReportsScreen />} />
              <Route path="settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-500 mt-2">Admin settings coming soon.</p></div>} />
            </Route>
          </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}


