
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { User, UserRole } from '../types';
import { Users, Baby, Search, User as UserIcon, Activity, Star } from 'lucide-react';

export const AdminFamilies = () => {
  const [parents, setParents] = useState<User[]>([]);
  const [children, setChildren] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'PARENTS' | 'CHILDREN'>('PARENTS');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch all users
    const allParents = dbService.getUsersByRole(UserRole.PARENT);
    const allChildren = dbService.getUsersByRole(UserRole.CHILD);
    setParents(allParents);
    setChildren(allChildren);
  }, []);

  // Helper to find parent name for a child
  const getParentName = (parentId?: string) => {
      if (!parentId) return 'غير مرتبط';
      const parent = parents.find(p => p.id === parentId);
      return parent ? parent.name : 'غير معروف';
  };

  // Helper to find doctor name for a child
  const getDoctorName = (doctorId?: string) => {
      if (!doctorId) return 'غير مرتبط';
      const doctors = dbService.getAllDoctors();
      const doctor = doctors.find(d => d.id === doctorId);
      return doctor ? doctor.name : 'غير معروف';
  };

  // Helper to count children for a parent
  const getChildrenCount = (parentId: string) => {
      return children.filter(c => c.parentId === parentId).length;
  };

  const filteredList = (activeTab === 'PARENTS' ? parents : children).filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
       {/* Header & Tabs */}
       <div className="bg-indigo-900 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
                <h2 className="text-3xl font-bold font-cairo mb-2">سجلات العائلات</h2>
                <p className="text-indigo-200 mb-6">استعراض وإدارة بيانات أولياء الأمور والأطفال المسجلين في المنصة.</p>
                
                <div className="flex gap-4">
                    <button 
                        onClick={() => setActiveTab('PARENTS')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition duration-300 ${activeTab === 'PARENTS' ? 'bg-white text-indigo-900 shadow-lg scale-105' : 'bg-indigo-800/50 text-indigo-200 hover:bg-indigo-800'}`}
                    >
                        <Users size={20} /> قائمة أولياء الأمور
                        <span className="bg-indigo-100/20 px-2 py-0.5 rounded-full text-xs ml-1">{parents.length}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('CHILDREN')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition duration-300 ${activeTab === 'CHILDREN' ? 'bg-white text-indigo-900 shadow-lg scale-105' : 'bg-indigo-800/50 text-indigo-200 hover:bg-indigo-800'}`}
                    >
                        <Baby size={20} /> قائمة الأطفال
                        <span className="bg-indigo-100/20 px-2 py-0.5 rounded-full text-xs ml-1">{children.length}</span>
                    </button>
                </div>
            </div>
       </div>

       {/* Search Bar */}
       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
            <Search className="text-slate-400" />
            <input 
                type="text" 
                placeholder={activeTab === 'PARENTS' ? "ابحث عن ولي أمر بالاسم أو البريد..." : "ابحث عن طفل..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none text-slate-700 font-bold placeholder:font-normal"
            />
       </div>

       {/* Content Table */}
       <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
            {activeTab === 'PARENTS' ? (
                // --- PARENTS TABLE ---
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                            <tr>
                                <th className="p-4">ولي الأمر</th>
                                <th className="p-4">البريد الإلكتروني</th>
                                <th className="p-4">عدد الأطفال</th>
                                <th className="p-4">تاريخ التسجيل</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredList.map(parent => (
                                <tr key={parent.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img src={parent.avatar} alt={parent.name} className="w-12 h-12 rounded-full border-2 border-slate-100" />
                                            <div>
                                                <div className="font-bold text-slate-800">{parent.name}</div>
                                                <div className="text-xs text-slate-400">ID: {parent.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-slate-600">{parent.email}</td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full text-sm font-bold border border-cyan-100">
                                            <Baby size={16} /> {getChildrenCount(parent.id)} أطفال
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500 text-sm">
                                        {/* Mock date as it's not in User interface yet */}
                                        2024/05/01
                                    </td>
                                </tr>
                            ))}
                            {filteredList.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-400">لا توجد نتائج</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                // --- CHILDREN TABLE ---
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                            <tr>
                                <th className="p-4">الطفل</th>
                                <th className="p-4">ولي الأمر</th>
                                <th className="p-4">الطبيب المتابع</th>
                                <th className="p-4">نقاط التحفيز</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredList.map(child => (
                                <tr key={child.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img src={child.avatar} alt={child.name} className="w-12 h-12 rounded-full border-2 border-slate-100" />
                                            <div>
                                                <div className="font-bold text-slate-800">{child.name}</div>
                                                {/* Calculate Age Mock */}
                                                <div className="text-xs text-slate-400">10 سنوات</div> 
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <UserIcon size={16} className="text-indigo-400" />
                                            <span className="font-bold">{getParentName(child.parentId)}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <Activity size={16} className={child.linkedDoctorId ? "text-green-500" : "text-slate-300"} />
                                            <span>{getDoctorName(child.linkedDoctorId)}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 font-bold text-amber-500">
                                            <Star size={18} className="fill-amber-500" />
                                            {child.points || 0}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                             {filteredList.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-400">لا توجد نتائج</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
       </div>
    </div>
  );
};
