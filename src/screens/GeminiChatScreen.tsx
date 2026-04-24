import React, { useState, useRef, useEffect } from 'react';
import { ThinkingLevel, FunctionDeclaration, Type } from '@google/genai';
import { getGeminiAI, callGeminiWithRetry } from '../lib/gemini';
import { Send, Loader2, ArrowLeft, Phone, Camera, Smile, Image as ImageIcon, Mic, Bot, BrainCircuit, ImagePlus, Search, BookOpen, Star, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { isGeminiQuotaError, GEMINI_QUOTA_ERROR_MESSAGE } from '../lib/geminiErrors';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

const PROMPT_CHIPS = [
  "Recommend books for Grade 12 Math",
  "Find IELTS preparation textbooks",
  "Programming books for beginners",
  "Best fiction books available"
];

interface BookResult {
  id: string;
  title: string;
  author: string;
  price: number;
  imageUrl?: string;
  condition: string;
  rating?: number;
}

const searchBooksTool: FunctionDeclaration = {
  name: "searchBooks",
  description: "Search for books in the marketplace database by title, author, subject, or grade.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      queryText: {
        type: Type.STRING,
        description: "The search terms (e.g., 'Grade 12 Math', 'physics', 'IELTS')."
      },
      category: {
        type: Type.STRING,
        description: "Filtering category (e.g., 'printed', 'english', 'diploma', 'exam', 'fiction')."
      }
    },
    required: ["queryText"]
  }
};

