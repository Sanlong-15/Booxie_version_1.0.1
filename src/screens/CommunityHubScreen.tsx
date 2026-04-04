import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Users, Heart, MessageCircle, Plus, X, Send } from 'lucide-react';
import { format } from 'date-fns';

const TABS = ['Discussions', 'Study Groups', 'Events'];

export default function CommunityHubScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Discussions');
  const [isComposing, setIsComposing] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'communityPosts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(p);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'communityPosts');
    });

    return () => unsubscribe();
  }, [user]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    const postText = text.trim();
    setText('');
    setIsComposing(false);

    try {
      await addDoc(collection(db, 'communityPosts'), {
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        content: postText,
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'communityPosts');
    }
  };

  return (
    <div className="flex flex-col h-full bg-booxie-bg font-sans relative">
      <div className="bg-white px-6 pt-6 pb-2 shadow-sm z-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Community Hub</h2>
        
        <div className="flex gap-6 overflow-x-auto no-scrollbar border-b border-gray-100">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold whitespace-nowrap transition-colors relative ${
                activeTab === tab ? 'text-booxie-green' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-booxie-green rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24">
        {posts.map(post => (
          <div key={post.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-booxie-green-light flex items-center justify-center text-booxie-green font-bold">
                {post.authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{post.authorName}</p>
                {post.createdAt && (
                  <p className="text-xs text-gray-400 font-medium">{format(post.createdAt.toDate(), 'MMM d, h:mm a')}</p>
                )}
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-4 leading-relaxed">{post.content}</p>
            <div className="flex items-center gap-6 text-gray-400 pt-3 border-t border-gray-50">
              <button className="flex items-center gap-1.5 text-xs font-bold hover:text-booxie-green transition-colors">
                <Heart className="w-4 h-4" />
                <span>{post.likesCount || 0}</span>
              </button>
              <button className="flex items-center gap-1.5 text-xs font-bold hover:text-booxie-green transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span>{post.commentsCount || 0}</span>
              </button>
            </div>
          </div>
        ))}
        
        {posts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No posts yet. Be the first to share!</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsComposing(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-booxie-green text-white rounded-full flex items-center justify-center shadow-lg shadow-booxie-green/30 hover:bg-booxie-green-dark transition-colors z-20"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Compose Modal */}
      {isComposing && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Create Post</h3>
              <button onClick={() => setIsComposing(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePost}>
              <textarea
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4 focus:outline-none focus:ring-2 focus:ring-booxie-green resize-none h-32"
              />
              <button 
                type="submit"
                disabled={!text.trim()}
                className="w-full bg-booxie-green text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-booxie-green/20"
              >
                <Send className="w-4 h-4" />
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
