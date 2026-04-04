import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rabbit, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F4FBF7] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center mb-12"
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
      </motion.div>
    </div>
  );
}