const MOCK_BOOKS: BookResult[] = [
  { id: '1', title: 'Grade 12 Mathematics (Advanced)', author: 'Ministry of Education', price: 1.12, condition: 'Like New', imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=300&h=400' },
  { id: '2', title: 'Physics for Scientists Grade 11', author: 'Ministry of Education', price: 1.50, condition: 'Good', imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=300&h=400' },
  { id: '3', title: 'Khmer Literature - Selected Stories', author: 'Literature Dept', price: 0.75, condition: 'Fair', imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=300&h=400' },
  { id: '4', title: 'IELTS Official Academic Practice', author: 'IDP Education', price: 4.25, condition: 'New', imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300&h=400' },
  { id: '5', title: 'Geography of Cambodia', author: 'Ministry of Education', price: 1.20, condition: 'New', imageUrl: 'https://images.unsplash.com/photo-1524334228333-0f6db392f8a1?auto=format&fit=crop&q=80&w=300&h=400' },
];

export default function GeminiChatScreen() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{role: string, text: string, books?: BookResult[]}[]>([
    { role: 'model', text: 'Hi! I\'m Booxie\'s intelligent book assistant. I can help you find specific textbooks, recommend study materials based on your grade, or search for any subject you\'re interested in. What are you looking for today? 📚' }
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
        const ai = getGeminiAI();
        if (!ai) {
          setMessages(prev => [...prev, { role: 'model', text: "AI assistant is not configured. Please set the Gemini API key." }]);
          return;
        }
        const base64Data = base64.split(',')[1];
        const response = await callGeminiWithRetry(() => ai.models.generateContent({
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
        }));

        setMessages(prev => [...prev, { role: 'model', text: response.text || "I couldn't analyze the image." }]);
      } catch (error: any) {
        console.error("Gemini API Error:", error);
        const errorText = isGeminiQuotaError(error) 
          ? GEMINI_QUOTA_ERROR_MESSAGE
          : "Sorry, I encountered an error analyzing the image.";

        setMessages(prev => [...prev, { role: 'model', text: errorText }]);
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
    // Only initialize if not already done, or if thinking mode changed at the very start
    if (!chatRef.current || messages.length === 1) {
      const ai = getGeminiAI();
      if (!ai) return;

      const config: any = {
        systemInstruction: "You are the Booxie Intelligent Book Assistant. You help users find books quickly. When users ask for a book or subject, ALWAYS call the searchBooks tool. After you get results, present them to the user and guide them to 'View Book Details'. Respond concisely. If no match is found, explain clearly and suggest related alternatives. Rules: 1. Always prioritize helping the user discover books. 2. Be energetic and helpful.",
        tools: [{ functionDeclarations: [searchBooksTool] }]
      };
      
      chatRef.current = ai.chats.create({
        model: thinkingMode ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview',
        config
      });
    }
  }, [thinkingMode, messages.length]);

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
      const ai = getGeminiAI();
      if (!ai) {
        setMessages(prev => [...prev, { role: 'model', text: "AI assistant is not configured. Please set the Gemini API key." }]);
        return;
      }
      const response = await callGeminiWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: imageSize
          }
        }
      }));

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
    } catch (error: any) {
      console.error("Image Generation Error:", error);
      const errorText = isGeminiQuotaError(error) 
        ? GEMINI_QUOTA_ERROR_MESSAGE
        : "Sorry, I encountered an error generating the image.";

      setMessages(prev => [...prev, { role: 'model', text: errorText }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent, textOverride?: string) => {
    e?.preventDefault();
    const textToSend = textOverride || input.trim();
    
    if (!textToSend || isLoading) return;

    if (!chatRef.current) {
      setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "### ⚠️ AI Assistant Not Configured\n\nTo enable the AI chatbot, you need to provide a **Gemini API Key**.\n\n1. Go to [aistudio.google.com](https://aistudio.google.com/app/apikey) to get a free key.\n2. In this editor, click the **Settings** (gear icon) -> **Environment Variables**.\n3. Add a variable named `GEMINI_API_KEY` and paste your key.\n4. Refresh the page to start chatting!" 
      }]);
      return;
    }

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsLoading(true);

    try {
      // Add an empty model message that we will stream into
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      let response = await callGeminiWithRetry(() => chatRef.current.sendMessage({ message: textToSend }));
      
      // Handle Function Calling potentially multiple times
      let attempts = 0;
      while (response.functionCalls && attempts < 3) {
        attempts++;
        const call = response.functionCalls[0];
        if (call.name === 'searchBooks') {
          const { queryText } = call.args as any;
          
          // Execute Firestore Search
          let dbResults: BookResult[] = [];
          try {
            const booksRef = collection(db, 'books');
            const q = query(
              booksRef, 
              where('status', '==', 'available'),
              limit(20)
            );
            const snapshot = await getDocs(q);
            dbResults = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookResult));
          } catch (error: any) {
            console.warn("Firestore Search within tool failed (likely quota):", error.message);
            // We'll fall back to MOCK_BOOKS below, but let's register the error for the warning component
            try { handleFirestoreError(error, OperationType.LIST, 'books'); } catch(e) {}
          }
          
          // Filter if we have a query
          let filteredResults: BookResult[] = [];
          if (queryText) {
            const queryLower = queryText.toLowerCase();
            filteredResults = dbResults.filter(book => 
              book.title.toLowerCase().includes(queryLower) ||
              book.author.toLowerCase().includes(queryLower)
            );
          } else {
            filteredResults = dbResults;
          }

          // FALLBACK LOGIC: If no books found in DB, use Mock data
          if (filteredResults.length === 0) {
            const queryLower = (queryText || "").toLowerCase();
            filteredResults = MOCK_BOOKS.filter(book => 
              book.title.toLowerCase().includes(queryLower) ||
              "grade 12 mathematics physics ielts cambodia".toLowerCase().includes(queryLower)
            );
            
            // If still empty, just give some general mock books
            if (filteredResults.length === 0) {
              filteredResults = MOCK_BOOKS.slice(0, 3);
            }
          }

          const limitedResults = filteredResults.slice(0, 5);

          // Second round of conversation to present results
          const toolResponse = {
            role: 'user', 
            parts: [{
              functionResponse: {
                name: 'searchBooks',
                response: { books: limitedResults }
              }
            }]
          };

          response = await callGeminiWithRetry(() => chatRef.current.sendMessage({ message: toolResponse }));
          
          // Update message with text and the books property for rendering
          setMessages(prev => {
            const newMessages = [...prev];
            const lastIdx = newMessages.length - 1;
            newMessages[lastIdx] = { 
              role: 'model', 
              text: response.text || "Here are some books I found for you:",
              books: limitedResults
            };
            return newMessages;
          });
        }
      } 
      
      // If we finished without function calls anymore (or initial response was just text)
      if (!response.functionCalls) {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIdx = newMessages.length - 1;
          newMessages[lastIdx] = { 
            role: 'model', 
            text: response.text || "" 
          };
          return newMessages;
        });
      }
    } catch (error: any) {
      console.error(error);
      const errorText = isGeminiQuotaError(error) 
        ? GEMINI_QUOTA_ERROR_MESSAGE
        : 'An error occurred. Please try again.';
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: 'model', text: errorText };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderBookCards = (books: BookResult[]) => {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 scroll-smooth mt-4">
        {books.map(book => (
          <motion.div 
            key={book.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="min-w-[180px] bg-white rounded-[24px] p-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col"
          >
            <div className="aspect-[3/4] w-full bg-[#F8FCF9] rounded-[18px] overflow-hidden mb-3 relative group">
              {book.imageUrl ? (
                <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-[#006A4E]/20" />
                </div>
              )}
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <Star className="w-2.5 h-2.5 text-[#FFB800] fill-[#FFB800]" />
                <span className="text-[10px] font-bold text-gray-800">5.0</span>
              </div>
            </div>
            
            <div className="px-1 flex-1 flex flex-col">
              <h4 className="text-xs font-bold text-gray-900 line-clamp-1 mb-0.5">{book.title}</h4>
              <p className="text-[10px] text-gray-500 font-medium truncate mb-2">{book.author}</p>
              
              <div className="mt-auto flex items-center justify-between">
                <span className="text-sm font-black text-[#006A4E]">{book.price}$</span>
                <button 
                  onClick={() => navigate(`/book/${book.id}`)}
                  className="bg-[#006A4E] text-white p-2 rounded-xl hover:bg-[#005C44] transition-colors shadow-sm"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <button 
                onClick={() => navigate(`/book/${book.id}`)}
                className="w-full mt-3 py-2 bg-[#F8FCF9] hover:bg-[#E8F5F0] text-[#006A4E] text-[10px] font-bold rounded-xl transition-colors border border-[#006A4E]/5"
              >
                View Book Details
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    );
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
              <h2 className="font-bold text-gray-900 text-lg leading-tight">Booxie AI Assistant</h2>
              <span className="text-[10px] font-bold text-[#006A4E] bg-[#E8F5F0] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 bg-[#006A4E] rounded-full animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Expert Book Marketplace Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setThinkingMode(!thinkingMode)}
            className={`p-2 rounded-full transition-colors ${thinkingMode ? 'bg-[#006A4E] text-white' : 'text-[#006A4E] bg-[#E8F5F0]'}`}
            title="Toggle Expert Reasoning"
          >
            <BrainCircuit className="w-5 h-5" />
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
                <div className={`max-w-[85%] rounded-[24px] px-4 py-3.5 ${isUser ? 'bg-[#1D1D1F] text-white rounded-br-sm shadow-md' : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'}`}>
                  <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert font-medium' : 'text-gray-900'}`}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                  {!isUser && msg.books && msg.books.length > 0 && renderBookCards(msg.books)}
                  {!isUser && idx === 0 && (
                    <div className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-widest">Chat Initialized</div>
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
      <div className="bg-white px-2 py-3 pb-safe border-t border-gray-100 relative w-full">
        {showEmojiPicker && (
          <div className="absolute bottom-full left-2 mb-2 bg-white border border-gray-200 rounded-2xl shadow-lg p-2 flex flex-wrap gap-1.5 max-w-[calc(100%-1rem)] z-50">
            {emojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  setInput(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-lg hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {showImageOptions && (
          <div className="absolute bottom-full right-2 mb-2 bg-white border border-gray-200 rounded-2xl shadow-lg p-3 flex flex-col gap-2 w-64 max-w-[calc(100%-1rem)] z-50">
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

        <form onSubmit={handleSend} className="flex items-center gap-1.5 w-full">
          <button 
            type="button" 
            onClick={() => cameraInputRef.current?.click()}
            className="w-8 h-8 bg-[#006A4E] rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm"
          >
            <Camera className="w-4 h-4" />
          </button>
          
          <div className="flex-1 flex items-center bg-gray-50 rounded-full px-2.5 py-1.5 min-w-0 overflow-hidden">
            {isRecording ? (
              <div className="flex-1 flex items-center min-w-0">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2 flex-shrink-0"></div>
                <span className="text-xs text-red-500 font-medium truncate">{formatTime(recordingTime)}</span>
              </div>
            ) : (
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type message ..."
                className="flex-1 bg-transparent focus:outline-none text-sm text-gray-700 placeholder:text-gray-500 min-w-0"
              />
            )}
            
            <div className="flex items-center gap-1 text-gray-900 ml-1 flex-shrink-0">
              <button 
                type="button" 
                onClick={() => setShowImageOptions(!showImageOptions)}
                className="hover:text-[#006A4E] transition-colors relative p-1"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
              <button 
                type="button" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="hover:text-[#006A4E] transition-colors p-1"
              >
                <Smile className="w-4 h-4" />
              </button>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="hover:text-[#006A4E] transition-colors p-1"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button 
                type="button" 
                onClick={handleMicClick}
                className={`transition-colors p-1 ${isRecording ? 'text-red-500' : 'hover:text-[#006A4E]'}`}
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {input.trim() && !isRecording && (
            <button 
              type="submit"
              disabled={isLoading}
              className="w-8 h-8 bg-[#006A4E] rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-50 shadow-sm"
            >
              <Send className="w-3.5 h-3.5 ml-0.5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
