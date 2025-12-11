
import React from 'react';
import { Construction, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ComingSoonProps {
  title: string;
  description?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ title, description }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="bg-slate-50 p-6 rounded-full mb-6 animate-bounce">
        <Construction size={64} className="text-slate-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-700 mb-2">{title}</h2>
      <p className="text-slate-500 mb-8 max-w-md">
        {description || "هذا القسم قيد التطوير حالياً. سيتم إضافته في التحديث القادم لمنصة أسيل."}
      </p>
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sky-600 font-bold hover:bg-sky-50 px-4 py-2 rounded-lg transition"
      >
        <ArrowRight size={20} /> العودة للصفحة السابقة
      </button>
    </div>
  );
};
