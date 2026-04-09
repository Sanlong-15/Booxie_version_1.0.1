import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { Send, Loader2, ArrowLeft, Phone, Camera, Smile, Image as ImageIcon, Mic, Bot, BrainCircuit, ImagePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PROMPT_CHIPS = [
  "Please recommend a book for computer science.",
  "Find textbooks under $30",
  "How do I donate books?",
  "Track my order"
];

export default function GeminiChatScreen() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{role: string, text: string}[]>([
    { role: 'model', text: 'Hi! I\'m Booxie\'s AI assistant. I can help you find books, request books based on your preferences, or answer questions about our platform. What can I help you with today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // We use a ref to store the chat instance so it persists across renders
  const chatRef = useRef<any>(null);

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '✅', '👋', '😊'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setMessages(prev => [...prev, { role: 'user', text: "Uploaded an image" }]);
      setIsLoading(true);

      try {
        const base64Data = base64.split(',')[1];
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            {
              role: 'user',
              parts: [
                { text: "Analyze this image in the context of a secondhand book marketplace." },
                { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
              ]
            }
          ]
        });

        setMessages(prev => [...prev, { role: 'model', text: response.text || "I couldn't analyze the image." }]);
      } catch (error) {
        console.error("Gemini API Error:", error);
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error analyzing the image." }]);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      setRecordingTime(0);
      setInput(prev => prev + " [Audio message recorded]");
    } else {
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const config: any = {
      systemInstruction: "You are the Booxie AI Assistant. Booxie is a marketplace for students to buy, sell, and donate second-hand books. Be helpful, concise, and friendly. You can help with study tips, book recommendations, and app usage."
    };
    
    if (thinkingMode) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    chatRef.current = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config
    });
  }, [thinkingMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGenerateImage = async (prompt: string) => {
    if (!prompt || isLoading) return;
    
    setInput('');
    setShowImageOptions(false);
    setMessages(prev => [...prev, { role: 'user', text: `Generate image: ${prompt} (${imageSize})` }]);
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: imageSize
          }
        }
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setMessages(prev => [...prev, { role: 'model', text: `![Generated Image](${imageUrl})` }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, I couldn't generate the image." }]);
      }
    } catch (error) {
      console.error("Image Generation Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error generating the image." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent, textOverride?: string) => {
    e?.preventDefault();
    const textToSend = textOverride || input.trim();
    
    if (!textToSend || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: textToSend });
      setMessages(prev => [...prev, { role: 'model', text: response.text || 'Sorry, I could not process that.' }]);
    } catch (error: any) {
      console.error(error);
      let errorText = 'An error occurred. Please try again.';
      
      const isQuotaError = 
        error?.status === 429 || 
        error?.status === 'RESOURCE_EXHAUSTED' ||
        error?.message?.includes('429') || 
        error?.message?.includes('quota') || 
        error?.message?.includes('RESOURCE_EXHAUSTED') ||
        error?.error?.code === 429 ||
        error?.error?.status === 'RESOURCE_EXHAUSTED' ||
        JSON.stringify(error).includes('429') ||
        JSON.stringify(error).includes('RESOURCE_EXHAUSTED');

      if (isQuotaError) {
        errorText = "I'm currently experiencing high traffic and my quota is exceeded. Please try again later.";
      }
      setMessages(prev => [...prev, { role: 'model', text: errorText }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FCF9] font-sans">
      {/* Header */}
      <div className="bg-[#F8FCF9] px-4 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1 -ml-1 text-[#006A4E]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="w-12 h-12 bg-[#006A4E] rounded-full flex items-center justify-center overflow-hidden shrink-0">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-gray-900 text-lg leading-tight">Booxie AI Help</h2>
              <span className="text-[10px] font-bold text-[#006A4E] bg-[#E8F5F0] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 bg-[#006A4E] rounded-full animate-pulse"></span>
                AI
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Powered by AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setThinkingMode(!thinkingMode)}
            className={`p-2 rounded-full transition-colors ${thinkingMode ? 'bg-[#006A4E] text-white' : 'text-[#006A4E] bg-[#E8F5F0]'}`}
            title="Toggle High Thinking Mode"
          >
            <BrainCircuit className="w-5 h-5" />
          </button>
          <button className="p-2 text-[#006A4E]">
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        <div className="flex-1 space-y-6">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-8 h-8 bg-[#006A4E] rounded-full flex items-center justify-center flex-shrink-0 mr-3 mt-1 overflow-hidden">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser ? 'bg-[#006A4E] text-white rounded-br-sm shadow-sm' : 'bg-[#F0F2F5] text-gray-800 rounded-bl-sm shadow-sm'}`}>
                  <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                  {!isUser && idx === 0 && (
                    <div className="text-[9px] text-gray-400 mt-2">10:36 PM</div>
                  )}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-[#006A4E] rounded-full flex items-center justify-center flex-shrink-0 mr-3 mt-1 overflow-hidden">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-[#F0F2F5] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <Loader2 className="w-5 h-5 animate-spin text-[#006A4E]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length === 1 && !isLoading && (
          <div className="flex flex-col gap-3 mt-8 mb-2 items-end">
            {PROMPT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(undefined, chip)}
                className="px-5 py-3 bg-white text-gray-700 text-xs font-medium rounded-full border border-[#006A4E] hover:bg-[#E8F5F0] transition-colors text-left max-w-[85%] shadow-sm"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white px-4 py-3 pb-safe border-t border-gray-100 relative">
        {showEmojiPicker && (
          <div className="absolute bottom-full left-4 mb-2 bg-white border border-gray-200 rounded-2xl shadow-lg p-2 flex gap-2">
            {emojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  setInput(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-xl hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {showImageOptions && (
          <div className="absolute bottom-full right-4 mb-2 bg-white border border-gray-200 rounded-2xl shadow-lg p-3 flex flex-col gap-2 w-64 z-50">
            <h3 className="text-xs font-bold text-gray-700 mb-1">Generate Image</h3>
            <div className="flex gap-2 mb-2">
              {(['1K', '2K', '4K'] as const).map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setImageSize(size)}
                  className={`flex-1 text-xs py-1 rounded-md transition-colors ${imageSize === size ? 'bg-[#006A4E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {size}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleGenerateImage(input)}
              disabled={!input.trim() || isLoading}
              className="w-full bg-[#006A4E] text-white text-xs font-bold py-2 rounded-lg disabled:opacity-50"
            >
              Generate
            </button>
          </div>
        )}

        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={cameraInputRef} 
          onChange={handleImageUpload} 
        />
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
        />

        <form onSubmit={handleSend} className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => cameraInputRef.current?.click()}
            className="w-10 h-10 bg-[#006A4E] rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm"
          >
            <Camera className="w-5 h-5" />
          </button>
          
          <div className="flex-1 flex items-center bg-gray-50 rounded-full px-4 py-2.5">
            {isRecording ? (
              <div className="flex-1 flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
                <span className="text-sm text-red-500 font-medium">{formatTime(recordingTime)}</span>
              </div>
            ) : (
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type message ..."
                className="flex-1 bg-transparent focus:outline-none text-sm text-gray-700 placeholder:text-gray-500"
              />
            )}
            
            <div className="flex items-center gap-3 text-gray-900 ml-2">
              <button 
                type="button" 
                onClick={() => setShowImageOptions(!showImageOptions)}
                className="hover:text-[#006A4E] transition-colors relative"
              >
                <ImagePlus className="w-5 h-5" />
              </button>
              <button 
                type="button" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="hover:text-[#006A4E] transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="hover:text-[#006A4E] transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button 
                type="button" 
                onClick={handleMicClick}
                className={`transition-colors ${isRecording ? 'text-red-500' : 'hover:text-[#006A4E]'}`}
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {input.trim() && !isRecording && (
            <button 
              type="submit"
              disabled={isLoading}
              className="w-10 h-10 bg-[#006A4E] rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-50 shadow-sm"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
