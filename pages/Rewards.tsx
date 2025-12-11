
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { dbService } from '../services/dbService';
import { User, Mission, Reward } from '../types';
import { Gift, CheckCircle, Circle, Trophy, Star, Sparkles, Lock, ShoppingBag, Sunrise, Moon, Activity, Utensils, Droplet } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
    'Sunrise': Sunrise,
    'Moon': Moon,
    'Activity': Activity,
    'Utensils': Utensils,
    'Droplet': Droplet
};

export const Rewards = () => {
    const { user, selectedChildId } = useAuth();
    const targetId = selectedChildId || user?.id;

    const [userData, setUserData] = useState<User | null>(null);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [activeTab, setActiveTab] = useState<'MISSIONS' | 'SHOP'>('MISSIONS');
    
    // Animation State
    const [animatingPoints, setAnimatingPoints] = useState<number | null>(null);

    useEffect(() => {
        if (targetId) {
            loadData();
        }
    }, [targetId, user]);

    const loadData = () => {
        if (!targetId) return;
        
        // 1. Get User Points
        const allUsers = dbService.getChildrenByParent(user?.id || '').concat(user ? [user] : []);
        const found = allUsers.find(u => u.id === targetId);
        setUserData(found || null);

        // 2. Get Missions & Rewards
        // In a real app, missions would have a user-specific status in DB. 
        // Here we simulate checking if done today via local state or simple logic
        const rawMissions = dbService.getMissions();
        
        // Check if stored in local storage for "today"
        const todayKey = `completed_missions_${targetId}_${new Date().toDateString()}`;
        const completedIds: string[] = JSON.parse(localStorage.getItem(todayKey) || '[]');
        
        const processedMissions = rawMissions.map(m => ({
            ...m,
            isCompletedToday: completedIds.includes(m.id)
        }));
        
        setMissions(processedMissions);
        setRewards(dbService.getRewards(targetId));
    };

    const handleCompleteMission = (mission: Mission) => {
        if (mission.isCompletedToday || !targetId) return;

        // 1. Add Points
        dbService.addPoints(targetId, mission.points);
        
        // 2. Mark Local State Complete
        const todayKey = `completed_missions_${targetId}_${new Date().toDateString()}`;
        const completedIds: string[] = JSON.parse(localStorage.getItem(todayKey) || '[]');
        completedIds.push(mission.id);
        localStorage.setItem(todayKey, JSON.stringify(completedIds));

        // 3. UI Update
        setAnimatingPoints(mission.points);
        setTimeout(() => setAnimatingPoints(null), 2000);
        loadData();
    };

    const handleRedeemReward = (reward: Reward) => {
        if (!targetId || !userData) return;
        
        const currentPoints = userData.points || 0;
        if (currentPoints < reward.cost) {
            alert("عفواً، ليس لديك نقاط كافية لهذه المكافأة!");
            return;
        }

        if (window.confirm(`هل تريد استبدال ${reward.cost} نقطة للحصول على "${reward.title}"؟`)) {
            const success = dbService.redeemReward(targetId, reward.id);
            if (success) {
                alert("مبروك! تم الحصول على المكافأة 🎉");
                loadData();
            }
        }
    };

    // Calculate Progress Level
    const currentPoints = userData?.points || 0;
    const level = Math.floor(currentPoints / 500) + 1;
    const nextLevelPoints = level * 500;
    const progress = Math.min(100, (currentPoints % 500) / 500 * 100);

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            
            {/* Header: Points & Level */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <h2 className="text-xl font-bold text-amber-50 mb-1">رصيدك الحالي</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-5xl font-bold font-mono">{currentPoints}</span>
                            <Star className="fill-white text-white animate-pulse" size={32} />
                        </div>
                    </div>
                    
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl border border-white/30 text-center min-w-[100px]">
                        <Trophy size={32} className="mx-auto mb-1 text-yellow-200" />
                        <span className="block text-xs font-bold text-amber-50">المستوى</span>
                        <span className="block text-2xl font-bold">{level}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                    <div className="flex justify-between text-xs font-bold text-amber-50 mb-1">
                        <span>مبتدئ</span>
                        <span>بطل خارق ({nextLevelPoints})</span>
                    </div>
                    <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                {/* Floating Animation */}
                {animatingPoints && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-yellow-100 animate-bounce drop-shadow-lg">
                        +{animatingPoints} ✨
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                <button 
                    onClick={() => setActiveTab('MISSIONS')}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${activeTab === 'MISSIONS' ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <CheckCircle size={18} /> المهام اليومية
                </button>
                <button 
                    onClick={() => setActiveTab('SHOP')}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${activeTab === 'SHOP' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <ShoppingBag size={18} /> متجر الهدايا
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'MISSIONS' ? (
                <div className="space-y-3">
                    <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <Sparkles className="text-amber-500" size={20}/> مهامك اليوم
                    </h3>
                    {missions.map(mission => {
                        const Icon = ICON_MAP[mission.icon] || Star;
                        return (
                            <div 
                                key={mission.id} 
                                onClick={() => handleCompleteMission(mission)}
                                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer relative overflow-hidden
                                    ${mission.isCompletedToday 
                                        ? 'bg-emerald-50 border-emerald-200 opacity-80' 
                                        : 'bg-white border-slate-100 hover:border-amber-300 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`p-3 rounded-full ${mission.isCompletedToday ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-lg ${mission.isCompletedToday ? 'text-emerald-800 line-through' : 'text-slate-800'}`}>
                                            {mission.title}
                                        </h4>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${mission.isCompletedToday ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-700'}`}>
                                            {mission.points} نقطة
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="relative z-10">
                                    {mission.isCompletedToday ? (
                                        <CheckCircle size={32} className="text-emerald-500 fill-emerald-100" />
                                    ) : (
                                        <Circle size={32} className="text-slate-300 hover:text-amber-400" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {rewards.map(reward => {
                        const canAfford = (userData?.points || 0) >= reward.cost;
                        return (
                            <div key={reward.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-lg transition">
                                <div className="h-32 bg-slate-50 relative flex items-center justify-center p-4">
                                    <img src={reward.image} alt={reward.title} className="max-h-full max-w-full drop-shadow-sm group-hover:scale-110 transition-transform duration-300" />
                                    <span className="absolute top-2 right-2 bg-white/80 backdrop-blur text-slate-700 text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
                                        {reward.cost} 🌟
                                    </span>
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                    <h4 className="font-bold text-slate-800 mb-1">{reward.title}</h4>
                                    <button 
                                        onClick={() => handleRedeemReward(reward)}
                                        disabled={!canAfford}
                                        className={`mt-auto w-full py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition
                                            ${canAfford 
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md' 
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {canAfford ? <Gift size={16} /> : <Lock size={16} />}
                                        {canAfford ? 'استبدال' : 'نقاط غير كافية'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
