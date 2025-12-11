
// ... imports ...
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { dbService } from '../services/dbService';
import { User, MedicalProfile, GlucoseUnit, FoodItem } from '../types';
import { Save, User as UserIcon, Activity, Scale, Syringe, Settings, Calculator, Sunrise, Sun, Moon, Clock, History, Heart, ThumbsDown, Search, Utensils } from 'lucide-react';
import { mmolToMgdl, mgdlToMmol, FOOD_CATEGORIES } from '../constants';

// BMI Helper
const getBMIStatus = (bmi: number) => {
    if (bmi <= 0) return { label: '-', color: 'bg-slate-800', text: 'text-white', border: 'border-slate-700' };
    if (bmi < 18.5) return { label: 'نحافة', color: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
    if (bmi < 25) return { label: 'وزن طبيعي', color: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
    if (bmi < 30) return { label: 'وزن زائد', color: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
    return { label: 'سمنة', color: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
};

export const ChildProfile = () => {
  const { user, selectedChildId } = useAuth();
  
  // Determine target user (Child viewing self, or Parent/Doctor viewing child)
  const targetId = selectedChildId || user?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [formData, setFormData] = useState<User | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

  // Food Preferences State
  const [allFoods, setAllFoods] = useState<FoodItem[]>([]);
  const [foodSearch, setFoodSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('الكل');

  // Fetch Data
  useEffect(() => {
    if (targetId) {
      const users = dbService.getChildrenByParent(user?.id || '')
        .concat(user ? [user] : []) // Include self if user is child
        .concat(dbService.getPatientsByDoctor(user?.id || '')); // Include patients if doctor
      
      const found = users.find(u => u.id === targetId);
      
      if (found) {
          setUserData(found);
          setFormData(JSON.parse(JSON.stringify(found))); // Deep copy
      }
      
      // Load Foods for preferences
      setAllFoods(dbService.getFoods().filter(f => f.isActive));
      
      setIsLoading(false);
    }
  }, [targetId, user]);

  // BMI Calculation Effect
  useEffect(() => {
    if (formData && formData.height && formData.weight) {
        const hMeters = formData.height / 100;
        const bmiVal = formData.weight / (hMeters * hMeters);
        setFormData(prev => prev ? ({ ...prev, bmi: parseFloat(bmiVal.toFixed(1)) }) : null);
    }
  }, [formData?.height, formData?.weight]);

  const handleInputChange = (field: keyof User, value: any) => {
      if (!formData) return;
      setFormData({ ...formData, [field]: value });
  };

  const handleMedicalChange = (field: keyof MedicalProfile, value: any) => {
      if (!formData || !formData.medicalData) return;
      setFormData({
          ...formData,
          medicalData: {
              ...formData.medicalData,
              [field]: value
          }
      });
  };

  // Logic to switch units and auto-convert existing numbers in the form
  const handleUnitChange = (newUnit: string) => {
      if (!formData || !formData.medicalData) return;
      if (newUnit === formData.medicalData.preferredUnit) return;

      const isToMgdl = newUnit === GlucoseUnit.MG_DL;
      
      const convert = (val?: number) => {
          if (val === undefined || val === 0) return val;
          const res = isToMgdl ? mmolToMgdl(val) : mgdlToMmol(val);
          // Round for UI clarity: integer for mg/dL, 1 decimal for mmol/L
          return isToMgdl ? Math.round(res) : parseFloat(res.toFixed(1));
      };

      setFormData({
          ...formData,
          medicalData: {
              ...formData.medicalData,
              preferredUnit: newUnit as GlucoseUnit,
              targetLow: convert(formData.medicalData.targetLow) || 0,
              targetHigh: convert(formData.medicalData.targetHigh) || 0,
              criticalHigh: convert(formData.medicalData.criticalHigh),
              normalRangeMin: convert(formData.medicalData.normalRangeMin) || 0,
              normalRangeMax: convert(formData.medicalData.normalRangeMax) || 0,
              // Convert ISF and Correction Target
              isf: convert(formData.medicalData.isf) || 0, 
              correctionTarget: convert(formData.medicalData.correctionTarget),
          }
      });
  };

  const toggleFoodPreference = (foodId: string, type: 'LOVED' | 'AVOID') => {
      if (!formData?.medicalData) return;
      
      let loved = [...(formData.medicalData.lovedFoodIds || [])];
      let avoided = [...(formData.medicalData.avoidFoodIds || [])];

      if (type === 'LOVED') {
          if (loved.includes(foodId)) {
              loved = loved.filter(id => id !== foodId); // Toggle off
          } else {
              loved.push(foodId);
              avoided = avoided.filter(id => id !== foodId); // Remove from avoid if exists
          }
      } else {
          // AVOID
          if (avoided.includes(foodId)) {
              avoided = avoided.filter(id => id !== foodId); // Toggle off
          } else {
              avoided.push(foodId);
              loved = loved.filter(id => id !== foodId); // Remove from loved if exists
          }
      }

      setFormData({
          ...formData,
          medicalData: {
              ...formData.medicalData,
              lovedFoodIds: loved,
              avoidFoodIds: avoided
          }
      });
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData) return;

      dbService.updateUser(formData);
      setUserData(formData);
      setIsEditing(false);
      setSaveMessage('تم حفظ التغييرات بنجاح!');
      setTimeout(() => setSaveMessage(''), 3000);
  };

  // Filter foods for preferences section
  const filteredFoods = allFoods.filter(f => {
      const matchesSearch = f.name.includes(foodSearch);
      const matchesCat = activeCategory === 'الكل' || f.category === activeCategory;
      return matchesSearch && matchesCat;
  });

  if (isLoading || !formData || !formData.medicalData) {
      return <div className="p-8 text-center text-slate-500">جاري تحميل البيانات...</div>;
  }

  const bmiStatus = getBMIStatus(formData.bmi || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-10">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
              <UserIcon className="text-sky-600" /> الملف الشخصي
          </h2>
          <div className="flex gap-2">
              {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"
                  >
                      <Settings size={18} /> تعديل البيانات
                  </button>
              ) : (
                  <>
                    <button 
                        onClick={() => {
                            setIsEditing(false);
                            setFormData(JSON.parse(JSON.stringify(userData))); // Reset
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold transition"
                    >
                        إلغاء
                    </button>
                    <button 
                        onClick={handleSave}
                        className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 shadow-lg shadow-sky-200"
                    >
                        <Save size={18} /> حفظ
                    </button>
                  </>
              )}
          </div>
      </div>

      {saveMessage && (
          <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 font-bold animate-pulse">
              <Activity size={20} /> {saveMessage}
          </div>
      )}

      <form className="space-y-6">
        
        {/* 1. Personal Info Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500"></div>
             <h3 className="text-lg font-bold text-indigo-700 mb-6 flex items-center gap-2">
                 <UserIcon size={20} /> البيانات الأساسية
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* Avatar & Name */}
                 <div className="flex items-center gap-4 lg:col-span-1">
                     <img src={formData.avatar} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-slate-50 shadow-md" />
                     <div>
                         <label className="block text-xs text-slate-400 font-bold mb-1">الاسم</label>
                         <input 
                            disabled={!isEditing}
                            type="text" 
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full font-bold text-slate-800 bg-transparent border-b border-slate-200 focus:border-indigo-500 focus:outline-none pb-1 disabled:border-transparent"
                         />
                     </div>
                 </div>

                 {/* Civil ID & Gender */}
                 <div>
                     <label className="block text-xs text-slate-400 font-bold mb-1">الرقم المدني</label>
                     <input 
                        disabled={!isEditing}
                        type="text" 
                        value={formData.civilId || ''}
                        onChange={(e) => handleInputChange('civilId', e.target.value)}
                        className="w-full font-mono font-bold text-slate-600 bg-slate-50 p-2 rounded border border-transparent focus:border-indigo-500 focus:outline-none disabled:bg-slate-50/50"
                     />
                 </div>
                 
                 <div>
                     <label className="block text-xs text-slate-400 font-bold mb-1">تاريخ الميلاد</label>
                     <input 
                        disabled={!isEditing}
                        type="date" 
                        value={formData.dob || ''}
                        onChange={(e) => handleInputChange('dob', e.target.value)}
                        className="w-full font-bold text-slate-600 bg-slate-50 p-2 rounded border border-transparent focus:border-indigo-500 focus:outline-none disabled:bg-slate-50/50"
                     />
                 </div>
             </div>
        </div>

        {/* 2. Body Measurements */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
             <h3 className="text-lg font-bold text-emerald-700 mb-6 flex items-center gap-2">
                 <Scale size={20} /> قياسات الجسم
             </h3>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                 <div>
                     <label className="block text-sm font-bold text-slate-600 mb-2">الطول (سم)</label>
                     <input 
                        disabled={!isEditing}
                        type="number" 
                        value={formData.height || ''}
                        onChange={(e) => handleInputChange('height', Number(e.target.value))}
                        className="w-full text-center text-xl font-bold bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 focus:ring-2 focus:ring-emerald-200 outline-none"
                     />
                 </div>
                 
                 <div>
                     <label className="block text-sm font-bold text-slate-600 mb-2">الوزن (كجم)</label>
                     <input 
                        disabled={!isEditing}
                        type="number" 
                        value={formData.weight || ''}
                        onChange={(e) => handleInputChange('weight', Number(e.target.value))}
                        className="w-full text-center text-xl font-bold bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 focus:ring-2 focus:ring-emerald-200 outline-none"
                     />
                 </div>

                 {/* BMI Display with Dynamic Color */}
                 <div className={`${bmiStatus.color} ${bmiStatus.text} p-4 rounded-xl text-center shadow-md relative border ${bmiStatus.border} transition-colors duration-300`}>
                     <div className="text-xs font-bold mb-1 opacity-80">مؤشر كتلة الجسم (BMI)</div>
                     <div className="text-3xl font-mono font-bold tracking-wider">{formData.bmi || '--'}</div>
                     <div className="text-[10px] font-bold mt-1 bg-white/20 inline-block px-2 py-0.5 rounded-full">{bmiStatus.label}</div>
                     <div className="absolute top-2 right-2 opacity-30"><Activity size={16} /></div>
                 </div>
             </div>
        </div>

        {/* 3. Medical Settings (The Engine) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-2 h-full bg-sky-500"></div>
             
             <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-bold text-sky-700 flex items-center gap-2">
                    <Calculator size={20} /> إعدادات السكر والمعاملات
                </h3>
                {formData.lastUpdate && (
                    <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded flex items-center gap-1">
                        <History size={10} /> آخر تحديث: {new Date(formData.lastUpdate).toLocaleDateString('ar-EG')}
                    </span>
                )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                 
                 {/* Unit Selection */}
                 <div className="bg-sky-50 p-3 rounded-lg border border-sky-100">
                     <label className="block text-xs font-bold text-sky-800 mb-1">الوحدة المفضلة</label>
                     <select 
                        disabled={!isEditing}
                        value={formData.medicalData.preferredUnit}
                        onChange={(e) => handleUnitChange(e.target.value)}
                        className="w-full bg-white text-sm font-bold p-2 rounded border-none focus:ring-0 disabled:bg-transparent cursor-pointer"
                     >
                         <option value={GlucoseUnit.MMOL_L}>mmol/L (دولي)</option>
                         <option value={GlucoseUnit.MG_DL}>mg/dL (أمريكي)</option>
                     </select>
                 </div>

                 {/* ISF */}
                 <div className="bg-sky-50 p-3 rounded-lg border border-sky-100">
                     <label className="block text-xs font-bold text-sky-800 mb-1">معامل التصحيح (ISF)</label>
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-sky-600">1:</span>
                        <input 
                            disabled={!isEditing}
                            type="number" 
                            value={formData.medicalData.isf}
                            onChange={(e) => handleMedicalChange('isf', Number(e.target.value))}
                            className="w-full bg-white text-lg font-bold p-1 rounded text-center disabled:bg-transparent"
                        />
                     </div>
                     <span className="text-[10px] text-sky-600 mt-1 block text-center">
                         {formData.medicalData.preferredUnit}
                     </span>
                 </div>

                 {/* Correction Target */}
                 <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                     <label className="block text-xs font-bold text-orange-800 mb-1">الهدف للتصحيح</label>
                     <input 
                        disabled={!isEditing}
                        type="number" 
                        value={formData.medicalData.correctionTarget}
                        onChange={(e) => handleMedicalChange('correctionTarget', Number(e.target.value))}
                        className="w-full bg-white text-lg font-bold p-1 rounded text-center disabled:bg-transparent text-orange-700"
                        title="القيمة التي يتم طرحها من القراءة المرتفعة عند حساب الجرعة"
                    />
                 </div>
             </div>

             {/* Specific Carb Ratios (ICR) */}
             <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6">
                 <h4 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2 border-b border-indigo-200 pb-2">
                     <Settings size={16} /> معامل الكارب (ICR) - جرامات لكل وحدة
                 </h4>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="border-l border-indigo-200 pl-4">
                         <label className="block text-xs font-bold text-indigo-600 mb-1">عام / افتراضي</label>
                         <input 
                            disabled={!isEditing}
                            type="number" 
                            value={formData.medicalData.icr}
                            onChange={(e) => handleMedicalChange('icr', Number(e.target.value))}
                            className="w-full bg-white border border-indigo-200 rounded p-2 text-center font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-300 outline-none"
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-indigo-600 mb-1 flex items-center gap-1 justify-center"><Sunrise size={12}/> الفطار</label>
                         <input 
                            disabled={!isEditing}
                            type="number" 
                            placeholder="مثل العام"
                            value={formData.medicalData.icrBreakfast || ''}
                            onChange={(e) => handleMedicalChange('icrBreakfast', e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full bg-white border border-indigo-200 rounded p-2 text-center font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-300 outline-none"
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-indigo-600 mb-1 flex items-center gap-1 justify-center"><Sun size={12}/> الغداء</label>
                         <input 
                            disabled={!isEditing}
                            type="number" 
                            placeholder="مثل العام"
                            value={formData.medicalData.icrLunch || ''}
                            onChange={(e) => handleMedicalChange('icrLunch', e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full bg-white border border-indigo-200 rounded p-2 text-center font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-300 outline-none"
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-indigo-600 mb-1 flex items-center gap-1 justify-center"><Moon size={12}/> العشاء</label>
                         <input 
                            disabled={!isEditing}
                            type="number" 
                            placeholder="مثل العام"
                            value={formData.medicalData.icrDinner || ''}
                            onChange={(e) => handleMedicalChange('icrDinner', e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full bg-white border border-indigo-200 rounded p-2 text-center font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-300 outline-none"
                         />
                     </div>
                 </div>
             </div>

             <div className="border-t border-slate-100 pt-4">
                 <h4 className="text-sm font-bold text-slate-500 mb-3">نطاقات السكر المستهدفة ({formData.medicalData.preferredUnit})</h4>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                     <div>
                         <label className="text-xs text-red-500 font-bold block mb-1">هبوط &lt;</label>
                         <input 
                            disabled={!isEditing}
                            type="number" step="0.1"
                            value={formData.medicalData.targetLow}
                            onChange={(e) => handleMedicalChange('targetLow', Number(e.target.value))}
                            className="w-full border border-red-200 bg-red-50 rounded p-2 text-center font-bold text-red-700"
                         />
                     </div>
                     <div>
                         <label className="text-xs text-green-600 font-bold block mb-1">الطبيعي (من)</label>
                         <input 
                            disabled={!isEditing}
                            type="number" step="0.1"
                            value={formData.medicalData.normalRangeMin}
                            onChange={(e) => handleMedicalChange('normalRangeMin', Number(e.target.value))}
                            className="w-full border border-green-200 bg-green-50 rounded p-2 text-center font-bold text-green-700"
                         />
                     </div>
                     <div>
                         <label className="text-xs text-green-600 font-bold block mb-1">الطبيعي (إلى)</label>
                         <input 
                            disabled={!isEditing}
                            type="number" step="0.1"
                            value={formData.medicalData.normalRangeMax}
                            onChange={(e) => handleMedicalChange('normalRangeMax', Number(e.target.value))}
                            className="w-full border border-green-200 bg-green-50 rounded p-2 text-center font-bold text-green-700"
                         />
                     </div>
                     <div>
                         <label className="text-xs text-orange-500 font-bold block mb-1">ارتفاع &gt;</label>
                         <input 
                            disabled={!isEditing}
                            type="number" step="0.1"
                            value={formData.medicalData.targetHigh}
                            onChange={(e) => handleMedicalChange('targetHigh', Number(e.target.value))}
                            className="w-full border border-orange-200 bg-orange-50 rounded p-2 text-center font-bold text-orange-700"
                         />
                     </div>
                 </div>
             </div>
        </div>

        {/* 4. Insulin & Device Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-2 h-full bg-purple-500"></div>
             <h3 className="text-lg font-bold text-purple-700 mb-6 flex items-center gap-2">
                 <Syringe size={20} /> نوع الأنسولين والجهاز
             </h3>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Long Acting Section: Name + Dose + Time */}
                 <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                     <h4 className="text-sm font-bold text-purple-800 mb-3 border-b border-purple-200 pb-2 flex items-center gap-2">
                         <Moon size={16}/> الأنسولين القاعدي (طويل المفعول)
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="md:col-span-3">
                             <label className="block text-xs font-bold text-purple-700 mb-1">اسم الأنسولين</label>
                             <input 
                                disabled={!isEditing}
                                type="text" 
                                placeholder="مثال: Lantus"
                                value={formData.medicalData.longActingInsulin}
                                onChange={(e) => handleMedicalChange('longActingInsulin', e.target.value)}
                                className="w-full p-2 bg-white border border-purple-200 rounded-lg text-purple-900 focus:ring-2 focus:ring-purple-300 outline-none"
                             />
                         </div>
                         <div className="md:col-span-1.5">
                             <label className="block text-xs font-bold text-purple-700 mb-1">الجرعة اليومية (وحدة)</label>
                             <input 
                                disabled={!isEditing}
                                type="number" 
                                step="0.5"
                                placeholder="0"
                                value={formData.medicalData.longActingDose || ''}
                                onChange={(e) => handleMedicalChange('longActingDose', Number(e.target.value))}
                                className="w-full p-2 bg-white border border-purple-200 rounded-lg text-center font-bold text-purple-900 focus:ring-2 focus:ring-purple-300 outline-none"
                             />
                         </div>
                         <div className="md:col-span-1.5">
                             <label className="block text-xs font-bold text-purple-700 mb-1 flex items-center gap-1"><Clock size={12}/> وقت الجرعة</label>
                             <input 
                                disabled={!isEditing}
                                type="time"
                                value={formData.medicalData.longActingTime || ''}
                                onChange={(e) => handleMedicalChange('longActingTime', e.target.value)}
                                className="w-full p-2 bg-white border border-purple-200 rounded-lg text-center font-bold text-purple-900 focus:ring-2 focus:ring-purple-300 outline-none"
                             />
                         </div>
                     </div>
                 </div>

                 {/* Rapid Acting Section */}
                 <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">الأنسولين السريع (للوجبات)</label>
                        <input 
                            disabled={!isEditing}
                            type="text" 
                            value={formData.medicalData.rapidInsulin}
                            onChange={(e) => handleMedicalChange('rapidInsulin', e.target.value)}
                            className="w-full p-3 bg-purple-50 border border-purple-100 rounded-lg text-purple-900 font-bold focus:ring-2 focus:ring-purple-200 outline-none"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">نوع الجهاز</label>
                            <select 
                                disabled={!isEditing}
                                value={formData.medicalData.deviceType}
                                onChange={(e) => handleMedicalChange('deviceType', e.target.value as any)}
                                className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-purple-200 outline-none disabled:bg-slate-50"
                            >
                                <option value="PEN">أقلام أنسولين</option>
                                <option value="PUMP">مضخة أنسولين</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">موديل الجهاز</label>
                            <input 
                                disabled={!isEditing}
                                type="text" 
                                value={formData.medicalData.deviceModel || ''}
                                onChange={(e) => handleMedicalChange('deviceModel', e.target.value)}
                                className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-purple-200 outline-none disabled:bg-slate-50"
                                placeholder="مثال: Dexcom G6"
                            />
                        </div>
                    </div>
                 </div>
             </div>
        </div>

        {/* 5. Food Preferences (NEW SECTION) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>
             <h3 className="text-lg font-bold text-rose-700 mb-4 flex items-center gap-2">
                 <Utensils size={20} /> تفضيلات الطعام
             </h3>
             <p className="text-sm text-slate-500 mb-6">حدد الأطعمة المحببة للطفل والأطعمة التي يجب تجنبها لتظهر بشكل مميز في سجل الوجبات.</p>

             {/* Search & Filter */}
             <div className="flex gap-2 mb-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
                 <div className="relative flex-1">
                     <Search className="absolute right-3 top-3 text-slate-400" size={18} />
                     <input 
                        type="text" 
                        placeholder="ابحث عن طعام..." 
                        value={foodSearch}
                        onChange={(e) => setFoodSearch(e.target.value)}
                        disabled={!isEditing}
                        className="w-full p-2.5 pr-10 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                     />
                 </div>
                 <select 
                    value={activeCategory} 
                    onChange={(e) => setActiveCategory(e.target.value)}
                    disabled={!isEditing}
                    className="p-2 border border-slate-200 rounded-lg bg-white outline-none"
                 >
                     <option value="الكل">الكل</option>
                     {FOOD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
             </div>

             {/* Foods Grid */}
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto p-1">
                 {filteredFoods.map(food => {
                     const isLoved = formData.medicalData.lovedFoodIds?.includes(food.id);
                     const isAvoided = formData.medicalData.avoidFoodIds?.includes(food.id);

                     return (
                         <div key={food.id} className={`bg-white rounded-xl border p-2 flex flex-col items-center text-center shadow-sm transition ${isLoved ? 'border-red-400 ring-1 ring-red-100' : isAvoided ? 'border-orange-400 ring-1 ring-orange-100' : 'border-slate-100'}`}>
                             <div className="w-full h-20 bg-slate-50 rounded-lg mb-2 overflow-hidden relative">
                                 <img src={food.image || 'https://via.placeholder.com/100'} alt={food.name} className="w-full h-full object-cover" />
                                 <span className="absolute bottom-0 right-0 bg-black/50 text-white text-[10px] px-1 w-full truncate">{food.category}</span>
                             </div>
                             <h4 className="text-xs font-bold text-slate-700 mb-2 line-clamp-1">{food.name}</h4>
                             
                             <div className="flex gap-2 w-full mt-auto">
                                 <button
                                    type="button"
                                    disabled={!isEditing}
                                    onClick={() => toggleFoodPreference(food.id, 'LOVED')}
                                    className={`flex-1 p-1.5 rounded-lg flex items-center justify-center transition ${isLoved ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400 hover:text-red-500'}`}
                                 >
                                     <Heart size={16} className={isLoved ? 'fill-white' : ''} />
                                 </button>
                                 <button
                                    type="button"
                                    disabled={!isEditing}
                                    onClick={() => toggleFoodPreference(food.id, 'AVOID')}
                                    className={`flex-1 p-1.5 rounded-lg flex items-center justify-center transition ${isAvoided ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400 hover:text-orange-500'}`}
                                 >
                                     <ThumbsDown size={16} />
                                 </button>
                             </div>
                         </div>
                     );
                 })}
                 {filteredFoods.length === 0 && <p className="col-span-full text-center py-8 text-slate-400">لا توجد نتائج</p>}
             </div>
        </div>

      </form>
    </div>
  );
};
