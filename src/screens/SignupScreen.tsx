import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpWithEmail } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
  User, Mail, Lock, ArrowLeft, Loader2, Camera, Phone, 
  Calendar, ChevronDown, Upload, Info
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignupScreen() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentIdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [studentIdImage, setStudentIdImage] = useState<string | null>(null);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in required fields');
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
      setError(err.message || 'Failed to sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4FBF7] flex flex-col font-sans overflow-y-auto">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between bg-[#F4FBF7] sticky top-0 z-10">
        <button onClick={() => navigate('/welcome')} className="p-2">
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-xl font-bold text-[#1C2D3A]">Sign Up</h1>
        <div className="w-10"></div> {/* Spacer */}
      </header>

      <div className="flex-1 flex flex-col px-8 pb-10 max-w-sm mx-auto w-full">
        
        {/* Profile Pick */}
        <div className="flex flex-col items-center mb-6 mt-2">
          <div className="relative">
            <div 
              onClick={handleImageClick}
              className="w-32 h-32 rounded-full bg-[#E6EBE8] flex items-center justify-center overflow-hidden cursor-pointer"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-white opacity-40" />
              )}
            </div>
            <button 
              onClick={handleImageClick}
              className="absolute bottom-2 right-2 bg-[#2D3134] p-2 rounded-full text-white shadow-md"
            >
              <Camera className="w-4 h-4 fill-white" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-[11px] text-center border border-red-100 flex flex-col gap-2">
            <span className="font-bold uppercase tracking-tight">Signup Error</span>
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

        {/* Inputs */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#00845A]"
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#00845A]"
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
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#00845A]"
              required
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#00845A]"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              placeholder="Select your birthday"
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#00845A]"
            />
          </div>

          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00845A] appearance-none"
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 pointer-events-none" />
          </div>

          {/* Student ID / Image Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-gray-700">Insert Image*</span>
              <Info className="w-3.5 h-3.5 text-gray-400" />
            </div>
            
            <div 
              onClick={() => studentIdInputRef.current?.click()}
              className="w-full h-36 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center bg-transparent cursor-pointer"
            >
              {studentIdImage ? (
                <img src={studentIdImage} alt="ID" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-300 mb-2" />
                  <span className="text-xs text-gray-300 font-medium">Upload Image</span>
                </>
              )}
            </div>
            <input type="file" ref={studentIdInputRef} onChange={handleStudentIdChange} className="hidden" accept="image/*" />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#00845A] text-white py-4 rounded-full font-bold text-lg shadow-md hover:bg-[#00704d] active:scale-[0.98] transition-all mt-6 shadow-sm"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
}

