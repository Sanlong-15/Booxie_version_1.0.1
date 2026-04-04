import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Award, Gift, Star, BookHeart, Trophy, ChevronRight } from 'lucide-react';

export default function RewardsScreen() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="flex flex-col h-full bg-booxie-bg font-sans pb-24">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm z-10">
        <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>
      </header>

      <div className="p-6 overflow-y-auto">
        {/* Points Display */}
        <div className="bg-gradient-to-br from-booxie-green to-booxie-green-dark rounded-3xl p-6 text-white shadow-xl shadow-booxie-green/20 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-yellow-400 opacity-20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 shadow-inner">
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            </div>
            <p className="text-booxie-green-light font-medium mb-1">Total Points</p>
            <h3 className="text-5xl font-black mb-4 tracking-tight">{userData?.rewardPoints || 0}</h3>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium border border-white/20">
              Rank: <span className="text-yellow-400 font-bold">Bookworm</span>
            </div>
          </div>
        </div>

        {/* Badges / Leaderboard Teaser */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Leaderboard</h3>
              <p className="text-sm text-gray-500">See how you rank</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>

        {/* How to earn */}
        <h3 className="font-bold text-gray-900 mb-4 px-1">How to earn points</h3>
        <div className="space-y-3">
          <RewardCard 
            icon={<BookHeart className="w-6 h-6 text-booxie-green" />}
            title="Donate a Book"
            points="+20 pts"
            color="bg-booxie-green-light"
          />
          <RewardCard 
            icon={<Award className="w-6 h-6 text-blue-500" />}
            title="Sell a Book"
            points="+10 pts"
            color="bg-blue-50"
          />
          <RewardCard 
            icon={<Gift className="w-6 h-6 text-purple-500" />}
            title="Buy a Book"
            points="+5 pts"
            color="bg-purple-50"
          />
        </div>
      </div>
    </div>
  );
}

function RewardCard({ icon, title, points, color }: { icon: React.ReactNode, title: string, points: string, color: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-900">{title}</h4>
      </div>
      <div className="font-black text-yellow-500 bg-yellow-50 px-3 py-1 rounded-full text-sm">
        {points}
      </div>
    </div>
  );
}
