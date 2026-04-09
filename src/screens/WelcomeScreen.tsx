import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BooxieLogo from '../components/BooxieLogo';
import { signInAnonymously } from '../firebase';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleGuestContinue = async () => {
    try {
      setIsGuestLoading(true);
      await signInAnonymously();
      navigate('/');
    } catch (error) {
      console.error("Failed to sign in as guest", error);
      // Fallback to old behavior if anonymous auth fails (e.g. not enabled in console)
      localStorage.setItem('guestMode', 'true');
      navigate('/');
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4FBF7] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center mb-12"
      >
        <div className="mb-6 flex items-center justify-center">
          <BooxieLogo className="w-40 h-40 drop-shadow-sm" />
        </div>
        
        <motion.h1 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-5xl font-bold text-[#006A4E] tracking-tight"
        >
          Booxie
        </motion.h1>
      </motion.div>
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-xs flex flex-col gap-4"
      >
        <button
          onClick={() => navigate('/signup')}
          className="w-full bg-white text-[#006A4E] border-[1.5px] border-[#006A4E] py-3.5 rounded-2xl font-medium text-lg hover:bg-[#E8F5F0] transition-colors active:scale-[0.98]"
        >
          Sign Up
        </button>
        
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-white text-[#006A4E] border-[1.5px] border-[#006A4E] py-3.5 rounded-2xl font-medium text-lg hover:bg-[#E8F5F0] transition-colors active:scale-[0.98]"
        >
          Log In
        </button>

        <button
          onClick={handleGuestContinue}
          disabled={isGuestLoading}
          className="w-full text-gray-500 py-2 font-medium text-sm hover:text-gray-700 transition-colors disabled:opacity-50"
        >
          {isGuestLoading ? 'Connecting...' : 'Continue as Guest'}
        </button>
      </motion.div>
    </div>
  );
}
