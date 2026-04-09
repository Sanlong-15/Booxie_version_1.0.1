import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, signUpWithEmail } from '../firebase';
import { 
  User, Mail, Lock, ArrowLeft, Loader2, Camera, Phone, 
  Calendar, ChevronDown, Facebook, Plus, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignupScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentIdInputRef = useRef<HTMLInputElement>(null);
  
  // Required Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  // Optional Fields
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [studentIdImage, setStudentIdImage] = useState<string | null>(null);
  const [showOptional, setShowOptional] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = name && email && password && phone;

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudentIdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      setError('');
      await signInWithGoogle();
      localStorage.removeItem('guestMode');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign up with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookSignup = () => {
    setError('Facebook sign up is coming soon!');
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await signUpWithEmail(
        email, 
        password, 
        name, 
        phone, 
        birthday, 
        gender, 
        profileImage,
        studentIdImage
      );
      localStorage.removeItem('guestMode');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format');
      } else {
        setError('Failed to sign up. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FCF9] flex flex-col font-sans">
      {/* Header */}
      <header className="px-4 pt-6 pb-2 flex items-center justify-between sticky top-0 bg-[#F8FCF9]/80 backdrop-blur-md z-20">
        <button 
          onClick={() => navigate('/welcome')} 
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
        <div className="flex-1 text-center pr-10">
          <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col px-6 pb-12 max-w-md mx-auto w-full">
        
        <div className="text-center mb-8">
          <p className="text-gray-500 text-sm">Join Booxie to buy and sell books</p>
        </div>

        {/* Profile Image Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative group">
            <div 
              onClick={handleImageClick}
              className="w-28 h-28 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#E6F4EA] flex items-center justify-center">
                  <User className="w-12 h-12 text-[#007A5A]" />
                </div>
              )}
            </div>
            <button 
              onClick={handleImageClick}
              className="absolute bottom-0 right-0 bg-[#007A5A] p-2 rounded-full border-2 border-white shadow-sm text-white hover:bg-[#006349] transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-600 p-3 rounded-2xl mb-6 text-sm text-center border border-red-100"
          >
            {error}
          </motion.div>
        )}
        
        {/* Form Section */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full pl-11 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007A5A] focus:border-transparent transition-all shadow-sm"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full pl-11 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007A5A] focus:border-transparent transition-all shadow-sm"
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
                className="w-full pl-11 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007A5A] focus:border-transparent transition-all shadow-sm"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                className="w-full pl-11 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007A5A] focus:border-transparent transition-all shadow-sm"
                required
              />
            </div>
          </div>

          {/* Progressive Disclosure: Optional Info */}
          <div className="pt-2">
            <button 
              type="button"
              onClick={() => setShowOptional(!showOptional)}
              className="flex items-center gap-2 text-sm font-medium text-[#007A5A] hover:opacity-80 transition-opacity"
            >
              {showOptional ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showOptional ? 'Hide optional info' : 'Add optional info'}
            </button>

            <AnimatePresence>
              {showOptional && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-4 mt-4"
                >
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007A5A] focus:border-transparent transition-all shadow-sm"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full pl-11 pr-10 py-4 bg-white border border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007A5A] focus:border-transparent transition-all shadow-sm appearance-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Student ID Upload */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-700">Student ID</span>
                      <span className="text-red-500">*</span>
                      <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[10px] text-gray-400 cursor-help" title="Optional but recommended for verification">i</div>
                    </div>
                    
                    <div 
                      onClick={() => studentIdInputRef.current?.click()}
                      className="w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden group"
                    >
                      {studentIdImage ? (
                        <div className="relative w-full h-full">
                          <img src={studentIdImage} alt="Student ID" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-[#E6F4EA] rounded-full flex items-center justify-center mb-2">
                            <Camera className="w-6 h-6 text-[#007A5A]" />
                          </div>
                          <span className="text-sm text-gray-400">Upload Image</span>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={studentIdInputRef} 
                      onChange={handleStudentIdChange} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl shadow-[#007A5A]/20 active:scale-[0.98] transition-all mt-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none ${
              isFormValid ? 'bg-[#007A5A] text-white hover:bg-[#006349]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-[#007A5A] font-bold hover:underline">
              Log In
            </button>
          </p>
        </div>

        {/* Social Sign Up Section */}
        <div className="mt-10">
          <div className="flex items-center mb-6">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-400 font-medium">or continue with</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="flex items-center justify-center gap-3 bg-white border border-gray-100 py-3.5 rounded-2xl font-semibold text-sm shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              <span className="text-gray-700">{isLoading ? '...' : 'Google'}</span>
            </motion.button>
            <button
              onClick={handleFacebookSignup}
              disabled={isLoading}
              className="flex items-center justify-center gap-3 bg-white border border-gray-100 py-3.5 rounded-2xl font-semibold text-sm shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Facebook className="w-5 h-5 text-[#1877F2] fill-[#1877F2]" />
              <span className="text-gray-700">Facebook</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

