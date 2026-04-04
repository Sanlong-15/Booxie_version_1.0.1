import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../firebase';
import { BookHeart, User, Mail, Lock, ArrowLeft } from 'lucide-react';

export default function SignupScreen() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      setError('');
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      setError('Failed to sign up with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('Email signup is not yet configured. Please use Google.');
  };

  return (
    <div className="min-h-screen bg-[#F8FCF9] flex flex-col relative font-sans">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-4 left-4 mt-6 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
      >
        <ArrowLeft className="w-6 h-6 text-gray-800" />
      </button>

      <div className="flex-1 flex flex-col px-6 pt-16 pb-8 max-w-md mx-auto w-full">
        
        {/* Top Section: Mascot & App Name */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 bg-[#E6F4EA] rounded-full flex items-center justify-center mb-4 shadow-inner relative overflow-hidden border-4 border-white">
            <BookHeart className="w-16 h-16 text-[#007A5A]" />
          </div>
          <h1 className="text-4xl font-extrabold text-[#007A5A] tracking-tight">Booxie</h1>
        </div>
        
        {/* Middle Section: Title & Subtitle */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign Up</h2>
          <p className="text-gray-500 text-sm">Join the Booxie community today!</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm text-center border border-red-100">
            {error}
          </div>
        )}
        
        {/* Form Section */}
        <form onSubmit={handleEmailSignup} className="space-y-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Your Name"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007A5A] focus:border-transparent transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              placeholder="Your Email"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007A5A] focus:border-transparent transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              placeholder="Password"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007A5A] focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#007A5A] text-white py-3.5 rounded-xl font-bold text-base shadow-md hover:bg-[#006349] active:scale-[0.98] transition-all mt-2"
          >
            Sign Up
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center mb-6">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-4 text-sm text-gray-400 font-medium">or</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        {/* Secondary Actions */}
        <div className="space-y-3 mb-8">
          <button
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold text-sm shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            {isLoading ? 'Signing up...' : 'Sign up with Google'}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-auto text-center pb-4">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-[#007A5A] font-bold hover:underline">
              Log In
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
