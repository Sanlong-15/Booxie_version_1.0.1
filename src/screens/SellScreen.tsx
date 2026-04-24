import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { getGeminiAI } from '../lib/gemini';
import { Loader2, X, ReceiptText, FileText, Book, BookOpen, FileSearch, Image as ImageIcon, Check, Zap, ZapOff } from 'lucide-react';
import { isGeminiQuotaError } from '../lib/geminiErrors';
import { motion, AnimatePresence } from 'motion/react';

const SCAN_TYPES = [
  { id: 'Front Cover', icon: Book, priority: 'priority' },
  { id: 'Back Cover', icon: BookOpen, priority: 'priority' },
  { id: 'Receipt', icon: ReceiptText, priority: 'optional' },
  { id: 'Bank Invoice', icon: FileText, priority: 'optional' },
  { id: 'Website Page', icon: FileSearch, priority: 'optional' },
];

export default function SellScreen() {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const isScanningRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Front Cover');
  const [listingType, setListingType] = useState<'sale' | 'donation'>('sale');
  const [frontCoverData, setFrontCoverData] = useState<any>(null);
  const [frontCoverImage, setFrontCoverImage] = useState<string | null>(null);
  const [backCoverImage, setBackCoverImage] = useState<string | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  
  const frontCoverRef = useRef<string | null>(null);
  const backCoverRef = useRef<string | null>(null);
  const receiptRef = useRef<string | null>(null);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);

  // Get active index for dynamic layout
  const activeIndex = useMemo(() => SCAN_TYPES.findIndex(t => t.id === activeTab), [activeTab]);

  const getImageForType = (typeId: string) => {
    switch (typeId) {
      case 'Front Cover': return frontCoverImage;
      case 'Back Cover': return backCoverImage;
      case 'Receipt': return receiptImage;
      default: return null;
    }
  };

  // Sync front cover data with listing type
  useEffect(() => {
    if (frontCoverData) {
      setFrontCoverData((prev: any) => ({
        ...prev,
        type: listingType,
        price: listingType === 'donation' ? 0 : (prev.price === 0 ? 5.00 : prev.price)
      }));
    }
  }, [listingType]);

  // Center the active tab on mount or change
  useEffect(() => {
    const container = scrollRef.current;
    if (container && activeIndex !== -1) {
      const cardWidth = 96; // (W=80 + gap-4=16) -> 96
      const scrollPos = (activeIndex * cardWidth) - (container.offsetWidth / 2) + (cardWidth / 2);
      
      container.scrollTo({ 
        left: scrollPos, 
        behavior: container.scrollLeft === 0 ? 'auto' : 'smooth' 
      });
    }
  }, [activeIndex]);

  const [showSuccessFlash, setShowSuccessFlash] = useState(false);

  const [torchOn, setTorchOn] = useState(false);

  const toggleTorch = async () => {
    if (!webcamRef.current?.video) return;
    const stream = webcamRef.current.video.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as any]
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.warn("Torch not supported on this device/browser:", err);
    }
  };

  const captureAndAnalyze = useCallback(async (isManual = false) => {
    if (isScanningRef.current || !webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    isScanningRef.current = true;
    setIsScanning(true);
    if (isManual) setError('');
    
    const base64String = imageSrc.split(',')[1];
    
    try {
      const ai = getGeminiAI();
      if (!ai) {
        // Fallback for demo when no key is present
        if (isManual) {
          setFrontCoverImage(imageSrc);
          setActiveTab('Back Cover');
        }
        return;
      }

      if (activeTab === 'Front Cover') {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { text: 'Analyze this book front cover image. You are an expert librarian. Extract precisely: \n- title (full name)\n- author (full name)\n- description (a compelling 2-3 sentence summary based on visual cues)\n- ISBN (if visible, 10 or 13 digits)\n- suggested price (integer or two-decimal number in USD, typical second-hand market value 2.00-15.00)\n\nReturn ONLY a valid JSON object: {"detected": boolean, "title": string, "author": string, "description": string, "isbn": string, "price": number}. If no book cover is clearly visible, return {"detected": false}.' },
              { inlineData: { data: base64String, mimeType: 'image/jpeg' } }
            ]
          }
        });

        let text = response.text || '{}';
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        try {
          const data = JSON.parse(text);
          if (data.detected) {
            setShowSuccessFlash(true);
            setTimeout(() => setShowSuccessFlash(false), 500);
            
            setFrontCoverData({
              ...data,
              type: listingType,
              price: listingType === 'donation' ? 0 : data.price
            });
            setFrontCoverImage(imageSrc);
            frontCoverRef.current = imageSrc;
            // Smooth 2026 UX transition
            setTimeout(() => {
              setActiveTab('Back Cover');
            }, 1000);
          } else if (isManual) {
            setError('No book front cover detected. Please ensure the book is in focus.');
          }
        } catch (e) {
          if (isManual) setError('AI processing failed. Please try again.');
        }
      } else if (activeTab === 'Back Cover') {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { text: 'Analyze this book back cover image. Look for barcodes, ISBN numbers (10 or 13 digits, often starting with 978 or 979), and blurbs. \n\nReturn ONLY JSON: {"detected": boolean, "isbn": string, "summary": string}. If nothing is detected, return {"detected": false}.' },
              { inlineData: { data: base64String, mimeType: 'image/jpeg' } }
            ]
          }
        });

        let text = response.text || '{}';
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        try {
          const data = JSON.parse(text);
          if (data.detected) {
            setShowSuccessFlash(true);
            setTimeout(() => setShowSuccessFlash(false), 500);

            // Update data from back scan
            const updatedFrontData = { ...frontCoverData };
            if (data.isbn && !updatedFrontData.isbn) {
              updatedFrontData.isbn = data.isbn;
            }
            if (data.summary && (!updatedFrontData.description || updatedFrontData.description.length < 20)) {
              updatedFrontData.description = data.summary;
            }

            setBackCoverImage(imageSrc);
            backCoverRef.current = imageSrc;
            setTimeout(() => {
              navigate('/sell/edit', { 
                state: { 
                  images: [frontCoverRef.current, imageSrc, receiptRef.current].filter(Boolean), 
                  frontCoverData: updatedFrontData
                } 
              });
            }, 1000); 
          } else if (isManual) {
            setError('No book back cover detected. Please flip the book.');
          }
        } catch (e) {
          if (isManual) setError('Verification failed. Try again.');
        }
      } else if (activeTab === 'Receipt') {
        setReceiptImage(imageSrc);
        receiptRef.current = imageSrc;
      }
    } catch (err: any) {
      console.error("Scan error:", err);
      if (isGeminiQuotaError(err)) {
        setAutoScanEnabled(false);
        setError('Gemini API quota exceeded. Please try again in 1 minute.');
      } else if (isManual) {
        const errMsg = err?.message || 'Check your lighting and connection.';
        setError(`Failed to scan: ${errMsg}`);
      }
    } finally {
      isScanningRef.current = false;
      setIsScanning(false);
    }
  }, [activeTab, frontCoverData, frontCoverImage, receiptImage, listingType, navigate]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const runAutoScan = async () => {
      if (!autoScanEnabled) return;
      if (activeTab === 'Front Cover' || activeTab === 'Back Cover') {
        // Only trigger if we haven't already captured an image for this tab
        const currentImage = activeTab === 'Front Cover' ? frontCoverImage : backCoverImage;
        if (!currentImage) {
          await captureAndAnalyze();
        }
        timeoutId = setTimeout(runAutoScan, 2500); // 2.5s interval for a snappy "continuous" feel
      }
    };
    runAutoScan();
    return () => clearTimeout(timeoutId);
  }, [autoScanEnabled, activeTab, captureAndAnalyze, frontCoverImage, backCoverImage]);

  const handleManualCapture = () => captureAndAnalyze(true);
  const handleNext = () => {
    if (!frontCoverImage || !backCoverImage) {
      setError('Please scan both Front and Back covers for a complete listing.');
      return;
    }
    navigate('/sell/edit', { 
      state: { 
        images: [frontCoverImage, backCoverImage, receiptImage].filter(Boolean), 
        frontCoverData 
      } 
    });
  };
  const handleDone = () => navigate('/');

  return (
    <div className="fixed inset-0 bg-[#1A8765] z-50 flex flex-col font-sans overflow-hidden text-white">
      {/* Header */}
      <div className="pt-12 pb-4 px-6 flex justify-between items-center z-50 relative">
        <div className="flex bg-white/10 backdrop-blur-xl rounded-2xl p-1 shadow-xl border border-white/10">
          <button 
            onClick={() => setListingType('sale')}
            className={`px-7 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              listingType === 'sale' 
                ? 'bg-white text-[#1A8765] shadow-lg scale-105' 
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            SELL
          </button>
          <button 
            onClick={() => setListingType('donation')}
            className={`px-7 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              listingType === 'donation' 
                ? 'bg-white text-[#1A8765] shadow-lg scale-105' 
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            DONATE
          </button>
        </div>
        <button 
          onClick={handleDone}
          className="px-6 py-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl text-white text-sm font-bold hover:bg-white/20 transition-all active:scale-95 shadow-lg"
        >
          Done
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center min-h-0 px-6">
        {/* Scanning Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full aspect-[9/18] max-w-sm rounded-[50px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/10 bg-black/20"
        >
          {/* Camera Viewport */}
          <div className="relative w-full h-full">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1] brightness-[1.05]"
            />
            
            {/* Focus Ring Indicator */}
            <motion.div 
              animate={{ 
                scale: [1, 0.95, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/30 rounded-3xl z-10 pointer-events-none"
            />
          </div>

          {/* Flash/Torch Toggle Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleTorch();
            }}
            className={`absolute top-10 right-10 p-4 rounded-full backdrop-blur-xl transition-all z-40 border shadow-2xl ${
              torchOn 
                ? 'bg-yellow-400 text-black border-yellow-300 shadow-[0_0_25px_rgba(250,204,21,0.5)]' 
                : 'bg-black/40 text-white border-white/20 hover:bg-black/60'
            }`}
          >
            {torchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
          </button>
          
          {/* Corner Brackets */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-16 h-16 border-t-[5px] border-l-[5px] border-white rounded-tl-[32px] opacity-90"></div>
            <div className="absolute top-10 right-10 w-16 h-16 border-t-[5px] border-r-[5px] border-white rounded-tr-[32px] opacity-90"></div>
            <div className="absolute bottom-10 left-10 w-16 h-16 border-b-[5px] border-l-[5px] border-white rounded-bl-[32px] opacity-90"></div>
            <div className="absolute bottom-10 right-10 w-16 h-16 border-b-[5px] border-r-[5px] border-white rounded-br-[32px] opacity-90"></div>
          </div>

          <AnimatePresence>
            {(isScanning || autoScanEnabled) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 pointer-events-none"
              >
                {/* Horizontal Scanning Bar Animation */}
                <motion.div 
                  animate={{ 
                    top: ["10%", "90%", "10%"],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className="absolute left-10 right-10 h-0.5 bg-white/40 blur-[2px] shadow-[0_0_15px_rgba(255,255,255,0.8)] z-20"
                />
                
                {/* Detection Pulse */}
                <motion.div 
                  animate={{ scale: [1, 1.02, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-20 border border-white/20 rounded-3xl"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Flash & Auto-Scan Label */}
          <AnimatePresence>
            {showSuccessFlash && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#E8F5F0]/60 backdrop-blur-[2px] z-30 flex items-center justify-center pointer-events-none"
              >
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  className="bg-white rounded-full p-6 shadow-2xl"
                >
                  <Check className="w-16 h-16 text-[#1A8765]" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {autoScanEnabled && !isScanning && !showSuccessFlash && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 flex items-center gap-3 z-20 pointer-events-none"
              >
                <div className="w-2.5 h-2.5 bg-[#32B38B] rounded-full animate-pulse shadow-[0_0_10px_#32B38B]" />
                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/90">Detecting Book...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isScanning && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xl text-white px-6 py-2.5 rounded-full flex items-center gap-3 text-sm font-bold shadow-2xl border border-white/20 z-50"
              >
                <Loader2 className="w-4 h-4 animate-spin text-[#32B38B]" />
                <span>Scanning {activeTab}...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step Indicator Overlay */}
          <div className="absolute top-6 left-6 right-6 flex gap-2 z-40">
            <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${frontCoverImage ? 'bg-[#32B38B]' : 'bg-white/20'}`} />
            <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${backCoverImage ? 'bg-[#32B38B]' : 'bg-white/20'}`} />
          </div>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-red-500 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider text-center shadow-2xl border border-red-400 max-w-xs z-50"
          >
            {error}
            <button onClick={() => setError('')} className="ml-4 text-white/60 hover:text-white transition-colors">✕</button>
          </motion.div>
        )}
      </div>

      {/* Bottom Interface */}
      <div className="relative pb-10 pt-4 shrink-0 overflow-hidden bg-gradient-to-t from-black/20 to-transparent">
        {/* Carousel Area */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-4 px-[40%] py-6 h-52 items-center relative z-10"
        >
          {SCAN_TYPES.map((type, index) => {
            const isActive = activeTab === type.id;
            const diff = index - activeIndex;
            const Icon = type.icon;
            const scannedImage = getImageForType(type.id);
            
            // Animation values based on proximity to center
            const scale = isActive ? 1.25 : 0.85;
            const opacity = isActive ? 1 : 0.4;
            const brightness = isActive ? 'brightness(1.1)' : 'brightness(0.7)';
            const zIndex = isActive ? 50 : 50 - Math.abs(diff);

            return (
              <motion.button
                key={type.id}
                onClick={() => setActiveTab(type.id)}
                whileTap={{ scale: 0.95 }}
                animate={{
                  scale,
                  opacity,
                  filter: brightness,
                  zIndex,
                  x: diff * 8, // Ultra-compact perspective
                }}
                transition={{ 
                  duration: 0.4, 
                  ease: "easeInOut"
                }}
                className={`snap-center shrink-0 w-16 h-24 flex flex-col items-center justify-center gap-1.5 relative rounded-[22px] border transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/90 backdrop-blur-md border-white shadow-[0_12px_30px_rgba(0,0,0,0.3)]' 
                    : 'bg-white/5 border-white/5'
                }`}
              >
                {/* Foreground Content */}
                <div className="relative z-10 flex flex-col items-center gap-1.5 w-full h-full p-1.5">
                  <div className={`w-full h-[70%] rounded-[16px] flex items-center justify-center overflow-hidden transition-colors ${
                    isActive ? 'bg-[#E8F5F0]' : 'bg-black/5'
                  }`}>
                    {scannedImage ? (
                      <img src={scannedImage} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#1A8765]' : 'text-white/60'}`} />
                    )}
                  </div>
                  <span className={`text-[6px] font-black text-center leading-tight uppercase tracking-[0.1em] transition-colors ${
                    isActive ? 'text-[#1A8765]' : 'text-white/40'
                  }`}>
                    {type.id === 'Website Page' ? 'Web' : type.id.split(' ')[0]}
                  </span>
                </div>

                {/* Priority Indicator */}
                {type.priority === 'priority' && !scannedImage && (
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isActive ? 'bg-amber-400' : 'bg-amber-400/50'} shadow-lg`} />
                )}
                {scannedImage && (
                  <div className="absolute top-2 right-2 bg-[#1A8765] rounded-full p-0.5 shadow-lg">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex justify-center items-center gap-10 mt-2 px-10 relative z-10">
          <div className="w-14 h-14" /> {/* Spacer */}

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleManualCapture}
            disabled={isScanning}
            className="relative w-20 h-20 rounded-full border-[5px] border-white/40 flex items-center justify-center p-1 group"
          >
            <div className="w-full h-full bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.4)] group-active:scale-95 transition-transform" />
            <div className="absolute inset-2 border-2 border-[#1A8765]/20 rounded-full" />
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleNext}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl font-bold text-xs transition-all ${
              frontCoverImage && backCoverImage 
                ? 'bg-white text-[#1A8765]' 
                : 'bg-white/20 text-white/40 cursor-not-allowed'
            }`}
          >
            NEXT
          </motion.button>
        </div>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
