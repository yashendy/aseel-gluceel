
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { dbService } from '../services/dbService';
import { LabResult, LabType, LabValue } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Plus, FlaskConical, Calendar, AlertCircle, CheckCircle, ArrowUp, ArrowDown, Activity, Trash2, FileText, ChevronDown, Clock, ShieldCheck, BrainCircuit, Sparkles } from 'lucide-react';

const LAB_TEMPLATES: Record<LabType, { title: string, items: { name: string, unit: string, min?: number, max?: number }[] }> = {
    HBA1C: {
        title: 'فحص السكر التراكمي',
        items: [{ name: 'HbA1c', unit: '%', min: 4, max: 6.5 }]
    },
    COMPREHENSIVE: {
        title: 'الفحص السنوي الشامل',
        items: [
            { name: 'HbA1c (تراكمي)', unit: '%', min: 4, max: 6.5 },
            { name: 'Creatinine (كلى)', unit: 'mg/dL', min: 0.6, max: 1.2 },
            { name: 'Microalbumin (زلال)', unit: 'mg/g', max: 30 },
            { name: 'LDL (كوليسترول ضار)', unit: 'mg/dL', max: 100 },
            { name: 'HDL (كوليسترول جيد)', unit: 'mg/dL', min: 40 },
            { name: 'TSH (غدة درقية)', unit: 'mIU/L', min: 0.4, max: 4.0 },
            { name: 'ALT (وظائف كبد)', unit: 'U/L', max: 40 },
            { name: 'Vitamin D', unit: 'ng/mL', min: 30 },
            { name: 'Celiac Screen (tTG)', unit: 'U/mL', max: 10 }
        ]
    },
    LIPID: {
        title: 'فحص الدهون',
        items: [
            { name: 'الكوليسترول الكلي', unit: 'mg/dL', max: 200 },
            { name: 'الدهون الثلاثية (Triglycerides)', unit: 'mg/dL', max: 150 },
            { name: 'HDL (الجيد)', unit: 'mg/dL', min: 40 },
            { name: 'LDL (الضار)', unit: 'mg/dL', max: 100 },
        ]
    },
    KIDNEY: {
        title: 'وظائف الكلى',
        items: [
            { name: 'Creatinine', unit: 'mg/dL', min: 0.6, max: 1.2 },
            { name: 'Microalbumin/Creatinine', unit: 'mg/g', max: 30 }
        ]
    },
    THYROID: {
        title: 'الغدة الدرقية',
        items: [
            { name: 'TSH', unit: 'mIU/L', min: 0.4, max: 4.0 },
            { name: 'Free T4', unit: 'ng/dL', min: 0.8, max: 1.8 }
        ]
    },
    VITAMIN: {
        title: 'الفيتامينات',
        items: [
            { name: 'Vitamin D', unit: 'ng/mL', min: 30, max: 100 },
            { name: 'Vitamin B12', unit: 'pg/mL', min: 200, max: 900 }
        ]
    },
    OTHER: {
        title: 'تحليل آخر',
        items: []
    }
};

