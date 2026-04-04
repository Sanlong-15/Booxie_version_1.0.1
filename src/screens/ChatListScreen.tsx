import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Conversation {
  id: string;
  bookTitle?: string;
  lastMessage?: string;
  updatedAt?: any;
  participants: string[];
}

export default function ChatListScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conversation[];
      
      convs.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis?.() || 0;
        const timeB = b.updatedAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setConversations(convs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'conversations');
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="flex flex-col h-full bg-booxie-bg font-sans">
      <header className="px-6 pt-6 pb-4 flex items-center gap-4 bg-white shadow-sm z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {conversations.map(conv => (
          <div 
            key={conv.id}
            onClick={() => navigate(`/chat/${conv.id}`)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center cursor-pointer hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 bg-booxie-green-light rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-booxie-green" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{conv.bookTitle || 'Unknown Book'}</h3>
              <p className="text-sm text-gray-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
            </div>
            {conv.updatedAt && (
              <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
                {format(conv.updatedAt.toDate(), 'MMM d')}
              </span>
            )}
          </div>
        ))}

        {conversations.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No messages yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
