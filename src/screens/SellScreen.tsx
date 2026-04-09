import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { GoogleGenAI } from '@google/genai';
import { Loader2, X } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BankInvoiceIcon = () => (
  <svg width="24" height="32" viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
    <rect x="3" y="2" width="18" height="28" rx="2" />
    <line x1="7" y1="10" x2="17" y2="10" />
    <line x1="7" y1="16" x2="17" y2="16" />
    <line x1="7" y1="22" x2="13" y2="22" />
  </svg>
);

const FrontCoverIcon = () => (
  <svg width="24" height="32" viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
    <rect x="3" y="2" width="18" height="28" rx="2" />
    <line x1="7" y1="2" x2="7" y2="30" />
  </svg>
);

const BackCoverIcon = () => (
  <svg width="24" height="32" viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
    <rect x="3" y="2" width="18" height="28" rx="2" />
    <line x1="17" y1="2" x2="17" y2="30" />
  </svg>
);

export default function SellScreen() {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const isScanningRef = useRef(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Front Cover');
  const [frontCoverData, setFrontCoverData] = useState<any>(null);
  const [frontCoverImage, setFrontCoverImage] = useState<string | null>(null);
  const [backCoverImage, setBackCoverImage] = useState<string | null>(null);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);

  const captureAndAnalyze = useCallback(async (isManual = false) => {
    if (isScanningRef.current || !webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    isScanningRef.current = true;
    setIsScanning(true);
    if (isManual) setError('');
    
    const base64String = imageSrc.split(',')[1];
    
    try {
      if (activeTab === 'Front Cover') {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { text: 'Analyze this image. If there is a clear book cover, extract the book title and author. Then provide a brief description. Since this is a secondhand book, recommend a lower price between 3 and 9 USD. Return ONLY a valid JSON object with keys: "detected" (boolean), "title" (string), "author" (string), "description" (string), and "price" (number). If no clear book cover is found, return {"detected": false}. Do not include markdown formatting.' },
              { inlineData: { data: base64String, mimeType: 'image/jpeg' } }
            ]
          }
        });

        let text = response.text || '{}';
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const data = JSON.parse(text);
        
        if (data.detected || isManual) {
          setFrontCoverData(data);
          setFrontCoverImage(imageSrc);
          setActiveTab('Back Cover');
        } else if (isManual) {
           setError('No book cover detected. Please try again.');
        }
      } else if (activeTab === 'Back Cover') {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { text: 'Analyze this image. If it is a back cover of a book (often containing a barcode, blurb, or ISBN), return ONLY a valid JSON object with {"detected": true}. Otherwise return {"detected": false}. Do not include markdown formatting.' },
              { inlineData: { data: base64String, mimeType: 'image/jpeg' } }
            ]
          }
        });

        let text = response.text || '{}';
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const data = JSON.parse(text);
        
        if (data.detected || isManual) {
          setBackCoverImage(imageSrc);
          setAutoScanEnabled(false);
          
          navigate('/sell/edit', { 
            state: { 
              images: [frontCoverImage, imageSrc].filter(Boolean),
              frontCoverData 
            } 
          });
        } else if (isManual) {
           setError('No back cover detected. Please try again.');
        }
      }
    } catch (err: any) {
      console.error(err);
      const isQuotaError = 
        err?.status === 429 || 
        err?.status === 'RESOURCE_EXHAUSTED' ||
        err?.message?.includes('429') || 
        err?.message?.includes('quota') || 
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.error?.code === 429 ||
        err?.error?.status === 'RESOURCE_EXHAUSTED' ||
        JSON.stringify(err).includes('429') ||
        JSON.stringify(err).includes('RESOURCE_EXHAUSTED');

      if (isQuotaError) {
        setAutoScanEnabled(false);
        if (isManual) {
          // Fallback for manual capture when quota is exceeded
          if (activeTab === 'Front Cover') {
            setFrontCoverData({
              detected: true,
              title: 'Sample Book Title',
              author: 'Sample Author',
              description: 'This is a sample description because AI quota was exceeded.',
              price: 5.00
            });
            setFrontCoverImage(imageSrc);
            setActiveTab('Back Cover');
            setError('AI quota exceeded. Using sample data.');
          } else if (activeTab === 'Back Cover') {
            setBackCoverImage(imageSrc);
            navigate('/sell/edit', { 
              state: { 
                images: [frontCoverImage, imageSrc].filter(Boolean),
                frontCoverData 
              } 
            });
          }
        } else {
          setError('AI quota exceeded. Auto-scan disabled. Please use manual capture.');
        }
      } else if (isManual) {
        setError('Failed to scan. Please try again.');
      }
    } finally {
      isScanningRef.current = false;
      setIsScanning(false);
    }
  }, [activeTab, frontCoverData, frontCoverImage, navigate]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const runAutoScan = async () => {
      if (!autoScanEnabled || activeTab === 'Bank Invoice') {
        if (isMounted) timeoutId = setTimeout(runAutoScan, 1000);
        return;
      }

      await captureAndAnalyze();
      
      if (isMounted) {
        // Increase interval to 5 seconds to avoid quota issues
        timeoutId = setTimeout(runAutoScan, 5000);
      }
    };

    runAutoScan();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [autoScanEnabled, activeTab, captureAndAnalyze]);

  const handleManualCapture = () => {
    captureAndAnalyze(true);
  };

  const handleDone = () => {
    navigate('/');
  };

  return (
    <div className="fixed inset-0 bg-[#1A8765] z-50 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="pt-12 pb-4 px-6 flex justify-between items-center z-10">
        <div className="w-16"></div> {/* Spacer */}
        <button 
          onClick={handleDone}
          className="px-4 py-1.5 border border-white/50 rounded-lg text-white text-sm font-medium hover:bg-white/10 transition-colors"
        >
          Done
        </button>
      </div>

      {/* Top Message */}
      <div className="absolute top-24 left-0 right-0 flex justify-center z-20 pointer-events-none">
        {activeTab === 'Back Cover' && (
          <div className="bg-[#2A9D7A] text-white px-6 py-2 rounded-full shadow-lg font-medium text-sm animate-bounce">
            Front cover scanned! Now scan the back cover.
          </div>
        )}
      </div>

      {/* Camera Area */}
      <div className="flex-1 relative flex items-center justify-center px-6 min-h-0">
        <div className="relative w-full h-full max-h-[60vh] max-w-sm rounded-3xl overflow-hidden shadow-2xl">
          {activeTab === 'Back Cover' && backCoverImage ? (
            <img src={backCoverImage} alt="Back Cover" className="w-full h-full object-cover" />
          ) : activeTab === 'Front Cover' && frontCoverImage ? (
            <img src={frontCoverImage} alt="Front Cover" className="w-full h-full object-cover" />
          ) : (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Scanning Overlay */}
          <div className="absolute inset-0 border-4 border-white/30 rounded-3xl pointer-events-none">
            {/* Corner brackets */}
            <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-2xl"></div>
            <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-2xl"></div>
            <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-2xl"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-2xl"></div>
          </div>

          {isScanning && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1.5 rounded-full flex items-center gap-2 text-sm backdrop-blur-md">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Auto-scanning {activeTab.toLowerCase()}...</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="absolute top-32 left-6 right-6 bg-red-500 text-white p-3 rounded-xl text-sm font-medium text-center shadow-lg z-20">
          {error}
          <button onClick={() => setError('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="pb-8 pt-4 px-4 z-10 shrink-0 relative overflow-hidden">
        {/* Arc Background/Container for Buttons */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[150%] h-[200px] rounded-[50%] border-t border-white/10 pointer-events-none"></div>
        
        {/* Scan Options */}
        <div className="flex gap-2 pb-8 justify-center relative z-10 h-32 items-end">
          {['Bank Invoice', 'Front Cover', 'Back Cover'].map((tab, index) => {
            // Calculate rotation for arc effect
            const rotation = index === 0 ? '-rotate-12 translate-y-2' : index === 2 ? 'rotate-12 translate-y-2' : '-translate-y-2';
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative shrink-0 w-[100px] h-[110px] transition-all flex flex-col items-center justify-center gap-2 transform ${rotation} ${
                  activeTab === tab 
                    ? 'text-white scale-105 z-20' 
                    : 'text-white/70 hover:text-white z-10'
                }`}
              >
                {/* Quadrilateral Shape Background */}
                <div className={`absolute inset-0 rounded-2xl border transition-colors ${
                  activeTab === tab ? 'bg-[#2A9D7A] border-white/40 shadow-lg' : 'bg-[#1A8765] border-white/20'
                }`} style={{ transform: 'perspective(100px) rotateX(-5deg)', transformOrigin: 'bottom' }}></div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  {tab === 'Bank Invoice' && <BankInvoiceIcon />}
                  {tab === 'Front Cover' && <FrontCoverIcon />}
                  {tab === 'Back Cover' && <BackCoverIcon />}
                  <span className="text-[10px] font-medium whitespace-nowrap">{tab}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Capture Area */}
        <div className="flex justify-center items-center mt-2 mb-4 relative">
          {/* Squircle Edit Button */}
          <div className="absolute left-8">
            <button 
              onClick={() => navigate('/sell/edit', { 
                state: { 
                  images: [frontCoverImage, backCoverImage].filter(Boolean),
                  frontCoverData 
                } 
              })}
              className="w-14 h-14 bg-[#2A9D7A] border border-white/30 text-white shadow-lg flex items-center justify-center overflow-hidden hover:bg-[#32B38B] transition-colors"
              style={{ borderRadius: '18px' }} // Squircle approximation
            >
              {frontCoverImage ? (
                <img src={frontCoverImage} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              )}
            </button>
          </div>

          {/* Capture Button */}
          <button 
            onClick={handleManualCapture}
            disabled={isScanning}
            className="w-20 h-20 rounded-full border-[3px] border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100 bg-transparent p-1 z-10"
          >
            <div className="w-full h-full bg-white rounded-full shadow-lg"></div>
          </button>
        </div>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