export const LabResults = () => {
    const { user, selectedChildId } = useAuth();
    const targetId = selectedChildId || user?.id;

    const [labs, setLabs] = useState<LabResult[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    
    // Add Form State
    const [newLabDate, setNewLabDate] = useState(new Date().toISOString().split('T')[0]);
    const [newLabType, setNewLabType] = useState<LabType>('HBA1C');
    const [labValues, setLabValues] = useState<LabValue[]>([]);

    useEffect(() => {
        if (targetId) {
            setLabs(dbService.getLabs(targetId));
        }
    }, [targetId]);

    // Update form fields when type changes
    useEffect(() => {
        const template = LAB_TEMPLATES[newLabType];
        setLabValues(template.items.map(item => ({
            name: item.name,
            unit: item.unit,
            rangeMin: item.min,
            rangeMax: item.max,
            value: 0,
            status: 'NORMAL'
        })));
    }, [newLabType]);

    const handleValueChange = (index: number, val: string) => {
        const numVal = parseFloat(val) || 0;
        const updated = [...labValues];
        const item = updated[index];
        item.value = numVal;
        
        // Auto status
        if (item.rangeMax && numVal > item.rangeMax) item.status = 'HIGH';
        else if (item.rangeMin && numVal < item.rangeMin) item.status = 'LOW';
        else item.status = 'NORMAL';
        
        setLabValues(updated);
    };

    const handleAddLab = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetId) return;

        const newLab: LabResult = {
            id: Date.now().toString(),
            userId: targetId,
            date: newLabDate,
            type: newLabType,
            title: LAB_TEMPLATES[newLabType].title,
            values: labValues,
        };

        dbService.addLab(newLab);
        setLabs(dbService.getLabs(targetId));
        setShowAddForm(false);
        // Reset Logic handled by useEffect
    };

    const handleDelete = (id: string) => {
        if(window.confirm('هل أنت متأكد من حذف هذا التحليل؟')) {
            dbService.deleteLab(id);
            if (targetId) setLabs(dbService.getLabs(targetId));
        }
    };

    // Filter A1c Data for Chart
    const a1cData = labs
        .filter(l => l.type === 'HBA1C' || l.type === 'COMPREHENSIVE') // Includes Comprehensive as it has A1c
        .map(l => {
            // Try to find HbA1c value inside comprehensive
            const val = l.values.find(v => v.name.includes('HbA1c'))?.value || 0;
            return { 
                date: new Date(l.date).toLocaleDateString('en-GB'), // DD/MM
                fullDate: l.date,
                value: val 
            };
        })
        .filter(d => d.value > 0)
        .sort((a,b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

    const lastA1c = a1cData.length > 0 ? a1cData[a1cData.length - 1].value : null;

    // Logic for Annual Checkup
    const lastAnnualLab = labs.find(l => l.type === 'COMPREHENSIVE');
    const lastAnnualDate = lastAnnualLab ? new Date(lastAnnualLab.date) : null;
    
    let annualStatus = 'UNKNOWN'; // UNKNOWN, OK, OVERDUE, SOON
    let daysDiff = 0;
    
    if (lastAnnualDate) {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastAnnualDate.getTime());
        daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysDiff > 365) annualStatus = 'OVERDUE';
        else if (daysDiff > 330) annualStatus = 'SOON';
        else annualStatus = 'OK';
    } else {
        annualStatus = 'UNKNOWN';
    }

    // --- AI Analysis Logic ---
    const getAIAnalysis = () => {
        if (labs.length === 0) return "لا توجد بيانات كافية للتحليل. ابدأ بتسجيل أول فحص.";

        const insights: string[] = [];

        // 1. HbA1c Analysis
        if (lastA1c) {
            if (lastA1c <= 6.5) {
                insights.push("🌟 التراكمي (HbA1c) ممتاز! أنت في النطاق المثالي، استمر في هذا الأداء.");
            } else if (lastA1c <= 7.5) {
                insights.push("⚠️ التراكمي مرتفع قليلاً عن المثالي. مراجعة بسيطة لنظامك الغذائي قد تعيدك للمسار الصحيح.");
            } else {
                insights.push("🚨 التراكمي مرتفع بشكل ملحوظ (>7.5%). يرجى مراجعة الطبيب لتعديل جرعات الأنسولين وتجنب المضاعفات.");
            }
        }

        // 2. Comprehensive / Specific Checks
        const latestLabs = labs.slice(0, 3); // Check last 3 entries
        let hasKidneyWarning = false;
        let hasLipidWarning = false;
        let hasVitaminWarning = false;

        latestLabs.forEach(lab => {
            // Microalbumin (Kidney)
            const micro = lab.values.find(v => v.name.includes('Microalbumin'));
            if (micro && micro.status === 'HIGH' && !hasKidneyWarning) {
                insights.push("🔍 هناك ارتفاع في مؤشرات الزلال (Microalbumin). هذا يتطلب متابعة دقيقة لحماية الكلى.");
                hasKidneyWarning = true;
            }

            // LDL (Lipids)
            const ldl = lab.values.find(v => v.name.includes('LDL'));
            if (ldl && ldl.status === 'HIGH' && !hasLipidWarning) {
                insights.push("🍔 الكوليسترول الضار (LDL) مرتفع. حاول تقليل الدهون المشبعة وزيادة الألياف.");
                hasLipidWarning = true;
            }

            // Vitamin D
            const vitD = lab.values.find(v => v.name.includes('Vitamin D'));
            if (vitD && vitD.status === 'LOW' && !hasVitaminWarning) {
                insights.push("☀️ فيتامين د منخفض. قد يؤثر ذلك على نشاطك ومناعتك، استشر طبيبك بشأن المكملات.");
                hasVitaminWarning = true;
            }
        });

        // 3. Annual Checkup Status
        if (annualStatus === 'OVERDUE') {
            insights.push("📅 الفحص السنوي الشامل متأخر. هذا الفحص ضروري للكشف المبكر عن أي تغيرات.");
        } else if (annualStatus === 'UNKNOWN') {
            insights.push("💡 لم يتم تسجيل فحص سنوي شامل بعد. يُنصح بإجرائه مرة كل عام للاطمئنان.");
        }

        if (insights.length === 0) {
            insights.push("✅ جميع النتائج المسجلة مؤخراً تبدو طبيعية ومستقرة.");
        }

        return insights;
    };

    const aiInsights = getAIAnalysis();

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            
            {/* Top Section: A1c Chart & Summary & Annual Tracker */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* 1. A1c Big Card */}
                <div className="md:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                     
                     <div>
                        <h3 className="text-indigo-200 font-bold mb-1 flex items-center gap-2">
                            <Activity size={18} /> التراكمي الحالي
                        </h3>
                        <div className="flex items-end gap-2 mt-4">
                            <span className="text-6xl font-bold font-mono tracking-tighter">
                                {lastA1c ? lastA1c : '--'}
                            </span>
                            <span className="text-xl font-bold text-indigo-200 mb-2">%</span>
                        </div>
                        
                        {lastA1c && (
                            <div className="mt-4 flex items-center gap-2 text-xs bg-black/20 p-2 rounded-lg border border-white/10">
                                {lastA1c < 6.5 ? <CheckCircle className="text-green-400" size={14} /> : <AlertCircle className="text-orange-400" size={14} />}
                                <span>
                                    {lastA1c < 6.5 ? 'ممتاز! ضمن النطاق' : 'يحتاج مراجعة'}
                                </span>
                            </div>
                        )}
                     </div>

                     <button 
                        onClick={() => { setShowAddForm(true); setNewLabType('HBA1C'); }}
                        className="mt-6 w-full bg-white/10 hover:bg-white hover:text-indigo-700 text-white border border-white/20 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-sm backdrop-blur-sm"
                     >
                        <Plus size={18} /> تسجيل تراكمي
                     </button>
                </div>

                {/* 2. Annual Checkup Status Card */}
                <div className={`md:col-span-1 rounded-3xl p-6 shadow-md border relative overflow-hidden flex flex-col justify-between
                    ${annualStatus === 'OVERDUE' ? 'bg-red-50 border-red-200' : annualStatus === 'OK' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}
                `}>
                    <div>
                        <h3 className={`font-bold mb-2 flex items-center gap-2 ${annualStatus === 'OVERDUE' ? 'text-red-700' : annualStatus === 'OK' ? 'text-emerald-700' : 'text-slate-700'}`}>
                            <ShieldCheck size={20} /> الفحص السنوي الشامل
                        </h3>
                        
                        {annualStatus === 'UNKNOWN' ? (
                            <p className="text-sm text-slate-500 mt-2">لم يتم تسجيل فحص شامل سنوي بعد.</p>
                        ) : (
                            <div className="mt-4">
                                <p className="text-xs font-bold opacity-70">آخر فحص كان:</p>
                                <p className="text-lg font-bold font-mono mt-1">
                                    {lastAnnualDate?.toLocaleDateString('ar-EG', {year: 'numeric', month: 'long', day: 'numeric'})}
                                </p>
                                <p className={`text-xs mt-2 font-bold px-2 py-1 rounded inline-block
                                    ${annualStatus === 'OVERDUE' ? 'bg-red-200 text-red-800' : annualStatus === 'OK' ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200'}
                                `}>
                                    {annualStatus === 'OVERDUE' ? `متأخر بـ ${daysDiff - 365} يوم` : annualStatus === 'SOON' ? 'اقترب الموعد' : 'ساري المفعول'}
                                </p>
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => { setShowAddForm(true); setNewLabType('COMPREHENSIVE'); }}
                        className={`mt-6 w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-sm
                             ${annualStatus === 'OVERDUE' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}
                        `}
                     >
                        <FlaskConical size={18} /> تسجيل فحص شامل
                     </button>
                </div>

                {/* 3. A1c History Chart */}
                <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="font-bold text-slate-700 mb-4 text-sm flex justify-between">
                        <span>تطور السكر التراكمي</span>
                        <span className="text-slate-400 text-xs font-normal">آخر 12 شهر</span>
                    </h3>
                    <div className="flex-1 min-h-[150px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={a1cData}>
                                <defs>
                                    <linearGradient id="colorA1c" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="date" tick={{fontSize: 10}} />
                                <YAxis domain={[4, 12]} hide />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontWeight: 'bold', color: '#475569' }}
                                />
                                <ReferenceLine y={6.5} stroke="green" strokeDasharray="3 3" label={{ value: 'الهدف (6.5%)', fill: 'green', fontSize: 10 }} />
                                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fill="url(#colorA1c)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* AI Analysis Section */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <BrainCircuit size={24} className="text-yellow-300" /> تحليل الذكاء الاصطناعي للمختبر
                    </h3>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 space-y-3">
                        {typeof aiInsights === 'string' ? (
                            <p className="font-medium text-emerald-50">{aiInsights}</p>
                        ) : (
                            aiInsights.map((insight, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                    <Sparkles size={16} className="text-yellow-300 mt-1 flex-shrink-0" />
                                    <p className="font-medium text-emerald-50 leading-relaxed">{insight}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Add Form Modal/Section */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <FlaskConical className="text-indigo-600" /> إضافة تحليل جديد
                            </h3>
                            <button onClick={() => setShowAddForm(false)} className="bg-slate-200 hover:bg-slate-300 p-2 rounded-full transition">
                                <Activity size={16} className="rotate-45" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleAddLab} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ الفحص</label>
                                    <input type="date" required value={newLabDate} onChange={e => setNewLabDate(e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">نوع التحليل</label>
                                    <select 
                                        value={newLabType} 
                                        onChange={e => setNewLabType(e.target.value as LabType)}
                                        className="w-full border rounded-lg p-2 text-sm font-bold bg-white"
                                    >
                                        <option value="HBA1C">سكر تراكمي (HbA1c)</option>
                                        <option value="COMPREHENSIVE">فحص سنوي شامل</option>
                                        <option value="LIPID">دهون (Lipid Profile)</option>
                                        <option value="KIDNEY">وظائف كلى</option>
                                        <option value="THYROID">غدة درقية</option>
                                        <option value="VITAMIN">فيتامينات (D, B12)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h4 className="text-sm font-bold text-indigo-700 mb-2">النتائج</h4>
                                {labValues.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <label className="flex-1 text-xs font-bold text-slate-600 truncate" title={item.name}>{item.name}</label>
                                        <input 
                                            type="number" step="0.01" 
                                            value={item.value || ''} 
                                            onChange={e => handleValueChange(idx, e.target.value)}
                                            placeholder="0"
                                            className={`w-24 text-center p-2 rounded border text-sm font-bold outline-none focus:ring-2 
                                                ${item.status === 'HIGH' ? 'border-orange-300 bg-orange-50 focus:ring-orange-200' : 
                                                  item.status === 'LOW' ? 'border-red-300 bg-red-50 focus:ring-red-200' : 
                                                  'border-slate-300 focus:ring-indigo-200'}`}
                                        />
                                        <span className="text-xs text-slate-400 w-10">{item.unit}</span>
                                    </div>
                                ))}
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg transition">
                                حفظ النتائج
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* History List */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                        <FileText className="text-indigo-500" /> أرشيف التحاليل
                    </h3>
                    {!showAddForm && (
                        <button 
                            onClick={() => { setShowAddForm(true); setNewLabType('HBA1C'); }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2"
                        >
                            <Plus size={16} /> إضافة تحليل
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {labs.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                            <FlaskConical size={48} className="mx-auto mb-2 opacity-50" />
                            <p>لم يتم تسجيل أي تحاليل بعد</p>
                        </div>
                    ) : (
                        labs.map(lab => (
                            <div key={lab.id} className={`bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition group relative overflow-hidden ${lab.type === 'COMPREHENSIVE' ? 'border-indigo-100' : 'border-slate-100'}`}>
                                {lab.type === 'COMPREHENSIVE' && (
                                    <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500"></div>
                                )}
                                <div className="flex justify-between items-start border-b border-slate-50 pb-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-xl ${lab.type === 'HBA1C' ? 'bg-indigo-100 text-indigo-600' : lab.type === 'COMPREHENSIVE' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                                            {lab.type === 'HBA1C' ? <Activity size={20} /> : lab.type === 'COMPREHENSIVE' ? <ShieldCheck size={20} /> : <FlaskConical size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{lab.title}</h4>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                <Calendar size={14} className="text-slate-400" /> 
                                                <span className="font-bold text-slate-600">
                                                    {new Date(lab.date).toLocaleDateString('ar-EG', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(lab.id)}
                                        className="text-slate-300 hover:text-red-500 p-2 transition opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {lab.values.map((val, idx) => (
                                        <div key={idx} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                                            <p className="text-[10px] text-slate-500 font-bold mb-1 truncate" title={val.name}>{val.name}</p>
                                            <div className="flex items-center gap-1">
                                                <span className="text-lg font-bold font-mono text-slate-700">{val.value}</span>
                                                <span className="text-[10px] text-slate-400">{val.unit}</span>
                                            </div>
                                            {/* Indicators */}
                                            {(val.status === 'HIGH' || val.status === 'LOW') && (
                                                <div className={`mt-1 text-[10px] font-bold flex items-center gap-1 ${val.status === 'HIGH' ? 'text-orange-500' : 'text-red-500'}`}>
                                                    {val.status === 'HIGH' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                                                    {val.status === 'HIGH' ? 'مرتفع' : 'منخفض'}
                                                </div>
                                            )}
                                            {val.status === 'NORMAL' && val.rangeMax && (
                                                <div className="mt-1 text-[10px] text-green-600 font-bold flex items-center gap-1">
                                                    <CheckCircle size={10} /> طبيعي
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
