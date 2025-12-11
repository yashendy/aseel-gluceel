

import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { User } from '../types';
import { CheckCircle, XCircle, Stethoscope, AlertTriangle, ShieldCheck, Ban, Key, Plus, Trash2 } from 'lucide-react';

export const AdminDoctors = () => {
  const [doctors, setDoctors] = useState<User[]>([]);
  const [activeCodes, setActiveCodes] = useState<string[]>([]);
  const [newCode, setNewCode] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDoctors(dbService.getAllDoctors());
    setActiveCodes(dbService.getActivationCodes());
  };

  const toggleStatus = (id: string) => {
    if(window.confirm('هل أنت متأكد من تغيير حالة هذا الطبيب؟')) {
        dbService.toggleDoctorStatus(id);
        loadData();
    }
  };

  const handleAddCode = (e: React.FormEvent) => {
      e.preventDefault();
      if(newCode.trim()) {
          dbService.addActivationCode(newCode.trim());
          setNewCode('');
          loadData();
      }
  };

  const handleDeleteCode = (code: string) => {
      if(window.confirm('حذف هذا الكود سيمنع الأطباء الجدد من استخدامه. استمرار؟')) {
          dbService.deleteActivationCode(code);
          loadData();
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       
       {/* Main Section: Doctors List */}
       <div className="lg:col-span-2 space-y-6">
            <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                        <Stethoscope size={28} /> إدارة الأطباء
                    </h3>
                    <p className="text-indigo-200 mt-2">مراجعة وتفعيل حسابات الأطباء المسجلين في المنصة.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                            <tr>
                                <th className="p-4">اسم الطبيب</th>
                                <th className="p-4">البريد الإلكتروني</th>
                                <th className="p-4">كود التفعيل</th>
                                <th className="p-4">الحالة</th>
                                <th className="p-4">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {doctors.map(doc => (
                                <tr key={doc.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img src={doc.avatar || 'https://via.placeholder.com/40'} alt={doc.name} className="w-10 h-10 rounded-full border border-slate-200" />
                                            <span className="font-bold text-slate-800 text-sm md:text-base">{doc.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600 font-mono text-xs md:text-sm">{doc.email}</td>
                                    <td className="p-4 text-slate-700 font-bold font-mono">
                                        {doc.activationCode ? (
                                            <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 text-xs">{doc.activationCode}</span>
                                        ) : (
                                            <span className="text-slate-400 italic">--</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {doc.isApproved ? (
                                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 whitespace-nowrap">
                                                <CheckCircle size={14} /> مفعل
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200 animate-pulse whitespace-nowrap">
                                                <AlertTriangle size={14} /> انتظار
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => toggleStatus(doc.id)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm whitespace-nowrap ${
                                                doc.isApproved 
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                                                : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                        >
                                            {doc.isApproved ? (
                                                <>
                                                    <Ban size={14} /> إيقاف
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={14} /> قبول
                                                </>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {doctors.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        لا يوجد أطباء مسجلين حالياً
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
       </div>

       {/* Side Section: Activation Codes */}
       <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
                <div className="flex items-center gap-2 mb-4 text-slate-700">
                    <Key size={24} className="text-indigo-600" />
                    <h3 className="text-xl font-bold">أكواد التفعيل</h3>
                </div>
                <p className="text-sm text-slate-500 mb-6">
                    قم بإضافة أكواد وشاركها مع الأطباء للسماح لهم بالتسجيل والدخول مباشرة دون انتظار الموافقة اليدوية.
                </p>

                <form onSubmit={handleAddCode} className="flex gap-2 mb-6">
                    <input 
                        type="text" 
                        value={newCode}
                        onChange={e => setNewCode(e.target.value)}
                        placeholder="أدخل كود جديد..."
                        className="flex-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition">
                        <Plus size={20} />
                    </button>
                </form>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {activeCodes.map(code => (
                        <div key={code} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200 group hover:border-indigo-200 transition">
                            <span className="font-mono font-bold text-slate-700">{code}</span>
                            <button 
                                onClick={() => handleDeleteCode(code)}
                                className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {activeCodes.length === 0 && (
                        <div className="text-center text-slate-400 py-8 border-2 border-dashed rounded-lg">
                            لا توجد أكواد مفعلة
                        </div>
                    )}
                </div>
            </div>
       </div>

    </div>
  );
};