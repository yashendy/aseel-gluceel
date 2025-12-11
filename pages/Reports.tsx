
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../App';
import { dbService } from '../services/dbService';
import { GlucoseReading, GlucoseUnit, MeasurementTime, User, MealEntry } from '../types';
import { THRESHOLDS, TIME_LABELS, mmolToMgdl, mgdlToMmol } from '../constants';
import { 
    Calendar, Filter, FileText, PieChart, TrendingUp, 
    ArrowRight, ArrowLeft, RefreshCw, Eye, EyeOff, BrainCircuit, 
    Activity, Syringe, Utensils, AlertTriangle, ArrowUp, ArrowDown, Minus, Check, ChevronsUp, ChevronRight, Tag
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceDot } from 'recharts';
import { useNavigate } from 'react-router-dom';

// ... Types & Helpers ...
type TimeRange = 'WEEK' | '2WEEKS' | 'MONTH' | '3MONTHS' | 'CUSTOM';

interface PeriodStats {
    readings: GlucoseReading[];
    avg: number;
    count: number;
    hypos: number;
    hypoPercent: number;
    target: number;
    targetPercent: number;
    high: number;
    highPercent: number;
    critical: number;
    criticalPercent: number;
}

const COLORS = {
    HYPO: '#ef4444',     // Red
    NORMAL: '#10b981',   // Emerald
    HIGH: '#f97316',     // Orange
    CRITICAL: '#8b5cf6'  // Purple
};

