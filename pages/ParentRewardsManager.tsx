
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { dbService } from '../services/dbService';
import { User, Mission, Reward } from '../types';
import { 
    Trophy, Gift, CheckCircle, Plus, Edit, Trash2, 
    Star, Save, X, Activity, Image as ImageIcon,
    Sunrise, Moon, Utensils, Droplet, Wallet, PlusCircle, MinusCircle
} from 'lucide-react';

const ICONS = ['Activity', 'Sunrise', 'Moon', 'Utensils', 'Droplet', 'Star', 'Gift'];

export const ParentRewardsManager = () => {
    const { user } = useAuth();
    const [children, setChildren] = useState<User[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'POINTS' | 'REWARDS' | 'MISSIONS'>('POINTS');

    // Data State
    const [missions, setMissions] = useState<Mission[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [selectedChild, setSelectedChild] = useState<User | null>(null);

    // Forms State
    const [pointsChange, setPointsChange] = useState<number | ''>('');
    const [pointsReason, setPointsReason] = useState('');
    
    // Reward Form
    const [editingReward, setEditingReward] = useState<Reward | null>(null);
    const [rewardForm, setRewardForm] = useState({ title: '', cost: '', image: '' });
    const [showRewardForm, setShowRewardForm] = useState(false);

    // Mission Form
    const [editingMission, setEditingMission] = useState<Mission | null>(null);
    const [missionForm, setMissionForm] = useState({ title: '', points: '', icon: 'Star' });
    const [showMissionForm, setShowMissionForm] = useState(false);

    useEffect(() => {
        if (user) {
            const kids = dbService.getChildrenByParent(user.id);
            setChildren(kids);
            if (kids.length > 0 && !selectedChildId) {
                setSelectedChildId(kids[0].id);
            }
            loadData();
        }
    }, [user]);

    useEffect(() => {
        if (selectedChildId) {
            const child = children.find(c => c.id === selectedChildId) || null;
            setSelectedChild(child);
        }
    }, [selectedChildId, children]);

    const loadData = () => {
        setMissions(dbService.getMissions());
        setRewards(dbService.getRewards());
    };

    // --- POINTS HANDLERS ---
    const handleAddPoints = (isAddition: boolean) => {
        if (!selectedChildId || !pointsChange) return;
        const amount = Number(pointsChange) * (isAddition ? 1 : -1);
        
        dbService.addPoints(selectedChildId, amount);
        
        // Refresh Child Data
        const updatedKids = dbService.getChildrenByParent(user!.id);
        setChildren(updatedKids);
        
        setPointsChange('');
        setPointsReason('');
        alert(`تم ${isAddition ? 'إضافة' : 'خصم'} النقاط بنجاح!`);
    };

    // --- REWARD HANDLERS ---
    const openRewardForm = (reward?: Reward) => {
        if (reward) {
            setEditingReward(reward);
            setRewardForm({ title: reward.title, cost: reward.cost.toString(), image: reward.image || '' });
        } else {
            setEditingReward(null);
            setRewardForm({ title: '', cost: '', image: '' });
        }
        setShowRewardForm(true);
    };

    const handleSaveReward = (e: React.FormEvent) => {
        e.preventDefault();
        const cost = Number(rewardForm.cost);
        if (!rewardForm.title || isNaN(cost)) return;

        const rewardData: Reward = {
            id: editingReward ? editingReward.id : Date.now().toString(),
            title: rewardForm.title,
            cost: cost,
            image: rewardForm.image || 'https://via.placeholder.com/150?text=Reward',
            isRedeemed: false
        };

        if (editingReward) {
            dbService.updateReward(rewardData);
        } else {
            dbService.addReward(rewardData);
        }
        loadData();
        setShowRewardForm(false);
    };

    const handleDeleteReward = (id: string) => {
        if (window.confirm("هل أنت متأكد من حذف هذه المكافأة؟")) {
            dbService.deleteReward(id);
            loadData();
        }
    };

    // --- MISSION HANDLERS ---
    const openMissionForm = (mission?: Mission) => {
        if (mission) {
            setEditingMission(mission);
            setMissionForm({ title: mission.title, points: mission.points.toString(), icon: mission.icon });
        } else {
            setEditingMission(null);
            setMissionForm({ title: '', points: '', icon: 'Star' });
        }
        setShowMissionForm(true);
    };

    const handleSaveMission = (e: React.FormEvent) => {
        e.preventDefault();
        const points = Number(missionForm.points);
        if (!missionForm.title || isNaN(points)) return;

        const missionData: Mission = {
            id: editingMission ? editingMission.id : Date.now().toString(),
            title: missionForm.title,
            points: points,
            icon: missionForm.icon,
            type: 'DAILY',
            isCompletedToday: false
        };

        if (editingMission) {
            dbService.updateMission(missionData);
        } else {
            dbService.addMission(missionData);
        }
        loadData();
        setShowMissionForm(false);
    };

    const handleDeleteMission = (id: string) => {
        if (window.confirm("هل أنت متأكد من حذف هذه المهمة؟")) {
            dbService.deleteMission(id);
            loadData();
        }
    };

    if (children.length === 0) return <div className="p-8 text-center">لا يوجد أطفال مسجلين بعد.</div>;

    return (
        <div className="space-y-6 pb-20 animate-fadeIn">
            
            {/* Header: Child Select */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Trophy className="text-amber-500" /> إدارة نظام التحفيز
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">تحكم في النقاط والمهام والمكافآت لتشجيع طفلك.</p>
                </div>
                
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-sm font-bold text-slate-500">الطفل:</span>
                    <select 
                        value={selectedChildId}
                        onChange={e => setSelectedChildId(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg p-2 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-400"
                    >
                        {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
                        <Star size={14} className="fill-amber-600"/>
                        {selectedChild?.points || 0}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('POINTS')}
                    className={`px-6 py-3 font-bold text-sm transition border-b-2 flex items-center gap-2 ${activeTab === 'POINTS' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Wallet size={18}/> إدارة النقاط
                </button>
                <button 
                    onClick={() => setActiveTab('REWARDS')}
                    className={`px-6 py-3 font-bold text-sm transition border-b-2 flex items-center gap-2 ${activeTab === 'REWARDS' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Gift size={18}/> المكافآت
                </button>
                <button 
                    onClick={() => setActiveTab('MISSIONS')}
                    className={`px-6 py-3 font-bold text-sm transition border-b-2 flex items-center gap-2 ${activeTab === 'MISSIONS' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <CheckCircle size={18}/> المهام اليومية
                </button>
            </div>

            {/* --- TAB 1: POINTS MANAGEMENT --- */}
            {activeTab === 'POINTS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <PlusCircle className="text-amber-500"/> تعديل رصيد النقاط
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">عدد النقاط</label>
                                <input 
                                    type="number" 
                                    value={pointsChange} 
                                    onChange={e => setPointsChange(Number(e.target.value))}
                                    className="w-full p-3 border border-slate-300 rounded-xl text-center text-xl font-bold outline-none focus:border-amber-400"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">السبب (اختياري)</label>
                                <input 
                                    type="text" 
                                    value={pointsReason} 
                                    onChange={e => setPointsReason(e.target.value)}
                                    className="w-full p-3 border border-slate-300 rounded-xl text-sm"
                                    placeholder="مثال: تفوق دراسي، مساعدة في المنزل..."
                                />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button 
                                    onClick={() => handleAddPoints(true)}
                                    disabled={!pointsChange}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <PlusCircle size={20} /> إضافة
                                </button>
                                <button 
                                    onClick={() => handleAddPoints(false)}
                                    disabled={!pointsChange}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <MinusCircle size={20} /> خصم
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex flex-col items-center justify-center text-center">
                        <Trophy size={64} className="text-amber-400 mb-4 drop-shadow-md" />
                        <h3 className="text-2xl font-bold text-amber-800 mb-1">الرصيد الحالي</h3>
                        <p className="text-5xl font-mono font-bold text-amber-600 my-4">{selectedChild?.points || 0}</p>
                        <p className="text-sm text-amber-700/80">يمكن للطفل استبدال هذه النقاط بمكافآت من المتجر</p>
                    </div>
                </div>
            )}

            {/* --- TAB 2: REWARDS MANAGEMENT --- */}
            {activeTab === 'REWARDS' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button 
                            onClick={() => openRewardForm()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition flex items-center gap-2"
                        >
                            <Plus size={20} /> إضافة مكافأة جديدة
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rewards.map(reward => (
                            <div key={reward.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm group hover:shadow-md transition">
                                <div className="h-40 bg-slate-50 relative flex items-center justify-center p-4">
                                    <img src={reward.image} alt={reward.title} className="max-h-full max-w-full object-contain" />
                                    <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                                        {reward.cost} نقطة
                                    </div>
                                </div>
                                <div className="p-4 flex justify-between items-center">
                                    <h4 className="font-bold text-slate-800">{reward.title}</h4>
                                    <div className="flex gap-2">
                                        <button onClick={() => openRewardForm(reward)} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteReward(reward.id)} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-red-50 hover:text-red-600 transition">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Reward Modal */}
                    {showRewardForm && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Gift className="text-indigo-600"/> {editingReward ? 'تعديل المكافأة' : 'إضافة مكافأة'}
                                </h3>
                                <form onSubmit={handleSaveReward} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-1">اسم المكافأة</label>
                                        <input type="text" required value={rewardForm.title} onChange={e => setRewardForm({...rewardForm, title: e.target.value})} className="w-full border rounded-lg p-2" placeholder="مثال: لعبة جديدة" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-1">التكلفة (نقطة)</label>
                                        <input type="number" required value={rewardForm.cost} onChange={e => setRewardForm({...rewardForm, cost: e.target.value})} className="w-full border rounded-lg p-2" placeholder="100" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-1">رابط الصورة (URL)</label>
                                        <div className="relative">
                                            <ImageIcon size={18} className="absolute right-3 top-2.5 text-slate-400" />
                                            <input type="url" value={rewardForm.image} onChange={e => setRewardForm({...rewardForm, image: e.target.value})} className="w-full border rounded-lg p-2 pr-10" placeholder="https://..." />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700">حفظ</button>
                                        <button type="button" onClick={() => setShowRewardForm(false)} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg font-bold hover:bg-slate-300">إلغاء</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- TAB 3: MISSIONS MANAGEMENT --- */}
            {activeTab === 'MISSIONS' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button 
                            onClick={() => openMissionForm()}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-emerald-700 transition flex items-center gap-2"
                        >
                            <Plus size={20} /> إضافة مهمة جديدة
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-right">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                                <tr>
                                    <th className="p-4">المهمة</th>
                                    <th className="p-4">النقاط</th>
                                    <th className="p-4">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {missions.map(mission => (
                                    <tr key={mission.id} className="hover:bg-slate-50 transition">
                                        <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                                            <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                                                <Star size={16} />
                                            </div>
                                            {mission.title}
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                                                {mission.points} نقطة
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => openMissionForm(mission)} className="text-slate-400 hover:text-indigo-600">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDeleteMission(mission.id)} className="text-slate-400 hover:text-red-600">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mission Modal */}
                    {showMissionForm && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <CheckCircle className="text-emerald-600"/> {editingMission ? 'تعديل المهمة' : 'إضافة مهمة'}
                                </h3>
                                <form onSubmit={handleSaveMission} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-1">عنوان المهمة</label>
                                        <input type="text" required value={missionForm.title} onChange={e => setMissionForm({...missionForm, title: e.target.value})} className="w-full border rounded-lg p-2" placeholder="مثال: تنظيف الأسنان" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-1">النقاط</label>
                                        <input type="number" required value={missionForm.points} onChange={e => setMissionForm({...missionForm, points: e.target.value})} className="w-full border rounded-lg p-2" placeholder="10" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-2">الأيقونة</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {ICONS.map(icon => (
                                                <button
                                                    key={icon}
                                                    type="button"
                                                    onClick={() => setMissionForm({...missionForm, icon})}
                                                    className={`p-2 rounded-lg border transition ${missionForm.icon === icon ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-400'}`}
                                                >
                                                    <Star size={20} /> {/* Simplified for demo, ideally map name to component */}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button type="submit" className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700">حفظ</button>
                                        <button type="button" onClick={() => setShowMissionForm(false)} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg font-bold hover:bg-slate-300">إلغاء</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};
