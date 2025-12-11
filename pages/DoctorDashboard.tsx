import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { dbService } from '../services/dbService';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { FileText, Link as LinkIcon, Users } from 'lucide-react';

export const DoctorDashboard = () => {
  const { user, setSelectedChildId } = useAuth();
  const [patients, setPatients] = useState<User[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setPatients(dbService.getPatientsByDoctor(user.id));
    }
  }, [user]);

  const generateCode = () => {
    if (user) {
        const code = dbService.generateLinkCode(user.id);
        setGeneratedCode(code);
    }
  };

  const viewPatient = (id: string) => {
      setSelectedChildId(id);
      navigate('/child');
  };

  return (
    <div className="space-y-8">
        
        {/* Link Generation Section */}
        <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <LinkIcon /> ربط مريض جديد
                    </h3>
                    <p className="text-indigo-200 mt-1">قم بتوليد كود لإعطائه لولي الأمر لربط حساب الطفل بك.</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <button 
                        onClick={generateCode}
                        className="bg-white text-indigo-700 px-6 py-2 rounded-lg font-bold hover:bg-indigo-50 transition"
                    >
                        توليد كود
                    </button>
                    {generatedCode && (
                        <div className="bg-black/20 px-4 py-2 rounded font-mono text-2xl tracking-widest border border-white/30">
                            {generatedCode}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Patients List */}
        <div>
            <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Users /> قائمة المرضى المتابعين
            </h3>
            <div className="bg-white shadow-md rounded-xl overflow-hidden border border-slate-100">
                 <table className="w-full text-right">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4">اسم الطفل</th>
                            <th className="p-4">النوع</th>
                            <th className="p-4">نوع الأنسولين</th>
                            <th className="p-4">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {patients.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50">
                                <td className="p-4 flex items-center gap-3">
                                    <img src={p.avatar} className="w-8 h-8 rounded-full" />
                                    <span className="font-bold">{p.name}</span>
                                </td>
                                <td className="p-4 text-slate-500">النوع الأول</td>
                                <td className="p-4 text-sm text-slate-600">
                                    {p.medicalData?.longActingInsulin} / {p.medicalData?.rapidInsulin}
                                </td>
                                <td className="p-4">
                                    <button 
                                        onClick={() => viewPatient(p.id)}
                                        className="text-sky-600 hover:text-sky-800 flex items-center gap-1 font-bold"
                                    >
                                        <FileText size={16}/> عرض التقرير
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {patients.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-400">لا يوجد مرضى مرتبطين حالياً</td>
                            </tr>
                        )}
                    </tbody>
                 </table>
            </div>
        </div>
    </div>
  );
};