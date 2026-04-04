import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Send, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PROMPT_CHIPS = [
  "Recommend a sci-fi book",
  "Books for CS101",
  "Study tips for finals"
];

export default function GeminiChatScreen() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{role: string, text: string}[]>([
    { role: 'model', text: 'Hi! I am the Booxie AI Assistant. I can help you find books, give study tips, or answer questions about the marketplace.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // We use a ref to store the chat instance so it persists across renders
  const chatRef = useRef<any>(null);

  useEffect(() => {
    chatRef.current = ai.chats.create({
      model: 'gemini-3.1-pro-preview',
      config: {
        systemInstruction: "You are the Booxie AI Assistant. Booxie is a marketplace for students to buy, sell, and donate second-hand books. Be helpful, concise, and friendly. You can help with study tips, book recommendations, and app usage."
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'An error occurred. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-booxie-bg font-sans">
      <div className="bg-white px-4 py-3 flex items-center gap-3 shadow-sm z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <div className="w-9 h-9 bg-gradient-to-br from-booxie-green to-teal-500 rounded-full flex items-center justify-center shadow-sm">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 leading-tight">Booxie AI</h2>
          <p className="text-xs text-booxie-green font-medium">Online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-8 h-8 bg-gradient-to-br from-booxie-green to-teal-500 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 mr-2 mt-1">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isUser ? 'bg-booxie-green text-white rounded-br-sm shadow-sm shadow-booxie-green/20' : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100'}`}>
                <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 bg-gradient-to-br from-booxie-green to-teal-500 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 mr-2 mt-1">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
              <Loader2 className="w-5 h-5 animate-spin text-booxie-green" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-100 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {messages.length === 1 && !isLoading && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3 border-b border-gray-50">
            {PROMPT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(undefined, chip)}
                className="whitespace-nowrap px-4 py-1.5 bg-booxie-green-light text-booxie-green text-sm font-medium rounded-full hover:bg-booxie-green hover:text-white transition-colors border border-booxie-green/20"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSend} className="p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-booxie-green focus:border-transparent transition-all text-sm"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 bg-booxie-green rounded-full flex items-center justify-center text-white disabled:opacity-50 shadow-md shadow-booxie-green/30 hover:bg-booxie-green-dark transition-colors"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
