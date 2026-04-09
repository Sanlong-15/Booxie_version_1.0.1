import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, logInWithEmail } from '../firebase';
import { Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import BooxieLogo from '../components/BooxieLogo';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      await signInWithGoogle();
      localStorage.removeItem('guestMode');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await logInWithEmail(email, password);
      localStorage.removeItem('guestMode');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format');
      } else {
        setError('Failed to log in. Please check your credentials or enable Email/Password auth in Firebase Console.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FCF9] flex flex-col relative font-sans">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/welcome')} 
        className="absolute top-4 left-4 mt-6 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
      >
        <ArrowLeft className="w-6 h-6 text-gray-800" />
      </button>

      <div className="flex-1 flex flex-col px-6 pt-16 pb-8 max-w-md mx-auto w-full">
        
        {/* Top Section: Mascot & App Name */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 bg-[#E6F4EA] rounded-full flex items-center justify-center mb-4 shadow-inner relative overflow-hidden border-4 border-white">
            <BooxieLogo className="w-24 h-24" />
          </div>
          <h1 className="text-4xl font-extrabold text-[#007A5A] tracking-tight">Booxie</h1>
        </div>
        
        {/* Middle Section: Title & Subtitle */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Log In</h2>
          <p className="text-gray-500 text-sm">Welcome back to Booxie!</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm text-center border border-red-100">
            {error}
          </div>
        )}
        
        {/* Form Section */}
        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your Email"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007A5A] focus:border-transparent transition-all"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007A5A] focus:border-transparent transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#007A5A] text-white py-3.5 rounded-xl font-bold text-base shadow-md hover:bg-[#006349] active:scale-[0.98] transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold text-sm shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </div>
            ) : (
              'Continue with Google'
            )}
          </motion.button>

          <button
            onClick={() => {
              localStorage.setItem('guestMode', 'true');
              navigate('/');
            }}
            className="w-full bg-transparent border border-[#007A5A] text-[#007A5A] py-3.5 rounded-xl font-semibold text-sm hover:bg-[#E6F4EA] active:scale-[0.98] transition-all"
          >
            Continue as guest
          </button>
        </div>

        {/* Footer */}
        <div className="mt-auto text-center pb-4">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <button onClick={() => navigate('/signup')} className="text-[#007A5A] font-bold hover:underline">
              Sign Up
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
