
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../App';
import { dbService } from '../services/dbService';
import { GlucoseReading, MeasurementTime, GlucoseUnit, MealEntry } from '../types';
import { THRESHOLDS, TIME_LABELS, mgdlToMmol, mmolToMgdl } from '../constants';
import { GlucoseChart } from '../components/GlucoseChart';
import { 
    Plus, Droplet, CheckCircle, Syringe, HeartPulse, Activity, 
    ArrowUp, ArrowDown, ChevronsUp, Check, Moon, UtensilsCrossed, 
    Utensils, ArrowRight, Tag, TrendingUp, TrendingDown, Calendar as CalendarIcon, Clock, Wheat, Calculator
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const QUICK_TAGS = ['رياضة 🏃', 'توتر 😓', 'مريض 🤒', 'سفر ✈️', 'حفلة 🎉', 'دورة شهرية 🌸', 'بدون نشاط 🛋️'];

const COLORS = {
    LOW: '#ef4444',
    NORMAL: '#10b981',
    HIGH: '#f97316',
    CRITICAL: '#8b5cf6'
};

export const GlucoseTracker = () => {
  const { user, selectedChildId } = useAuth();
  const navigate = useNavigate();
  
  const targetId = selectedChildId || user?.id;

  const [targetUser, setTargetUser] = useState<any>(null);
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [todaysMeals, setTodaysMeals] = useState<MealEntry[]>([]);
  
  // Form State
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]); // NEW: Recording Date
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<GlucoseUnit>(GlucoseUnit.MMOL_L);
  const [timeLabel, setTimeLabel] = useState<MeasurementTime>(MeasurementTime.PRE_BREAKFAST);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Insulin & Carbs State
  const [correctionDose, setCorrectionDose] = useState<number>(0);
  const [mealBolus, setMealBolus] = useState<number | ''>('');
  const [longActing, setLongActing] = useState<number | ''>('');
  const [carbsInput, setCarbsInput] = useState<number | ''>(''); // NEW: Carbs Input
  
  const [correctionMethod, setCorrectionMethod] = useState('');
  const [readingStatus, setReadingStatus] = useState<'NORMAL' | 'HIGH' | 'LOW' | null>(null);

  useEffect(() => {
    if (targetId) {
      setReadings(dbService.getReadings(targetId));
      
      // Fetch meals for the SELECTED DATE, not just today
      const allMeals = dbService.getMealEntries(targetId);
      setTodaysMeals(allMeals.filter(m => m.date === recordDate));
      
      let foundUser = null;
      if (user?.id === targetId) {
          foundUser = user;
      } else {
          const children = dbService.getChildrenByParent(user?.id || '');
          const child = children.find(c => c.id === targetId);
          if (child) foundUser = child;
          else {
               const patients = dbService.getPatientsByDoctor(user?.id || '');
               foundUser = patients.find(p => p.id === targetId);
          }
      }

      if (foundUser) {
          setTargetUser(foundUser);
          if (foundUser.medicalData?.preferredUnit) {
              setUnit(foundUser.medicalData.preferredUnit);
          }
      }
    }
  }, [targetId, user, recordDate]); // Reload when date changes

  // Logic to calculate status and correction dose
  useEffect(() => {
      if (!value || !targetUser?.medicalData) {
          setReadingStatus(null);
          setCorrectionDose(0);
          setCorrectionMethod('');
          return;
      }

      const inputVal = parseFloat(value);
      const medical = targetUser.medicalData;
      
      let valForCalc = inputVal;
      if (unit === GlucoseUnit.MG_DL && medical.preferredUnit === GlucoseUnit.MMOL_L) {
          valForCalc = mgdlToMmol(inputVal);
      } else if (unit === GlucoseUnit.MMOL_L && medical.preferredUnit === GlucoseUnit.MG_DL) {
          valForCalc = mmolToMgdl(inputVal);
      }

      const targetHigh = medical.targetHigh || (medical.preferredUnit === GlucoseUnit.MG_DL ? 180 : 10);
      const targetLow = medical.targetLow || (medical.preferredUnit === GlucoseUnit.MG_DL ? 70 : 4);
      const correctionTarget = medical.correctionTarget || (medical.preferredUnit === GlucoseUnit.MG_DL ? 100 : 6);
      const isf = medical.isf || (medical.preferredUnit === GlucoseUnit.MG_DL ? 50 : 3);

      if (valForCalc > targetHigh) {
          setReadingStatus('HIGH');
          if (isf > 0) {
              const diff = valForCalc - correctionTarget;
              const dose = Math.round(diff / isf);
              setCorrectionDose(dose > 0 ? dose : 0);
          }
      } else if (valForCalc < targetLow) {
          setReadingStatus('LOW');
          setCorrectionDose(0); 
      } else {
          setReadingStatus('NORMAL');
          setCorrectionDose(0);
          setCorrectionMethod('');
      }

  }, [value, unit, targetUser]);

  const linkedMeal = useMemo(() => {
      return todaysMeals.find(m => m.timeLabel === timeLabel);
  }, [todaysMeals, timeLabel]);

  // Auto-fill carbs from linked meal if available
  useEffect(() => {
      if (linkedMeal && linkedMeal.totalCarbs > 0) {
          setCarbsInput(Math.round(linkedMeal.totalCarbs));
      } else {
          // Do not reset automatically to allow manual persistence while switching
      }
  }, [linkedMeal]);

  const toggleTag = (tag: string) => {
      if (selectedTags.includes(tag)) {
          setSelectedTags(selectedTags.filter(t => t !== tag));
      } else {
          setSelectedTags([...selectedTags, tag]);
      }
  };

  const handleAddReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || !value) return;

    let finalValue = parseFloat(value);
    if (unit === GlucoseUnit.MG_DL) {
        finalValue = mgdlToMmol(finalValue);
    }

    let parts = [];
    if (notes) parts.push(notes);
    if (selectedTags.length > 0) parts.push(`[${selectedTags.join(', ')}]`);
    
    let mealId = undefined;
    if (linkedMeal) {
        mealId = linkedMeal.id;
        const itemsSummary = linkedMeal.items.map(i => i.foodName).join(', ');
        parts.push(`وجبة مسجلة: ${itemsSummary}`);
    }
    
    const finalNotes = parts.join(' | ');
    const totalRapid = (correctionDose || 0) + (typeof mealBolus === 'number' ? mealBolus : 0);

    // Construct timestamp
    const now = new Date();
    const isToday = recordDate === now.toISOString().split('T')[0];
    let timestamp;
    
    if (isToday) {
        timestamp = now.toISOString();
    } else {
        const timePart = now.toTimeString().split(' ')[0]; // HH:MM:SS
        timestamp = new Date(`${recordDate}T${timePart}`).toISOString();
    }

    const newReading: GlucoseReading = {
        id: Date.now().toString(),
        userId: targetId,
        value: finalValue,
        timestamp: timestamp,
        timeLabel,
        notes: finalNotes,
        mealId: mealId,
        insulinUnits: totalRapid > 0 ? totalRapid : undefined,
        longActingUnits: typeof longActing === 'number' ? longActing : undefined,
        correctionMethod: correctionMethod || undefined,
        carbs: typeof carbsInput === 'number' ? carbsInput : undefined // Add Carbs
    };

    dbService.addReading(newReading);
    setReadings(dbService.getReadings(targetId));
    
    // Reset Form
    setValue('');
    setNotes('');
    setCorrectionDose(0);
    setMealBolus('');
    setLongActing('');
    setCorrectionMethod('');
    setCarbsInput('');
    setSelectedTags([]);
    setReadingStatus(null);
  };

  const handleGoToMealTracker = () => {
      let mealType = 'BREAKFAST';
      if (timeLabel === MeasurementTime.PRE_LUNCH) mealType = 'LUNCH';
      else if (timeLabel === MeasurementTime.PRE_DINNER) mealType = 'DINNER';
      else if (timeLabel === MeasurementTime.SNACK) mealType = 'SNACK';

      navigate('/child/meals', {
          state: {
              date: recordDate,
              mealType: mealType
          }
      });
  };

  const getStatusText = (val: number) => {
      if (val < THRESHOLDS.HYPO) return 'هبوط';
      if (val > THRESHOLDS.CRITICAL) return 'ارتفاع حرج';
      if (val > THRESHOLDS.HIGH) return 'مرتفع';
      return 'طبيعي';
  };

  const getStatusConfig = (val: number) => {
      if (val < THRESHOLDS.HYPO) return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: <ArrowDown size={14} /> };
      if (val > THRESHOLDS.CRITICAL) return { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: <ChevronsUp size={14} /> };
      if (val > THRESHOLDS.HIGH) return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: <ArrowUp size={14} /> };
      return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <Check size={14} /> };
  };

  const isPreMeal = [MeasurementTime.PRE_BREAKFAST, MeasurementTime.PRE_LUNCH, MeasurementTime.PRE_DINNER, MeasurementTime.SNACK].includes(timeLabel);
  const canAdd = user?.role !== 'DOCTOR'; 
  
  // --- STATS CALCULATIONS FOR SELECTED DATE ---
  const selectedDateReadings = useMemo(() => {
      return readings.filter(r => new Date(r.timestamp).toISOString().split('T')[0] === recordDate);
  }, [readings, recordDate]);

  const lastReading = selectedDateReadings.length > 0 ? selectedDateReadings[0] : null; 

  const totalDailyRapid = selectedDateReadings.reduce((sum, r) => sum + (r.insulinUnits || 0), 0);
  const totalDailyBasal = selectedDateReadings.reduce((sum, r) => sum + (r.longActingUnits || 0), 0);

  const tirStats = useMemo(() => {
      if (selectedDateReadings.length === 0) return [];
      let low = 0, normal = 0, high = 0, critical = 0;
      selectedDateReadings.forEach(r => {
          if (r.value < THRESHOLDS.HYPO) low++;
          else if (r.value > THRESHOLDS.CRITICAL) critical++;
          else if (r.value > THRESHOLDS.HIGH) high++;
          else normal++;
      });
      return [
          { name: 'هبوط', value: low, color: COLORS.LOW },
          { name: 'طبيعي', value: normal, color: COLORS.NORMAL },
          { name: 'مرتفع', value: high, color: COLORS.HIGH },
          { name: 'حرج', value: critical, color: COLORS.CRITICAL },
      ].filter(d => d.value > 0);
  }, [selectedDateReadings]);

  const tirPercentage = useMemo(() => {
      const normal = tirStats.find(s => s.name === 'طبيعي')?.value || 0;
      const total = tirStats.reduce((a, b) => a + b.value, 0);
      return total === 0 ? 0 : Math.round((normal / total) * 100);
  }, [tirStats]);

  const dailyStats = useMemo(() => {
      if (selectedDateReadings.length === 0) return null;
      const values = selectedDateReadings.map(r => r.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((a,b) => a+b, 0) / values.length;
      return { min, max, avg };
  }, [selectedDateReadings]);

  const dVal = (v: number) => targetUser?.medicalData?.preferredUnit === GlucoseUnit.MG_DL ? Math.round(mmolToMgdl(v)) : v.toFixed(1);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* 1. DASHBOARD HEADER (Stats Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         
         {/* CARD 1: Last Reading on Selected Date */}
         <div className={`p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden flex flex-col justify-between h-40 transition-colors duration-500 ${lastReading ? getStatusConfig(lastReading.value).bg : 'bg-slate-50'}`}>
            <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Activity size={14}/> آخر قراءة ({recordDate})</span>
                {lastReading && <span className="text-[10px] bg-white/50 px-2 py-1 rounded-full font-mono text-slate-600">{new Date(lastReading.timestamp).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span>}
            </div>
            <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-5xl font-bold font-mono tracking-tighter ${lastReading ? getStatusConfig(lastReading.value).color : 'text-slate-300'}`}>
                    {lastReading ? dVal(lastReading.value) : '--'}
                </span>
                <span className="text-sm text-slate-400 font-bold">{targetUser?.medicalData?.preferredUnit}</span>
            </div>
            <div className="mt-auto pt-2 border-t border-black/5">
                <p className={`text-xs font-bold flex items-center gap-1 ${lastReading ? getStatusConfig(lastReading.value).color : 'text-slate-400'}`}>
                    {lastReading ? (
                        <>{getStatusText(lastReading.value)} {getStatusConfig(lastReading.value).icon}</>
                    ) : 'لا توجد بيانات لهذا اليوم'}
                </p>
            </div>
         </div>

         {/* CARD 2: Time In Range (TIR) */}
         <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 h-40 flex items-center relative">
             <div className="flex-1">
                 <h3 className="text-xs font-bold text-slate-500 mb-1">في النطاق (TIR)</h3>
                 <p className="text-3xl font-bold text-emerald-600 font-mono">{tirPercentage}%</p>
                 <p className="text-[10px] text-slate-400 mt-1">لهذا اليوم</p>
             </div>
             <div className="w-24 h-24 relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={tirStats} innerRadius={25} outerRadius={40} paddingAngle={2} dataKey="value">
                            {tirStats.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                    </PieChart>
                 </ResponsiveContainer>
             </div>
         </div>

         {/* CARD 3: Daily Summary & Date Picker */}
         <div className="bg-slate-800 text-white p-5 rounded-3xl shadow-lg h-40 flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
             
             {/* DATE PICKER inside Summary */}
             <div className="flex justify-between items-start relative z-10">
                 <h3 className="text-xs font-bold text-slate-400 flex items-center gap-2"><Activity size={14}/> ملخص اليوم</h3>
                 <input 
                    type="date" 
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white font-bold outline-none focus:bg-white/20"
                 />
             </div>
             
             {dailyStats ? (
                 <div className="grid grid-cols-3 gap-2 relative z-10 mt-2">
                     <div className="text-center">
                         <span className="block text-[10px] text-slate-400 mb-1">متوسط</span>
                         <span className="block text-lg font-bold font-mono text-blue-300">{dVal(dailyStats.avg)}</span>
                     </div>
                     <div className="text-center border-x border-white/10">
                         <span className="block text-[10px] text-slate-400 mb-1">أدنى</span>
                         <span className="block text-lg font-bold font-mono text-emerald-400 flex items-center justify-center gap-1">
                             {dVal(dailyStats.min)} <TrendingDown size={12}/>
                         </span>
                     </div>
                     <div className="text-center">
                         <span className="block text-[10px] text-slate-400 mb-1">أعلى</span>
                         <span className="block text-lg font-bold font-mono text-orange-400 flex items-center justify-center gap-1">
                             {dVal(dailyStats.max)} <TrendingUp size={12}/>
                         </span>
                     </div>
                 </div>
             ) : (
                 <div className="flex items-center justify-center h-full text-slate-500 text-xs">لا توجد قراءات</div>
             )}
             
             <div className="mt-auto pt-2 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-400 relative z-10">
                 <span>إجمالي الأنسولين:</span>
                 <span className="font-mono font-bold text-white">{totalDailyRapid + totalDailyBasal} وحدة</span>
             </div>
         </div>
      </div>

      {/* 2. Add New Reading Form (IMPROVED) */}
      {canAdd && (
      <div className={`bg-white p-6 rounded-3xl shadow-md border-2 transition-colors duration-300 relative overflow-hidden
          ${readingStatus === 'HIGH' ? 'border-orange-100 shadow-orange-100' : readingStatus === 'LOW' ? 'border-red-100 shadow-red-100' : 'border-slate-100'}
      `}>
          <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Plus className="bg-slate-100 text-slate-600 rounded-full p-1" size={24} />
                  تسجيل قياس جديد
              </h3>
              {readingStatus && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold animate-pulse
                      ${readingStatus === 'HIGH' ? 'bg-orange-100 text-orange-600' : readingStatus === 'LOW' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}
                  `}>
                      {getStatusText(parseFloat(value))}
                  </span>
              )}
          </div>

          <form onSubmit={handleAddReading} className="space-y-6">
              <div className="bg-slate-50 p-2 rounded-lg text-center text-xs text-slate-500 font-bold mb-2">
                  سيتم التسجيل بتاريخ: <span className="text-indigo-600">{recordDate}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Value Input */}
                <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-500 mb-2">القيمة</label>
                    <div className="flex shadow-sm rounded-xl overflow-hidden border border-slate-200 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-200 transition">
                        <input 
                            type="number" 
                            step={unit === GlucoseUnit.MMOL_L ? "0.1" : "1"} 
                            required
                            value={value} 
                            onChange={e => setValue(e.target.value)} 
                            className="w-full p-3 font-bold text-2xl text-center text-slate-700 outline-none"
                            placeholder="0.0"
                        />
                        <select 
                            value={unit} 
                            onChange={e => setUnit(e.target.value as GlucoseUnit)}
                            className="bg-slate-50 border-l border-slate-200 px-3 text-xs font-bold text-slate-500 outline-none cursor-pointer hover:bg-slate-100"
                        >
                            <option value={GlucoseUnit.MMOL_L}>mmol/L</option>
                            <option value={GlucoseUnit.MG_DL}>mg/dL</option>
                        </select>
                    </div>
                </div>

                {/* Time Input */}
                <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-500 mb-2">التوقيت</label>
                    <select 
                        value={timeLabel} 
                        onChange={e => setTimeLabel(e.target.value as MeasurementTime)}
                        className="w-full p-3.5 border border-slate-200 rounded-xl font-bold text-slate-600 text-sm bg-white outline-none focus:border-sky-500"
                    >
                        {TIME_LABELS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                {/* Carbs Input (NEW: with Button) */}
                {isPreMeal && (
                    <div className="col-span-1 bg-emerald-50 p-2 rounded-xl border border-emerald-100 flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                <Wheat size={10}/> كارب (جرام)
                            </label>
                            {/* Show 'Calculate' button if no meal linked, otherwise show linked status */}
                            {!linkedMeal ? (
                                <button
                                    type="button"
                                    onClick={handleGoToMealTracker}
                                    className="text-[9px] bg-white border border-emerald-200 text-emerald-600 px-2 py-0.5 rounded shadow-sm hover:bg-emerald-100 transition flex items-center gap-1"
                                    title="حساب الكارب من الوجبات"
                                >
                                    <Calculator size={10} /> حساب
                                </button>
                            ) : (
                                <span className="text-[9px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <CheckCircle size={8} /> مرتبط
                                </span>
                            )}
                        </div>
                        <input 
                            type="number" 
                            value={carbsInput} 
                            onChange={e => setCarbsInput(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full p-2 border border-emerald-200 rounded-lg text-center font-bold text-emerald-800 bg-white text-sm outline-none focus:border-emerald-400"
                            placeholder="0"
                        />
                    </div>
                )}

                {/* Insulin Inputs */}
                {isPreMeal && (
                    <div className="col-span-1 bg-indigo-50 p-2 rounded-xl border border-indigo-100">
                        <label className="block text-[10px] font-bold text-indigo-700 mb-1 flex items-center gap-1">
                            <UtensilsCrossed size={10}/> سريع (وجبة)
                        </label>
                        <input 
                            type="number" 
                            value={mealBolus} 
                            onChange={e => setMealBolus(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full p-2 border border-indigo-200 rounded-lg text-center font-bold text-indigo-800 bg-white text-sm outline-none focus:border-indigo-400"
                            placeholder="وحدات"
                        />
                    </div>
                )}

                <div className={`col-span-1 ${!isPreMeal ? 'lg:col-span-2' : ''} bg-purple-50 p-2 rounded-xl border border-purple-100`}>
                    <label className="block text-[10px] font-bold text-purple-700 mb-1 flex items-center gap-1">
                        <Moon size={10}/> قاعدي (طويل)
                    </label>
                    <input 
                        type="number" 
                        value={longActing} 
                        onChange={e => setLongActing(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full p-2 border border-purple-200 rounded-lg text-center font-bold text-purple-800 bg-white text-sm outline-none focus:border-purple-400"
                        placeholder="وحدات"
                    />
                </div>
              </div>

              {/* Correction & Hypo Logic */}
              {readingStatus === 'HIGH' && (
                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 flex items-center justify-between animate-slideUp">
                        <div>
                             <label className="text-xs font-bold text-orange-800 flex items-center gap-1">
                                <Syringe size={14}/> جرعة التصحيح
                            </label>
                            <p className="text-[10px] text-orange-600 mt-0.5">محسوبة بناءً على معامل ISF</p>
                        </div>
                        <div className="bg-white px-4 py-1 rounded-lg border border-orange-200 text-xl font-bold text-orange-700 shadow-sm">
                            {correctionDose} <span className="text-xs font-normal">u</span>
                        </div>
                    </div>
                )}

                {readingStatus === 'LOW' && (
                    <div className="bg-red-50 p-3 rounded-xl border border-red-200 animate-slideUp">
                        <label className="block text-xs font-bold text-red-800 mb-2 flex items-center gap-1">
                            <HeartPulse size={14}/> إجراء التصحيح (عصير/تمر)
                        </label>
                        <input 
                            type="text" 
                            value={correctionMethod} 
                            onChange={e => setCorrectionMethod(e.target.value)} 
                            placeholder="ماذا تناولت لرفع السكر؟"
                            className="w-full p-2 border border-red-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-red-500 outline-none"
                        />
                    </div>
                )}

              {/* MEAL LINK SECTION (DETAILS) */}
              {isPreMeal && linkedMeal && (
                  <div className="border-t border-slate-100 pt-4">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
                          <div className="bg-emerald-200 p-1.5 rounded-full text-emerald-800">
                              <CheckCircle size={16} />
                          </div>
                          <div className="flex-1 overflow-hidden">
                              <h4 className="font-bold text-emerald-800 text-sm truncate">وجبة مسجلة ({Math.round(linkedMeal.totalCarbs)}g كارب)</h4>
                              <p className="text-xs text-emerald-600 truncate">{linkedMeal.items.map(i => i.foodName).join(', ')}</p>
                          </div>
                          <button 
                            type="button"
                            onClick={handleGoToMealTracker}
                            className="text-xs text-emerald-700 underline"
                          >
                              تعديل
                          </button>
                      </div>
                  </div>
              )}

              {/* QUICK TAGS */}
              <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Tag size={12}/> وسوم سريعة</label>
                  <div className="flex flex-wrap gap-2">
                      {QUICK_TAGS.map(tag => (
                          <button
                            type="button"
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                selectedTags.includes(tag) 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                              {tag}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="flex justify-end pt-2">
                  <button type="submit" className="w-full md:w-auto md:px-12 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 transform active:scale-95">
                      <CheckCircle size={20} /> حفظ القياس
                  </button>
              </div>
          </form>
      </div>
      )}

      {/* 3. Charts */}
      {/* Pass the readings for the selected date only */}
      <GlucoseChart data={readings} preferredUnit={targetUser?.medicalData?.preferredUnit} />

      {/* 4. History Table (ORDERED STRICTLY BY TIME LABELS) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 bg-white border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <CalendarIcon size={18} className="text-indigo-600"/> سجل اليوم ({recordDate})
              </h3>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{selectedDateReadings.length} قراءات</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-500 text-xs border-b border-slate-100">
                    <tr>
                        <th className="p-4 w-1/4">التوقيت</th>
                        <th className="p-4">القراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {/* Map through FIXED TIME LABELS to ensure order: Waking -> ... -> Sleep */}
                    {TIME_LABELS.map(slotLabel => {
                        // Get all readings for this slot on this day
                        const slotReadings = selectedDateReadings
                            .filter(r => r.timeLabel === slotLabel)
                            .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                        if (slotReadings.length === 0) return null;

                        return (
                            <tr key={slotLabel} className="hover:bg-slate-50 transition group align-top">
                                <td className="p-4 text-slate-700 font-bold text-sm bg-slate-50/50">
                                    {slotLabel}
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-3">
                                        {slotReadings.map((reading, idx) => {
                                            const statusConfig = getStatusConfig(reading.value);
                                            const hasInsulin = (reading.insulinUnits || 0) > 0 || (reading.longActingUnits || 0) > 0;
                                            const hasCarbs = reading.carbs && reading.carbs > 0;
                                            
                                            return (
                                                <div key={reading.id} className="flex items-center justify-between border-b border-dashed border-slate-200 last:border-0 pb-2 last:pb-0">
                                                    <div className="flex items-center gap-4">
                                                        {/* Time of Day */}
                                                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 min-w-[60px]">
                                                            <Clock size={10}/> {new Date(reading.timestamp).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                                                        </span>

                                                        {/* Value Badge */}
                                                        <div className={`flex items-center gap-2 w-fit px-3 py-1 rounded-lg border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color}`}>
                                                            {statusConfig.icon}
                                                            <span className="font-bold font-mono text-lg">{dVal(reading.value)}</span>
                                                        </div>

                                                        {/* Status Text */}
                                                        <span className={`text-[10px] font-bold ${statusConfig.color}`}>
                                                            {getStatusText(reading.value)}
                                                        </span>
                                                    </div>

                                                    {/* Details (Insulin/Carbs/Notes) */}
                                                    <div className="flex items-center gap-2">
                                                        {hasCarbs && (
                                                            <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                                                <Wheat size={10} /> {reading.carbs}g
                                                            </div>
                                                        )}

                                                        {hasInsulin && (
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                                <Syringe size={10}/> 
                                                                {reading.insulinUnits && <span>سريع: {reading.insulinUnits}</span>}
                                                                {reading.insulinUnits && reading.longActingUnits && <span className="mx-1">|</span>}
                                                                {reading.longActingUnits && <span>طويل: {reading.longActingUnits}</span>}
                                                            </div>
                                                        )}
                                                        {reading.notes && (
                                                            <div className="text-[10px] text-slate-400 truncate max-w-[100px]" title={reading.notes}>
                                                                📝 {reading.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {selectedDateReadings.length === 0 && (
                        <tr><td colSpan={2} className="p-8 text-center text-slate-400">لا توجد سجلات لهذا اليوم</td></tr>
                    )}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};
