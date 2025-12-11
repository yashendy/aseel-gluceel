
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { dbService } from '../services/dbService';
import { Visit, VisitTask, VisitType } from '../types';
import { Calendar, Clock, MapPin, Plus, CheckCircle, XCircle, Stethoscope, AlertTriangle, Trash2, ListTodo, CheckSquare, Square, FileText, Activity, Save, Edit3, ArrowRight, ClipboardList, Sunrise, Sun, Moon } from 'lucide-react';

const VISIT_TYPES: {value: VisitType, label: string}[] = [
    { value: 'ROUTINE', label: 'متابعة دورية' },
    { value: 'EMERGENCY', label: 'زيارة طارئة' },
    { value: 'FOLLOWUP', label: 'إعادة متابعة' },
    { value: 'LABS', label: 'تحاليل' },
    { value: 'DIETITIAN', label: 'تغذية' },
];

export const Visits = () => {
    const { user, selectedChildId } = useAuth();
    const targetId = selectedChildId || user?.id;

    const [visits, setVisits] = useState<Visit[]>([]);
    
    // UI States
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAILS'>('LIST');
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

    // Form State
    const [formId, setFormId] = useState<string | null>(null);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [reason, setReason] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [location, setLocation] = useState('');
    const [visitType, setVisitType] = useState<VisitType>('ROUTINE');
    
    // Clinical Fields
    const [diagnosis, setDiagnosis] = useState('');
    const [recommendations, setRecommendations] = useState('');
    const [requiredLabs, setRequiredLabs] = useState('');
    
    // Adjustments
    const [newLongActingDose, setNewLongActingDose] = useState<number | ''>('');
    const [newLongActingTime, setNewLongActingTime] = useState<string>(''); // New Time State
    const [newIcrBreakfast, setNewIcrBreakfast] = useState<number | ''>('');
    const [newIcrLunch, setNewIcrLunch] = useState<number | ''>('');
    const [newIcrDinner, setNewIcrDinner] = useState<number | ''>('');
    const [newIsf, setNewIsf] = useState<number | ''>('');

    // Tasks State for new visit
    const [tasksList, setTasksList] = useState<string[]>([]);
    const [currentTask, setCurrentTask] = useState('');

    useEffect(() => {
        if (targetId) {
            setVisits(dbService.getVisits(targetId));
        }
    }, [targetId, user]);

    // Initialize Form with defaults or editing data
    const openForm = (visit?: Visit) => {
        if (visit) {
            setFormId(visit.id);
            setNewDate(visit.date);
            setNewTime(visit.time);
            setReason(visit.reason);
            setDoctorName(visit.doctorName);
            setLocation(visit.location || '');
            setVisitType(visit.type);
            setTasksList(visit.tasks?.map(t => t.text) || []);
            
            // Details
            setDiagnosis(visit.diagnosis || '');
            setRecommendations(visit.recommendations || '');
            setRequiredLabs(visit.requiredLabs || '');
            setNewLongActingDose(visit.newLongActingDose || '');
            setNewLongActingTime(visit.newLongActingTime || '');
            setNewIcrBreakfast(visit.newIcrBreakfast || '');
            setNewIcrLunch(visit.newIcrLunch || '');
            setNewIcrDinner(visit.newIcrDinner || '');
            setNewIsf(visit.newIsf || '');
        } else {
            // New Visit
            setFormId(null);
            setNewDate(new Date().toISOString().split('T')[0]);
            setNewTime('09:00');
            setReason('');
            setLocation('');
            setVisitType('ROUTINE');
            setTasksList([]);
            setDiagnosis('');
            setRecommendations('');
            setRequiredLabs('');
            setNewLongActingDose('');
            setNewLongActingTime('');
            setNewIcrBreakfast('');
            setNewIcrLunch('');
            setNewIcrDinner('');
            setNewIsf('');
            
            // Auto fill doc name
            let foundUser = null;
            if (user?.id === targetId) {
                foundUser = user;
            } else {
                const children = dbService.getChildrenByParent(user?.id || '');
                foundUser = children.find(c => c.id === targetId);
            }
            if (foundUser?.linkedDoctorId) {
                 const docs = dbService.getAllDoctors();
                 const linkedDoc = docs.find(d => d.id === foundUser?.linkedDoctorId);
                 if (linkedDoc) setDoctorName(linkedDoc.name);
            } else {
                setDoctorName('');
            }
        }
        setViewMode('FORM');
    };

    const handleAddTask = () => {
        if (currentTask.trim()) {
            setTasksList([...tasksList, currentTask.trim()]);
            setCurrentTask('');
        }
    };

    const handleRemoveTask = (index: number) => {
        const updated = [...tasksList];
        updated.splice(index, 1);
        setTasksList(updated);
    };

    const handleSaveVisit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetId) return;

        const formattedTasks: VisitTask[] = tasksList.map((t, idx) => ({
            id: `task_${Date.now()}_${idx}`,
            text: t,
            isCompleted: false
        }));

        const visitData: Visit = {
            id: formId || Date.now().toString(),
            userId: targetId,
            doctorName: doctorName || 'طبيب عام',
            date: newDate,
            time: newTime,
            type: visitType,
            reason: reason || 'مراجعة',
            location: location || 'العيادة',
            status: formId ? (visits.find(v => v.id === formId)?.status || 'UPCOMING') : 'UPCOMING', // Preserve status on edit
            tasks: formattedTasks.length > 0 ? formattedTasks : undefined,
            
            // Details
            diagnosis: diagnosis || undefined,
            recommendations: recommendations || undefined,
            requiredLabs: requiredLabs || undefined,
            newLongActingDose: newLongActingDose ? Number(newLongActingDose) : undefined,
            newLongActingTime: newLongActingTime || undefined,
            newIcrBreakfast: newIcrBreakfast ? Number(newIcrBreakfast) : undefined,
            newIcrLunch: newIcrLunch ? Number(newIcrLunch) : undefined,
            newIcrDinner: newIcrDinner ? Number(newIcrDinner) : undefined,
            newIsf: newIsf ? Number(newIsf) : undefined,
            changesApplied: formId ? visits.find(v => v.id === formId)?.changesApplied : false
        };

        if (formId) {
            dbService.updateVisit(visitData);
        } else {
            dbService.addVisit(visitData);
        }

        setVisits(dbService.getVisits(targetId));
        setViewMode('LIST');
    };

    const handleStatusChange = (id: string, status: 'COMPLETED' | 'CANCELLED') => {
        if (window.confirm(status === 'COMPLETED' ? 'هل تمت الزيارة بالفعل؟' : 'هل أنت متأكد من إلغاء الموعد؟')) {
            dbService.updateVisitStatus(id, status);
            setVisits(dbService.getVisits(targetId!));
        }
    };

    const handleDelete = (id: string) => {
         if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            dbService.deleteVisit(id);
            setVisits(dbService.getVisits(targetId!));
            if (selectedVisit?.id === id) setViewMode('LIST');
        }
    };

    const toggleTask = (visitId: string, taskId: string) => {
        dbService.toggleVisitTask(visitId, taskId);
        setVisits(dbService.getVisits(targetId!));
        // Also update local selected visit if viewing
        if (selectedVisit?.id === visitId) {
            const updated = dbService.getVisits(targetId!).find(v => v.id === visitId);
            setSelectedVisit(updated || null);
        }
    };

    const handleApplyChanges = (visitId: string) => {
        if (window.confirm("سيتم تحديث الملف الطبي للطفل بهذه القيم (الجرعات والمعاملات). هل أنت متأكد؟")) {
            const success = dbService.applyVisitChanges(visitId);
            if (success) {
                alert("تم تحديث الملف بنجاح!");
                setVisits(dbService.getVisits(targetId!));
                // Update viewing state
                const updated = dbService.getVisits(targetId!).find(v => v.id === visitId);
                setSelectedVisit(updated || null);
            }
        }
    };

    const openDetails = (visit: Visit) => {
        setSelectedVisit(visit);
        setViewMode('DETAILS');
    };

    // Render Helpers
    const getDaysRemaining = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - new Date().setHours(0,0,0,0);
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days < 0) return 'اليوم';
        if (days === 0) return 'اليوم';
        return `بعد ${days} يوم`;
    };

    // --- VIEW: FORM ---
    if (viewMode === 'FORM') {
        return (
            <div className="animate-fadeIn max-w-2xl mx-auto pb-20">
                <button onClick={() => setViewMode('LIST')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4">
                    <ArrowRight size={20} /> العودة للقائمة
                </button>
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
                    <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            {formId ? <Edit3 size={24} className="text-indigo-600"/> : <Plus size={24} className="text-indigo-600"/>}
                            {formId ? 'تعديل بيانات الزيارة' : 'حجز موعد جديد'}
                        </h3>
                    </div>
                    
                    <form onSubmit={handleSaveVisit} className="p-6 space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">التاريخ</label>
                                <input type="date" required value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">الوقت</label>
                                <input type="time" required value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">نوع الزيارة</label>
                                <select value={visitType} onChange={e => setVisitType(e.target.value as VisitType)} className="w-full border rounded-lg p-2 bg-white">
                                    {VISIT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">الطبيب / المركز</label>
                                <input type="text" required value={doctorName} onChange={e => setDoctorName(e.target.value)} className="w-full border rounded-lg p-2" placeholder="د. الاسم..." />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">سبب الزيارة</label>
                                <input type="text" required value={reason} onChange={e => setReason(e.target.value)} className="w-full border rounded-lg p-2" placeholder="مثال: ارتفاع مستمر في السكر..." />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">الموقع (اختياري)</label>
                                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full border rounded-lg p-2" placeholder="العيادة..." />
                            </div>
                        </div>

                        {/* Pre-visit Tasks */}
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <label className="block text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
                                <ListTodo size={16} /> مهام مطلوبة قبل الزيارة
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    type="text" 
                                    value={currentTask}
                                    onChange={e => setCurrentTask(e.target.value)}
                                    className="flex-1 border rounded-lg p-2 text-sm"
                                    placeholder="صيام، إحضار نتائج..."
                                />
                                <button type="button" onClick={handleAddTask} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700">
                                    <Plus size={20} />
                                </button>
                            </div>
                            <ul className="space-y-1">
                                {tasksList.map((t, idx) => (
                                    <li key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg text-sm border border-indigo-100">
                                        <span>- {t}</span>
                                        <button type="button" onClick={() => handleRemoveTask(idx)} className="text-red-400 hover:text-red-600">
                                            <XCircle size={16} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Medical Details (Shown if editing or filling after visit) */}
                        <div className="border-t pt-4">
                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Activity className="text-emerald-600"/> النتائج والتوصيات الطبية (اختياري)
                            </h4>
                            <div className="space-y-4">
                                <textarea 
                                    value={diagnosis} onChange={e => setDiagnosis(e.target.value)} 
                                    className="w-full border rounded-lg p-2 text-sm h-20" placeholder="خلاصة التشخيص..." 
                                />
                                <textarea 
                                    value={recommendations} onChange={e => setRecommendations(e.target.value)} 
                                    className="w-full border rounded-lg p-2 text-sm h-20" placeholder="توصيات الطبيب..." 
                                />
                                <input 
                                    type="text" value={requiredLabs} onChange={e => setRequiredLabs(e.target.value)} 
                                    className="w-full border rounded-lg p-2 text-sm" placeholder="فحوصات مطلوبة للقادم..." 
                                />
                            </div>

                            {/* Adjustments */}
                            <div className="mt-4 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                <label className="block text-sm font-bold text-emerald-800 mb-3">تعديلات الجرعات والمعاملات المقترحة</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-emerald-700 block mb-1">جرعة القاعدي</label>
                                            <input type="number" step="0.5" value={newLongActingDose} onChange={e => setNewLongActingDose(Number(e.target.value))} className="w-full border border-emerald-200 rounded p-2 text-center font-bold" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-emerald-700 block mb-1">وقت الجرعة</label>
                                            <input type="time" value={newLongActingTime} onChange={e => setNewLongActingTime(e.target.value)} className="w-full border border-emerald-200 rounded p-2 text-center font-bold text-sm bg-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-emerald-700 block mb-1">معامل التصحيح (ISF)</label>
                                        <input type="number" step="0.1" value={newIsf} onChange={e => setNewIsf(Number(e.target.value))} className="w-full border border-emerald-200 rounded p-2 text-center font-bold" />
                                    </div>
                                </div>
                                <div className="border-t border-emerald-200/50 pt-2">
                                    <label className="text-xs font-bold text-emerald-800 block mb-2">تعديل معامل الكارب (ICR):</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[10px] font-bold text-emerald-600 block mb-1 flex items-center justify-center gap-1"><Sunrise size={10}/> فطار</label>
                                            <input type="number" step="0.1" value={newIcrBreakfast} onChange={e => setNewIcrBreakfast(Number(e.target.value))} className="w-full border border-emerald-200 rounded p-2 text-center font-bold text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-emerald-600 block mb-1 flex items-center justify-center gap-1"><Sun size={10}/> غداء</label>
                                            <input type="number" step="0.1" value={newIcrLunch} onChange={e => setNewIcrLunch(Number(e.target.value))} className="w-full border border-emerald-200 rounded p-2 text-center font-bold text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-emerald-600 block mb-1 flex items-center justify-center gap-1"><Moon size={10}/> عشاء</label>
                                            <input type="number" step="0.1" value={newIcrDinner} onChange={e => setNewIcrDinner(Number(e.target.value))} className="w-full border border-emerald-200 rounded p-2 text-center font-bold text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg transition flex items-center justify-center gap-2">
                                <Save size={20} /> حفظ البيانات
                            </button>
                            <button type="button" onClick={() => setViewMode('LIST')} className="flex-none bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 px-6 rounded-xl font-bold transition">
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // --- VIEW: DETAILS ---
    if (viewMode === 'DETAILS' && selectedVisit) {
        return (
            <div className="animate-fadeIn max-w-3xl mx-auto pb-20">
                <button onClick={() => setViewMode('LIST')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4">
                    <ArrowRight size={20} /> العودة للقائمة
                </button>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 relative">
                    <div className={`h-3 w-full ${selectedVisit.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                    
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-1">{selectedVisit.reason}</h2>
                                <p className="text-slate-500 flex items-center gap-2">
                                    <Stethoscope size={16} /> {selectedVisit.doctorName}
                                    <span className="text-slate-300">|</span>
                                    <span className="text-xs bg-slate-100 px-2 py-1 rounded">{VISIT_TYPES.find(t => t.value === selectedVisit.type)?.label}</span>
                                </p>
                            </div>
                            <div className="text-left">
                                <p className="text-lg font-bold text-indigo-600 font-mono">{new Date(selectedVisit.date).toLocaleDateString('ar-EG')}</p>
                                <p className="text-sm text-slate-400 font-mono">{selectedVisit.time}</p>
                            </div>
                        </div>

                        {/* Status Actions */}
                        <div className="flex gap-2 mb-8 border-b border-slate-100 pb-6">
                            {selectedVisit.status === 'UPCOMING' && (
                                <button onClick={() => handleStatusChange(selectedVisit.id, 'COMPLETED')} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2">
                                    <CheckCircle size={16}/> إتمام الزيارة
                                </button>
                            )}
                            <button onClick={() => openForm(selectedVisit)} className="bg-slate-50 text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2">
                                <Edit3 size={16}/> تعديل
                            </button>
                            <button onClick={() => handleDelete(selectedVisit.id)} className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2">
                                <Trash2 size={16}/> حذف
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Diagnosis & Recommendations */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><Activity size={18} className="text-indigo-500"/> التشخيص</h4>
                                    <p className="text-slate-600 text-sm leading-relaxed">{selectedVisit.diagnosis || 'لا يوجد تشخيص مسجل.'}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><FileText size={18} className="text-indigo-500"/> التوصيات</h4>
                                    <p className="text-slate-600 text-sm leading-relaxed">{selectedVisit.recommendations || 'لا توجد توصيات مسجلة.'}</p>
                                </div>
                            </div>

                            {/* Required Labs */}
                            {selectedVisit.requiredLabs && (
                                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                    <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2"><ClipboardList size={18}/> فحوصات مطلوبة</h4>
                                    <p className="text-yellow-700 text-sm">{selectedVisit.requiredLabs}</p>
                                </div>
                            )}

                            {/* Adjustments Section */}
                            {(selectedVisit.newLongActingDose || selectedVisit.newLongActingTime || selectedVisit.newIcrBreakfast || selectedVisit.newIcrLunch || selectedVisit.newIcrDinner || selectedVisit.newIsf) && (
                                <div className={`p-5 rounded-2xl border-2 ${selectedVisit.changesApplied ? 'bg-slate-50 border-slate-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className={`font-bold flex items-center gap-2 ${selectedVisit.changesApplied ? 'text-slate-600' : 'text-emerald-800'}`}>
                                            <Activity size={20}/> تعديلات الخطة العلاجية
                                        </h4>
                                        {selectedVisit.changesApplied ? (
                                            <span className="text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                                <CheckCircle size={12}/> تم التطبيق
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-emerald-200 text-emerald-800 px-3 py-1 rounded-full font-bold animate-pulse">
                                                مقترح جديد
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
                                        {(selectedVisit.newLongActingDose || selectedVisit.newLongActingTime) && (
                                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                <span className="block text-xs text-slate-400 font-bold mb-1">القاعدي</span>
                                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                                    {selectedVisit.newLongActingDose && <span className="text-xl font-bold text-slate-800">{selectedVisit.newLongActingDose}u</span>}
                                                    {selectedVisit.newLongActingTime && <span className="text-xs bg-slate-100 px-1 py-0.5 rounded flex items-center gap-1"><Clock size={10}/> {selectedVisit.newLongActingTime}</span>}
                                                </div>
                                            </div>
                                        )}
                                        {selectedVisit.newIsf && (
                                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                <span className="block text-xs text-slate-400 font-bold mb-1">ISF</span>
                                                <span className="text-xl font-bold text-slate-800">{selectedVisit.newIsf}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {(selectedVisit.newIcrBreakfast || selectedVisit.newIcrLunch || selectedVisit.newIcrDinner) && (
                                        <div className="bg-white/50 p-3 rounded-xl border border-emerald-100">
                                            <span className="block text-xs text-emerald-700 font-bold mb-2">معامل الكارب (ICR)</span>
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                {selectedVisit.newIcrBreakfast && (
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 block"><Sunrise size={12} className="inline"/> فطار</span>
                                                        <span className="font-bold text-slate-800">{selectedVisit.newIcrBreakfast}</span>
                                                    </div>
                                                )}
                                                {selectedVisit.newIcrLunch && (
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 block"><Sun size={12} className="inline"/> غداء</span>
                                                        <span className="font-bold text-slate-800">{selectedVisit.newIcrLunch}</span>
                                                    </div>
                                                )}
                                                {selectedVisit.newIcrDinner && (
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 block"><Moon size={12} className="inline"/> عشاء</span>
                                                        <span className="font-bold text-slate-800">{selectedVisit.newIcrDinner}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {!selectedVisit.changesApplied && (
                                        <button 
                                            onClick={() => handleApplyChanges(selectedVisit.id)}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2 mt-4"
                                        >
                                            <CheckCircle size={20} /> تطبيق التعديلات على الملف الطبي
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: LIST ---
    const upcomingVisits = visits.filter(v => v.status === 'UPCOMING');
    const pastVisits = visits.filter(v => v.status !== 'UPCOMING');

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            {/* Header Action */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Stethoscope className="text-cyan-600" /> سجل الزيارات الطبية
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">تابع مواعيدك القادمة واحتفظ بسجل الزيارات السابقة.</p>
                </div>
                <button 
                    onClick={() => openForm()}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-cyan-200"
                >
                    <Plus size={20} /> إضافة زيارة
                </button>
            </div>

            {/* Upcoming Visits */}
            <div>
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Calendar className="text-cyan-500" /> الزيارات القادمة
                </h3>
                <div className="grid gap-4">
                    {upcomingVisits.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
                            لا توجد زيارات قادمة.
                        </div>
                    ) : (
                        upcomingVisits.map(visit => (
                            <div key={visit.id} className="bg-white rounded-xl p-5 shadow-md border-r-4 border-cyan-500 transition hover:shadow-lg relative overflow-hidden group">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 relative z-10">
                                    <div className="flex-1 cursor-pointer" onClick={() => openForm(visit)}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-cyan-100 text-cyan-700 text-xs font-bold px-2 py-1 rounded-md">
                                                {getDaysRemaining(visit.date)}
                                            </span>
                                            <h4 className="font-bold text-lg text-slate-800 group-hover:text-cyan-600 transition">{visit.reason}</h4>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-slate-500 mt-2">
                                            <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(visit.date).toLocaleDateString('ar-EG')}</span>
                                            <span className="flex items-center gap-1"><Clock size={14}/> {visit.time}</span>
                                            <span className="flex items-center gap-1"><Stethoscope size={14}/> {visit.doctorName}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button 
                                            onClick={() => handleStatusChange(visit.id, 'COMPLETED')}
                                            className="flex-1 md:flex-none bg-green-50 text-green-600 hover:bg-green-100 px-3 py-2 rounded-lg text-xs font-bold border border-green-200 flex items-center justify-center gap-1"
                                        >
                                            <CheckCircle size={14} /> إتمام
                                        </button>
                                        <button 
                                            onClick={() => handleStatusChange(visit.id, 'CANCELLED')}
                                            className="flex-1 md:flex-none bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg text-xs font-bold border border-red-200 flex items-center justify-center gap-1"
                                        >
                                            <XCircle size={14} /> إلغاء
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Tasks Checkbox */}
                                {visit.tasks && visit.tasks.length > 0 && (
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mt-2 relative z-10">
                                        <h5 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                                            <ListTodo size={12}/> مهام مطلوبة:
                                        </h5>
                                        <div className="space-y-1">
                                            {visit.tasks.map(task => (
                                                <div 
                                                    key={task.id} 
                                                    onClick={() => toggleTask(visit.id, task.id)}
                                                    className={`flex items-center gap-2 text-sm p-1.5 rounded cursor-pointer transition ${task.isCompleted ? 'bg-green-50 text-green-700 line-through decoration-green-500 opacity-60' : 'hover:bg-white'}`}
                                                >
                                                    {task.isCompleted ? <CheckSquare size={16} className="text-green-600" /> : <Square size={16} className="text-slate-400" />}
                                                    <span>{task.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Visit History */}
            <div>
                <h3 className="font-bold text-slate-500 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Clock size={16} /> الأرشيف السابق
                </h3>
                <div className="grid gap-3 opacity-90">
                    {pastVisits.map(visit => (
                        <div key={visit.id} onClick={() => openDetails(visit)} className={`bg-white rounded-lg p-4 border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:shadow-md transition ${visit.status === 'CANCELLED' ? 'bg-slate-50 opacity-60' : ''}`}>
                             <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${visit.status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <h4 className={`font-bold ${visit.status === 'CANCELLED' ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{visit.reason}</h4>
                                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">{VISIT_TYPES.find(t => t.value === visit.type)?.label}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                    <span>{new Date(visit.date).toLocaleDateString('ar-EG')}</span>
                                    <span>•</span>
                                    <span>{visit.doctorName}</span>
                                </p>
                             </div>
                             
                             <div className="flex items-center gap-2 mt-2 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                {/* Adjustment Indicator */}
                                {(visit.newLongActingDose || visit.newLongActingTime || visit.newIcrBreakfast || visit.newIcrLunch || visit.newIcrDinner || visit.newIsf) && (
                                    <span className={`text-[10px] px-2 py-1 rounded font-bold border ${visit.changesApplied ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                                        {visit.changesApplied ? 'تم التعديل' : 'يوجد تعديلات'}
                                    </span>
                                )}

                                {visit.status === 'COMPLETED' ? (
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">تمت</span>
                                ) : (
                                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">ملغاة</span>
                                )}
                                <ArrowRight size={16} className="text-slate-300 transform rotate-180" />
                             </div>
                        </div>
                    ))}
                    {pastVisits.length === 0 && (
                         <div className="text-center text-slate-400 text-sm py-4">لا يوجد سجل سابق</div>
                    )}
                </div>
            </div>
        </div>
    );
};