export const Reports = () => {
    const { user, selectedChildId } = useAuth();
    const navigate = useNavigate();
    const targetId = selectedChildId || user?.id;

    // --- State ---
    const [readings, setReadings] = useState<GlucoseReading[]>([]);
    const [meals, setMeals] = useState<MealEntry[]>([]);
    
    // Filters
    const [unit, setUnit] = useState<GlucoseUnit>(GlucoseUnit.MMOL_L);
    const [rangeType, setRangeType] = useState<TimeRange>('WEEK');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Comparison Mode
    const [isComparison, setIsComparison] = useState(false);
    const [compStartDate, setCompStartDate] = useState('');
    const [compEndDate, setCompEndDate] = useState('');

    // View Options
    const [showDetails, setShowDetails] = useState(false); // Toggle small details in table
    const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null); // NEW: Tag Filter

    // --- Effects ---
    useEffect(() => {
        if (targetId) {
            // Load Readings
            const allReadings = dbService.getReadings(targetId);
            setReadings(allReadings);
            
            // Load Meals (New)
            const allMeals = dbService.getMealEntries(targetId);
            setMeals(allMeals);

            // Load User Preference for Unit
            let foundUser: User | undefined;
            if (user?.id === targetId) foundUser = user;
            else foundUser = dbService.getChildrenByParent(user?.id || '').find(c => c.id === targetId) 
                          || dbService.getPatientsByDoctor(user?.id || '').find(p => p.id === targetId);
            
            if (foundUser?.medicalData?.preferredUnit) {
                setUnit(foundUser.medicalData.preferredUnit);
            }

            // Set Default Dates (Last 7 Days)
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - 7);
            setEndDate(end.toISOString().split('T')[0]);
            setStartDate(start.toISOString().split('T')[0]);
        }
    }, [targetId, user]);

    // Handle Quick Range Select
    const handleRangeChange = (type: TimeRange) => {
        setRangeType(type);
        const end = new Date();
        const start = new Date();
        
        switch (type) {
            case 'WEEK': start.setDate(end.getDate() - 7); break;
            case '2WEEKS': start.setDate(end.getDate() - 14); break;
            case 'MONTH': start.setMonth(end.getMonth() - 1); break;
            case '3MONTHS': start.setMonth(end.getMonth() - 3); break;
            case 'CUSTOM': return; // Do nothing, let user pick
        }
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const handleNavigateToMeal = (date: string, slot: MeasurementTime) => {
        // Map slot back to meal type used in MealTracker UI
        let mealType = 'BREAKFAST';
        if (slot === MeasurementTime.PRE_LUNCH) mealType = 'LUNCH';
        else if (slot === MeasurementTime.PRE_DINNER) mealType = 'DINNER';
        else if (slot === MeasurementTime.SNACK) mealType = 'SNACK';
        
        navigate('/child/meals', { 
            state: { 
                date: date, // YYYY-MM-DD
                mealType: mealType 
            } 
        });
    };

    // --- Data Processing ---
    
    // Helper: Filter readings by date range
    const filterReadings = (start: string, end: string) => {
        if (!start || !end) return [];
        const s = new Date(start); s.setHours(0,0,0,0);
        const e = new Date(end); e.setHours(23,59,59,999);
        return readings.filter(r => {
            const d = new Date(r.timestamp);
            return d >= s && d <= e;
        }).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    };

    // Helper: Calculate Stats
    const calculateStats = (data: GlucoseReading[]): PeriodStats => {
        if (data.length === 0) return { readings: [], avg: 0, count: 0, hypos: 0, hypoPercent: 0, target: 0, targetPercent: 0, high: 0, highPercent: 0, critical: 0, criticalPercent: 0 };

        const count = data.length;
        const sum = data.reduce((acc, r) => acc + r.value, 0);
        
        let hypos = 0, target = 0, high = 0, critical = 0;

        data.forEach(r => {
            if (r.value < THRESHOLDS.HYPO) hypos++;
            else if (r.value > THRESHOLDS.CRITICAL) critical++;
            else if (r.value > THRESHOLDS.HIGH) high++;
            else target++;
        });

        return {
            readings: data,
            avg: sum / count,
            count,
            hypos, hypoPercent: Math.round((hypos / count) * 100),
            target, targetPercent: Math.round((target / count) * 100),
            high, highPercent: Math.round((high / count) * 100),
            critical, criticalPercent: Math.round((critical / count) * 100)
        };
    };

    const primaryData = useMemo(() => filterReadings(startDate, endDate), [readings, startDate, endDate]);
    const primaryStats = useMemo(() => calculateStats(primaryData), [primaryData]);

    const compData = useMemo(() => isComparison ? filterReadings(compStartDate, compEndDate) : [], [readings, isComparison, compStartDate, compEndDate]);
    const compStats = useMemo(() => calculateStats(compData), [compData]);

    // --- EXTRACT TAGS LOGIC (NEW) ---
    const availableTags = useMemo(() => {
        const tags = new Set<string>();
        primaryData.forEach(r => {
            if (r.notes) {
                // Regex to find content inside [] e.g. [Sports, Stress]
                const match = r.notes.match(/\[(.*?)\]/);
                if (match && match[1]) {
                    const parts = match[1].split(',').map(t => t.trim());
                    parts.forEach(p => tags.add(p));
                }
            }
        });
        return Array.from(tags);
    }, [primaryData]);

    // --- Unit Conversion Helper for Display ---
    const displayVal = (val: number) => {
        if (unit === GlucoseUnit.MG_DL) return Math.round(mmolToMgdl(val));
        return val.toFixed(1);
    };

    // --- Matrix Table Data Construction ---
    // Group primary readings by Date -> TimeSlot
    const tableMatrix = useMemo(() => {
        const grouped: Record<string, Record<string, GlucoseReading>> = {};
        
        primaryData.forEach(r => {
            const dateKey = new Date(r.timestamp).toLocaleDateString('en-CA'); // YYYY-MM-DD
            if (!grouped[dateKey]) grouped[dateKey] = {};
            grouped[dateKey][r.timeLabel] = r;
        });

        // Convert to array sorted by date descending (newest top)
        return Object.keys(grouped).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()).map(date => ({
            date,
            slots: grouped[date]
        }));
    }, [primaryData]);

    // Pie Chart Data
    const pieData = [
        { name: 'هبوط', value: primaryStats.hypos, color: COLORS.HYPO },
        { name: 'طبيعي', value: primaryStats.target, color: COLORS.NORMAL },
        { name: 'مرتفع', value: primaryStats.high, color: COLORS.HIGH },
        { name: 'حرج', value: primaryStats.critical, color: COLORS.CRITICAL },
    ].filter(d => d.value > 0);

    // AI Summary Text
    const getAISummary = () => {
        if (primaryStats.count === 0) return "لا توجد بيانات كافية للتحليل.";
        
        const insights = [];
        if (primaryStats.targetPercent > 70) insights.push("✅ ممتاز! نسبة السكر في النطاق الطبيعي عالية جداً.");
        else if (primaryStats.targetPercent > 50) insights.push("⚠️ مستوى السكر جيد، لكن نحتاج لزيادة الوقت في النطاق الطبيعي.");
        
        if (primaryStats.hypoPercent > 5) insights.push("🚨 هناك تكرار لحالات الهبوط، يرجى مراجعة جرعات القاعدي أو معامل التصحيح.");
        if (primaryStats.criticalPercent > 10) insights.push("⚠️ هناك ارتفاعات حرجة متكررة، تأكد من حساب الكارب بدقة.");

        if (isComparison && compStats.count > 0) {
            const diff = primaryStats.targetPercent - compStats.targetPercent;
            if (diff > 5) insights.push(`🎉 تحسن رائع! ارتفعت نسبة الانتظام بنسبة ${diff}% عن الفترة السابقة.`);
            else if (diff < -5) insights.push(`📉 تراجعت نسبة الانتظام بنسبة ${Math.abs(diff)}% مقارنة بالفترة السابقة.`);
        }

        // New Insight based on Tags
        if (availableTags.length > 0) {
            insights.push(`💡 تم تسجيل أنشطة/حالات: ${availableTags.join('، ')}. استخدم الفلتر في المخطط لرؤية تأثيرها.`);
        }

        return insights.join("\n");
    };

    // --- Style Helper ---
    const getStatusConfig = (val: number) => {
        if (val < THRESHOLDS.HYPO) return { 
            bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', 
            icon: <ArrowDown size={14} strokeWidth={3} /> 
        };
        if (val > THRESHOLDS.CRITICAL) return { 
            bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', 
            icon: <ChevronsUp size={14} strokeWidth={3} /> 
        };
        if (val > THRESHOLDS.HIGH) return { 
            bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', 
            icon: <ArrowUp size={14} strokeWidth={3} /> 
        };
        if (val > THRESHOLDS.NORMAL_MAX) return { 
            bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', 
            icon: <ArrowUp size={14} className="rotate-45" strokeWidth={3} /> 
        };
        // Normal
        return { 
            bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', 
            icon: <Check size={14} strokeWidth={3} /> 
        };
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-10">
            
            {/* 1. Header & Filters */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-indigo-600" /> التقارير الطبية
                    </h2>
                    
                    {/* Unit Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setUnit(GlucoseUnit.MMOL_L)}
                            className={`px-3 py-1 rounded text-xs font-bold transition ${unit === GlucoseUnit.MMOL_L ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                        >
                            mmol/L
                        </button>
                        <button 
                            onClick={() => setUnit(GlucoseUnit.MG_DL)}
                            className={`px-3 py-1 rounded text-xs font-bold transition ${unit === GlucoseUnit.MG_DL ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                        >
                            mg/dL
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Quick Ranges */}
                    <div className="lg:col-span-4 flex flex-wrap gap-2 mb-2">
                        <button onClick={() => handleRangeChange('WEEK')} className={`px-4 py-2 rounded-full text-xs font-bold transition ${rangeType === 'WEEK' ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>أسبوع</button>
                        <button onClick={() => handleRangeChange('2WEEKS')} className={`px-4 py-2 rounded-full text-xs font-bold transition ${rangeType === '2WEEKS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>أسبوعين</button>
                        <button onClick={() => handleRangeChange('MONTH')} className={`px-4 py-2 rounded-full text-xs font-bold transition ${rangeType === 'MONTH' ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>شهر</button>
                        <button onClick={() => handleRangeChange('3MONTHS')} className={`px-4 py-2 rounded-full text-xs font-bold transition ${rangeType === '3MONTHS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>3 شهور</button>
                    </div>

                    {/* Date Pickers */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-500 mb-1">من تاريخ</label>
                        <input type="date" value={startDate} onChange={e => {setStartDate(e.target.value); setRangeType('CUSTOM');}} className="w-full bg-white border border-slate-300 rounded p-2 text-sm font-bold" />
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-500 mb-1">إلى تاريخ</label>
                        <input type="date" value={endDate} onChange={e => {setEndDate(e.target.value); setRangeType('CUSTOM');}} className="w-full bg-white border border-slate-300 rounded p-2 text-sm font-bold" />
                    </div>

                    {/* Comparison Toggle */}
                    <div className={`col-span-1 md:col-span-2 p-3 rounded-xl border transition-colors ${isComparison ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer select-none">
                                <input type="checkbox" checked={isComparison} onChange={e => setIsComparison(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                تفعيل المقارنة
                            </label>
                            {isComparison && <span className="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-bold">مقارنة بمرحلة سابقة</span>}
                        </div>
                        
                        {isComparison && (
                            <div className="flex gap-2 animate-fadeIn">
                                <input type="date" value={compStartDate} onChange={e => setCompStartDate(e.target.value)} className="w-full bg-white border border-indigo-200 rounded p-1.5 text-xs" placeholder="من" />
                                <span className="self-center text-slate-400">-</span>
                                <input type="date" value={compEndDate} onChange={e => setCompEndDate(e.target.value)} className="w-full bg-white border border-indigo-200 rounded p-1.5 text-xs" placeholder="إلى" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Stats Summary (Comparison Logic) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ... existing stats cards ... */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-500 mb-4 flex items-center gap-2">
                        <Activity className="text-indigo-600" size={18} /> ملخص الفترة الحالية
                        <span className="text-xs font-normal text-slate-400">({primaryStats.count} قراءة)</span>
                    </h3>
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-center">
                            <p className="text-xs text-slate-400 mb-1">المتوسط</p>
                            <p className="text-2xl font-bold font-mono text-slate-800">{displayVal(primaryStats.avg)}</p>
                            <p className="text-[10px] text-slate-400">{unit}</p>
                        </div>
                        <div className="w-px h-10 bg-slate-100"></div>
                        <div className="text-center">
                            <p className="text-xs text-slate-400 mb-1">في النطاق</p>
                            <p className="text-2xl font-bold font-mono text-emerald-600">{primaryStats.targetPercent}%</p>
                        </div>
                        <div className="w-px h-10 bg-slate-100"></div>
                        <div className="text-center">
                            <p className="text-xs text-slate-400 mb-1">A1C تقديري</p>
                            <p className="text-2xl font-bold font-mono text-indigo-600">{(primaryStats.avg * 0.03 + 2.6).toFixed(1)}%</p>
                        </div>
                    </div>
                </div>

                {isComparison && (
                    <div className="bg-indigo-50 p-6 rounded-2xl shadow-sm border border-indigo-100 animate-fadeIn">
                        <h3 className="text-sm font-bold text-indigo-800 mb-4 flex items-center gap-2">
                            <RefreshCw className="text-indigo-600" size={18} /> مقارنة بالفترة السابقة
                            <span className="text-xs font-normal text-indigo-400">({compStats.count} قراءة)</span>
                        </h3>
                        {compStats.count > 0 ? (
                            <div className="flex justify-between items-center">
                                <div className="text-center">
                                    <p className="text-xs text-indigo-400 mb-1">المتوسط</p>
                                    <div className="flex items-center gap-1 justify-center">
                                        <p className="text-xl font-bold font-mono text-indigo-900">{displayVal(compStats.avg)}</p>
                                        {primaryStats.avg < compStats.avg ? <ArrowDown size={14} className="text-emerald-600" /> : <ArrowUp size={14} className="text-red-500" />}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-indigo-400 mb-1">في النطاق</p>
                                    <div className="flex items-center gap-1 justify-center">
                                        <p className="text-xl font-bold font-mono text-indigo-900">{compStats.targetPercent}%</p>
                                        {primaryStats.targetPercent > compStats.targetPercent ? <ArrowUp size={14} className="text-emerald-600" /> : <ArrowDown size={14} className="text-red-500" />}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-indigo-400 mb-1">الفرق</p>
                                    <p className={`text-lg font-bold font-mono ${primaryStats.targetPercent >= compStats.targetPercent ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {primaryStats.targetPercent >= compStats.targetPercent ? '+' : ''}{primaryStats.targetPercent - compStats.targetPercent}%
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-indigo-400 text-sm py-4">لا توجد بيانات في فترة المقارنة</p>
                        )}
                    </div>
                )}
            </div>

            {/* 3. The Matrix Table */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Calendar size={18} /> سجل القراءات التفصيلي
                    </h3>
                    <button 
                        onClick={() => setShowDetails(!showDetails)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${showDetails ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-slate-200 text-slate-600'}`}
                    >
                        {showDetails ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showDetails ? 'إخفاء التفاصيل' : 'إظهار التفاصيل'}
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className="bg-slate-100 text-slate-600 text-xs font-bold">
                                <th className="p-3 border-b border-slate-200 min-w-[100px] sticky right-0 bg-slate-100 z-10">التاريخ</th>
                                {TIME_LABELS.map(label => (
                                    <th key={label} className="p-3 border-b border-slate-200 min-w-[120px]">{label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {tableMatrix.map((row, idx) => {
                                // Calculate total daily insulin for this specific date row
                                const totalInsulin = (Object.values(row.slots) as GlucoseReading[]).reduce((sum, r) => sum + (r.insulinUnits || 0), 0);
                                
                                return (
                                <tr key={row.date} className="hover:bg-slate-50 transition border-b border-slate-100 last:border-0">
                                    <td className="p-3 font-bold text-slate-700 sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-100">
                                        <div className="flex flex-col items-center gap-1">
                                            <span>{new Date(row.date).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'numeric' })}</span>
                                            {totalInsulin > 0 && (
                                                <div className="flex items-center justify-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-[10px] border border-blue-100 shadow-sm w-full" title="إجمالي الأنسولين المسجل اليوم">
                                                    <Syringe size={10} />
                                                    <span>{totalInsulin} u</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    {TIME_LABELS.map(timeLabel => {
                                        const reading = row.slots[timeLabel];
                                        if (!reading) return <td key={timeLabel} className="p-3 bg-slate-50/30">--</td>;
                                        
                                        const style = getStatusConfig(reading.value);
                                        
                                        // Check if there is a linked meal for this slot
                                        // Condition: Reading timeLabel is Pre-Meal AND there exists a MealEntry for this date/timeLabel
                                        const linkedMeal = meals.find(m => m.date === row.date && m.timeLabel === timeLabel);
                                        const isMealSlot = [MeasurementTime.PRE_BREAKFAST, MeasurementTime.PRE_LUNCH, MeasurementTime.PRE_DINNER].includes(timeLabel as MeasurementTime);

                                        return (
                                            <td key={timeLabel} className="p-2 align-top">
                                                <div className={`rounded-xl border p-2 flex flex-col items-center justify-center gap-1 min-h-[60px] relative ${style.bg} ${style.border} ${style.text}`}>
                                                    <div className="flex items-center gap-1">
                                                        {style.icon}
                                                        <span className="text-lg font-bold font-mono leading-none">
                                                            {displayVal(reading.value)}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* NEW: Carbs Badge Link */}
                                                    {isMealSlot && linkedMeal && (
                                                        <div 
                                                            onClick={(e) => { e.stopPropagation(); handleNavigateToMeal(row.date, timeLabel as MeasurementTime); }}
                                                            className="flex items-center justify-center gap-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded-full cursor-pointer shadow-sm mt-1 transition-transform active:scale-95 border border-emerald-400"
                                                            title="عرض تفاصيل الوجبة"
                                                        >
                                                            <Utensils size={10} />
                                                            <span>{Math.round(linkedMeal.totalCarbs)}g كارب</span>
                                                            <ChevronRight size={10} className="mr-[-2px]"/>
                                                        </div>
                                                    )}

                                                    {/* Details: Only show if toggle ON */}
                                                    {showDetails && (
                                                        <div className="flex flex-col gap-1 w-full pt-2 mt-1 border-t border-black/5">
                                                            {/* Insulin Dose */}
                                                            {reading.insulinUnits && (
                                                                <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-orange-700 bg-white/50 rounded px-1">
                                                                    <Syringe size={10} /> {reading.insulinUnits}u
                                                                </div>
                                                            )}

                                                            {/* Correction Method (Hypo) */}
                                                            {reading.correctionMethod && (
                                                                <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-red-700 bg-white/50 rounded px-1 truncate max-w-full" title={reading.correctionMethod}>
                                                                    <AlertTriangle size={10} /> {reading.correctionMethod}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            )})}
                            {tableMatrix.length === 0 && (
                                <tr>
                                    <td colSpan={TIME_LABELS.length + 1} className="p-8 text-center text-slate-400">لا توجد قراءات في هذه الفترة</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pie Chart: Status Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 lg:col-span-1 flex flex-col items-center justify-center">
                    {/* ... pie chart content ... */}
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 self-start w-full border-b border-slate-100 pb-2">
                        <PieChart size={18} /> توزيع القراءات
                    </h3>
                    <div className="w-full h-[250px] relative">
                         <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={pieData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <ReTooltip />
                            </RePieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                            <span className="block text-3xl font-bold text-slate-700">{primaryStats.count}</span>
                            <span className="text-xs text-slate-400">قراءة</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center mt-4">
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> طبيعي ({primaryStats.targetPercent}%)</div>
                        <div className="flex items-center gap-1 text-xs font-bold text-red-500"><span className="w-2 h-2 rounded-full bg-red-500"></span> هبوط ({primaryStats.hypoPercent}%)</div>
                        <div className="flex items-center gap-1 text-xs font-bold text-orange-500"><span className="w-2 h-2 rounded-full bg-orange-500"></span> مرتفع ({primaryStats.highPercent}%)</div>
                        <div className="flex items-center gap-1 text-xs font-bold text-purple-600"><span className="w-2 h-2 rounded-full bg-purple-500"></span> حرج ({primaryStats.criticalPercent}%)</div>
                    </div>
                </div>

                {/* Line Chart: Trends with TAG VISUALIZATION */}
                <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 lg:col-span-2">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <TrendingUp size={18} /> مسار السكر والوسوم
                    </h3>
                    
                    {/* Tags Filter Bar */}
                    {availableTags.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1"><Tag size={12}/> اظهار الوسوم على المخطط:</p>
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={() => setActiveTagFilter(null)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border transition ${!activeTagFilter ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                                >
                                    الكل (عادي)
                                </button>
                                {availableTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold border transition ${activeTagFilter === tag ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={primaryData}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis 
                                    dataKey="timestamp" 
                                    tickFormatter={(str) => new Date(str).toLocaleDateString('ar-EG', {day:'numeric', month:'numeric'})} 
                                    tick={{fontSize: 10}}
                                />
                                <YAxis width={40} tick={{fontSize: 10}} />
                                <ReTooltip 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const d = payload[0].payload as GlucoseReading;
                                            return (
                                                <div className="bg-white p-2 border shadow rounded text-xs">
                                                    <p className="font-bold">{new Date(d.timestamp).toLocaleString('ar-EG')}</p>
                                                    <p className="text-indigo-600 font-bold text-lg">{displayVal(d.value)} {unit}</p>
                                                    <p className="text-slate-500">{d.timeLabel}</p>
                                                    {d.notes && <p className="text-indigo-500 mt-1 font-bold border-t pt-1 border-slate-100">{d.notes}</p>}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorVal)" />
                                
                                {/* Render Tag Dots */}
                                {activeTagFilter && primaryData.map((entry, index) => {
                                    // Check if this reading includes the active tag
                                    const hasTag = entry.notes?.includes(activeTagFilter); // Simple check, or better check inside []
                                    if (hasTag) {
                                        return (
                                            <ReferenceDot 
                                                key={`dot-${index}`}
                                                x={entry.timestamp} 
                                                y={entry.value} 
                                                r={6} 
                                                fill="#4f46e5" 
                                                stroke="white" 
                                                strokeWidth={2}
                                                isFront={true}
                                            />
                                        );
                                    }
                                    return null;
                                })}

                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* AI Summary */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <BrainCircuit size={24} className="text-yellow-300" /> تحليل الذكاء الاصطناعي
                    </h3>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                        <p className="leading-relaxed whitespace-pre-line font-medium text-indigo-50">
                            {getAISummary()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
