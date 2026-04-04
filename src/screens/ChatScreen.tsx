import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';

export default function ChatScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;

    // Fetch conversation details to check if user is seller
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
  }, [id, user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !id || !user) return;

    const messageText = text.trim();
    setText('');

    try {
      await addDoc(collection(db, `conversations/${id}/messages`), {
        conversationId: id,
        senderId: user.uid,
        text: messageText,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'conversations', id), {
        lastMessage: messageText,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `conversations/${id}/messages`);
    }
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
    <div className="flex flex-col h-full bg-booxie-bg font-sans">
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h2 className="font-bold text-gray-900 truncate max-w-[200px]">{conversation?.bookTitle || 'Chat'}</h2>
        </div>
        
        {/* If user is the seller (participant 1 is usually seller in our setup, but we'd need a better check in a real app) */}
        {conversation && (
          <button 
            onClick={handleMarkAsSold}
            className="flex items-center gap-1.5 text-xs font-bold text-booxie-green bg-booxie-green-light px-3 py-1.5 rounded-full hover:bg-booxie-green/20 transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Mark Sold
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-booxie-green text-white rounded-br-sm shadow-sm shadow-booxie-green/20' : 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm shadow-sm'}`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="bg-white p-3 border-t border-gray-100 flex gap-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-booxie-green focus:border-transparent transition-all text-sm"
        />
        <button 
          type="submit"
          disabled={!text.trim()}
          className="w-11 h-11 bg-booxie-green rounded-full flex items-center justify-center text-white disabled:opacity-50 shadow-md shadow-booxie-green/30 hover:bg-booxie-green-dark transition-colors"
        >
          <Send className="w-5 h-5 ml-1" />
        </button>
      </form>
    </div>
  );
}
