import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Send, CheckCircle, MoreVertical, Phone, Video, Camera, Image as ImageIcon, Smile, Mic, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { getGeminiAI, callGeminiWithRetry } from '../lib/gemini';
import { ThinkingLevel } from '@google/genai';
import { isGeminiQuotaError, GEMINI_QUOTA_ERROR_MESSAGE } from '../lib/geminiErrors';

export default function ChatScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [text, setText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isAiChat = id === 'ai-help';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      await sendMessage(base64, 'image');
    };
    reader.readAsDataURL(file);
  };

  const handleMicClick = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      setRecordingTime(0);
      // Mock sending audio
      sendMessage('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'audio');
    } else {
      // Start recording
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

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '✅', '👋', '😊'];

  useEffect(() => {
    if (!id || !user) return;

    if (isAiChat) {
      setConversation({
        bookTitle: 'Booxie AI Help',
        isAi: true
      });
      setMessages([
        {
          id: 'welcome',
          senderId: 'ai',
          text: "Hi! I'm Booxie's AI assistant. How can I help you today? I can suggest similar books, give price recommendations, or answer FAQs.",
          createdAt: { toDate: () => new Date() }
        }
      ]);
      return;
    }

    const fetchConv = async () => {
      try {
        const docRef = doc(db, 'conversations', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConversation(docSnap.data());
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchConv();

    const q = query(
      collection(db, `conversations/${id}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `conversations/${id}/messages`);
    });

    return () => unsubscribe();
  }, [id, user, isAiChat]);

  const sendMessage = async (content: string, type: 'text' | 'image' | 'audio' = 'text') => {
    if (!id || !user) return;

    if (isAiChat) {
      const newUserMsg = {
        id: Date.now().toString(),
        senderId: user.uid,
        text: type === 'text' ? content : (type === 'image' ? 'Sent an image' : 'Sent an audio message'),
        imageUrl: type === 'image' ? content : undefined,
        audioUrl: type === 'audio' ? content : undefined,
        createdAt: { toDate: () => new Date() }
      };
      setMessages(prev => [...prev, newUserMsg]);
      setIsAiTyping(true);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      try {
        const ai = getGeminiAI();
        if (!ai) {
          const errorMsg = {
            id: (Date.now() + 1).toString(),
            senderId: 'ai',
            text: "I'm sorry, but the AI assistant is not configured yet. Please make sure the Gemini API key is set in the environment variables.",
            createdAt: { toDate: () => new Date() }
          };
          setMessages(prev => [...prev, errorMsg]);
          setIsAiTyping(false);
          return;
        }
        let aiContents: any = type === 'text' ? content : "User sent a media file.";
        
        if (type === 'image') {
           const base64Data = content.split(',')[1];
           const mimeType = content.split(';')[0].split(':')[1];
           aiContents = {
             parts: [
               { text: "What do you think about this image?" },
               { inlineData: { data: base64Data, mimeType } }
             ]
           };
        }

        const response = await callGeminiWithRetry(() => ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: aiContents,
          config: {
            systemInstruction: "You are Booxie AI Help, a friendly customer support chatbot for a second-hand book marketplace called Booxie. Keep your answers short, helpful, and friendly. You can suggest books, give price recommendations, and answer FAQs.",
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
          }
        }));
        
        const newAiMsg = {
          id: (Date.now() + 1).toString(),
          senderId: 'ai',
          text: response.text || "I'm sorry, I couldn't process that.",
          createdAt: { toDate: () => new Date() }
        };
        setMessages(prev => [...prev, newAiMsg]);
      } catch (error: any) {
        console.error("AI Error:", error);
        const errorText = isGeminiQuotaError(error) 
          ? GEMINI_QUOTA_ERROR_MESSAGE
          : "Sorry, I'm having trouble connecting right now.";

        const errorMsg = {
          id: (Date.now() + 1).toString(),
          senderId: 'ai',
          text: errorText,
          createdAt: { toDate: () => new Date() }
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsAiTyping(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      return;
    }

    try {
      await addDoc(collection(db, `conversations/${id}/messages`), {
        conversationId: id,
        senderId: user.uid,
        text: type === 'text' ? content : '',
        imageUrl: type === 'image' ? content : null,
        audioUrl: type === 'audio' ? content : null,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'conversations', id), {
        lastMessage: type === 'text' ? content : (type === 'image' ? '📷 Image' : '🎤 Voice message'),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `conversations/${id}/messages`);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const messageText = text.trim();
    setText('');
    await sendMessage(messageText, 'text');
  };

  const handleMarkAsSold = async () => {
    if (!conversation?.bookId) return;
    try {
      await updateDoc(doc(db, 'books', conversation.bookId), {
        status: 'sold'
      });
      alert('Book marked as sold!');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FCF9] font-sans">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/chat')} className="relative z-50 p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <div className="flex items-center gap-2">
            {isAiChat ? (
              <div className="w-10 h-10 bg-[#006A4E] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">🤖</span>
              </div>
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100&h=100" alt="Seller" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-1">
                {conversation?.bookTitle || 'Seller Name'}
                {isAiChat && <span className="text-[10px] text-[#006A4E] bg-[#E8F5F0] px-1.5 py-0.5 rounded font-bold">AI</span>}
              </h2>
              <p className="text-[10px] text-green-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                Active now
              </p>
            </div>
          </div>
        </div>
        
        {!isAiChat && (
          <div className="flex items-center gap-1">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
              <Video className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Book Context Banner */}
      {!isAiChat && conversation?.bookTitle && (
        <div className="bg-white border-b border-gray-100 p-3 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-14 bg-gray-100 rounded overflow-hidden">
               <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=100&h=150" alt="Book" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 line-clamp-1">{conversation.bookTitle}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] font-bold text-[#006A4E]">$10.00</p>
                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Available</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => navigate(`/book/${conversation.bookId}`)}
            className="text-[10px] font-bold text-[#006A4E] bg-[#E8F5F0] px-3 py-1.5 rounded-full"
          >
            View Book
          </button>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-center my-4">
          <span className="text-[10px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Today</span>
        </div>

        {messages.map(msg => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-[#006A4E] text-white rounded-br-sm shadow-sm' : 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm shadow-sm'}`}>
                {msg.imageUrl && (
                  <div className="mb-2 rounded-lg overflow-hidden">
                    <img src={msg.imageUrl} alt="Sent image" className="w-full h-auto max-h-48 object-cover" />
                  </div>
                )}
                {msg.audioUrl && (
                  <div className="mb-2 flex items-center gap-2 bg-black/10 rounded-full px-3 py-1.5">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-[#006A4E] border-b-[4px] border-b-transparent ml-0.5"></div>
                    </div>
                    <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-white rounded-full"></div>
                    </div>
                    <span className="text-[10px] font-medium">0:05</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{msg.text}</p>
                {msg.createdAt && (
                  <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                    <p className="text-[9px]">
                      {format(msg.createdAt.toDate(), 'h:mm a')}
                    </p>
                    {isMe && (
                      <CheckCheck className="w-3 h-3" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isAiTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-100 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col">
        
        {/* Quick Replies */}
        {messages.length === 0 && (
          <div className="flex gap-2 px-3 py-2 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setText("Is this still available?")}
              className="whitespace-nowrap text-xs text-[#006A4E] bg-[#E8F5F0] px-3 py-1.5 rounded-full font-medium"
            >
              Is this still available?
            </button>
            <button 
              onClick={() => setText("Can you lower the price?")}
              className="whitespace-nowrap text-xs text-[#006A4E] bg-[#E8F5F0] px-3 py-1.5 rounded-full font-medium"
            >
              Can you lower the price?
            </button>
          </div>
        )}

        <div className="p-3 flex items-center gap-2 relative w-full">
          {showEmojiPicker && (
            <div className="absolute bottom-full left-12 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex flex-wrap gap-2 w-64 max-w-[calc(100%-4rem)] z-10">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    setText(prev => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-xl hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
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

          <button 
            onClick={() => cameraInputRef.current?.click()}
            className="relative z-50 p-2 -ml-2 text-gray-400 hover:text-[#006A4E] transition-colors flex-shrink-0"
          >
            <Camera className="w-5 h-5" />
          </button>
          
          <form onSubmit={handleSend} className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-full px-2 py-1 min-w-0 overflow-hidden">
            <button 
              type="button" 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <Smile className="w-5 h-5" />
            </button>
            
            {isRecording ? (
              <div className="flex-1 flex items-center px-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2 flex-shrink-0"></div>
                <span className="text-sm text-red-500 font-medium truncate">{formatTime(recordingTime)}</span>
              </div>
            ) : (
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type message..."
                className="flex-1 bg-transparent border-none focus:outline-none px-2 text-sm min-w-0"
              />
            )}

            {!isRecording && (
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-gray-400 hover:text-gray-600 mr-1 flex-shrink-0"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            )}

            {text.trim() && !isRecording ? (
              <button 
                type="submit"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-[#006A4E] text-white flex-shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleMicClick}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${isRecording ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
