import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, logInWithEmail, signInAnonymously } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowLeft, Loader2, User, Facebook } from 'lucide-react';
import { motion } from 'framer-motion';
import BooxieLogo from '../components/BooxieLogo';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

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

  const handleGuestContinue = async () => {
    try {
      setIsLoading(true);
      setError('');
      await signInAnonymously();
      navigate('/');
    } catch (err) {
      console.error(err);
      localStorage.setItem('guestMode', 'true');
      navigate('/');
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
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4FBF7] flex flex-col font-sans overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-4 flex items-center">
        <button onClick={() => navigate('/welcome')} className="p-2">
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-10 pb-10 max-w-sm mx-auto w-full">
        {/* Top Section */}
        <div className="flex flex-col items-center mb-6">
          <BooxieLogo className="w-32 h-32 mb-2" />
          <h1 className="text-4xl font-extrabold text-[#006A4E] tracking-tight">Booxie</h1>
        </div>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Log In</h2>
          <p className="text-gray-400 text-xs font-medium">We’re here to help you!</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-[11px] text-center border border-red-100 flex flex-col gap-2">
            <span className="font-bold uppercase tracking-tight">Login Error</span>
            <p className="italic">{error}</p>
            {error.includes('auth/unauthorized-domain') && (
              <div className="mt-2 text-left bg-white/50 p-2 rounded-lg border border-red-200">
                <p className="font-bold text-red-700 mb-1">To fix this:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Go to your <b>Firebase Console</b></li>
                  <li>Go to <b>Authentication</b> &gt; <b>Settings</b> &gt; <b>Authorized Domains</b></li>
                  <li>Add <b>{window.location.hostname}</b> to the list</li>
                </ol>
              </div>
            )}
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleEmailLogin} className="space-y-3.5 mb-6">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#007A5A]"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#007A5A]"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#007A5A]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#00845A] text-white py-4 rounded-full font-bold text-base hover:bg-[#00704d] active:scale-[0.98] transition-all shadow-sm"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Log In'}
          </button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="text-gray-400 text-xs font-medium">or</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGuestContinue}
            className="w-full bg-white border border-[#00845A] text-[#00845A] py-3 rounded-xl font-bold text-sm hover:bg-[#f0faf5] transition-colors"
          >
            Continue as guest
          </button>
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-[#F5FAF7] border border-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
            Continue with Google
          </button>
          <button
            onClick={() => setError('Facebook login is coming soon!')}
            className="w-full bg-[#F5FAF7] border border-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors"
          >
            <Facebook className="w-5 h-5 text-[#1877F2] fill-[#1877F2]" />
            Continue with Facebook
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 font-medium">
            Do you already have an account?{' '}
            <button onClick={() => navigate('/signup')} className="text-[#3AA9FF] font-bold hover:underline">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
