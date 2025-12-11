
// ... imports ...
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { FoodItem, GlycemicIndex, Allergen, FoodUnit } from '../types';
import { FOOD_CATEGORIES, ALLERGENS_LIST, GI_LEVELS, COMMON_QUANTITIES } from '../constants';
import { Plus, Trash2, Database, Image as ImageIcon, Minus, Hash, AlertCircle, Power, Pencil, RotateCcw, Scale, Activity, Flame, Droplet, Sparkles, Stethoscope, Users, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  
  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [newFood, setNewFood] = useState<{
    name: string;
    category: string;
    image: string;
    glycemicIndex: GlycemicIndex;
    allergens: Allergen[];
    tags: string;
    isActive: boolean;
  }>({ 
    name: '', 
    category: FOOD_CATEGORIES[0], 
    image: '',
    glycemicIndex: 'LOW',
    allergens: [],
    tags: '',
    isActive: true
  });

  // Base 100g Values State (NEW)
  const [base100g, setBase100g] = useState<{
      carbs: string;
      protein: string;
      fat: string;
      calories: string;
      fiber: string;
      sodium: string;
      sugars: string;
  }>({ carbs: '', protein: '', fat: '', calories: '', fiber: '', sodium: '', sugars: '' });

  // Separate state for units being added
  const [tempUnits, setTempUnits] = useState<FoodUnit[]>([]);
  
  // Unit Form State
  const [unitForm, setUnitForm] = useState<{
      name: string;
      weight: string; // Weight in grams
      carbs: string;
      protein: string;
      fat: string;
      calories: string;
      fiber: string;
      sodium: string;
      sugars: string;
  }>({ name: '', weight: '', carbs: '', protein: '', fat: '', calories: '', fiber: '', sodium: '', sugars: '' });

  const [activeTab, setActiveTab] = useState<string>('الكل');

  useEffect(() => {
    setFoods(dbService.getFoods());
  }, []);

  // Automatic Calculation Logic for Unit Form based on Weight & Base 100g
  useEffect(() => {
      const weight = parseFloat(unitForm.weight);
      
      // Only auto-calculate if we have a valid weight and valid base data
      if (!weight || isNaN(weight)) return;

      const ratio = weight / 100;

      const calc = (val: string) => {
          const num = parseFloat(val);
          if (isNaN(num)) return '';
          // Avoid tiny decimals, round appropriately
          const res = num * ratio;
          return Number.isInteger(res) ? res.toString() : res.toFixed(1);
      };

      setUnitForm(prev => ({
          ...prev,
          carbs: calc(base100g.carbs),
          protein: calc(base100g.protein),
          fat: calc(base100g.fat),
          calories: calc(base100g.calories),
          fiber: calc(base100g.fiber),
          sodium: calc(base100g.sodium),
          sugars: calc(base100g.sugars),
      }));

  }, [unitForm.weight, base100g]);

  // Automatic GI Calculation Effect (Based on Base 100g now)
  useEffect(() => {
    const carbs = parseFloat(base100g.carbs) || 0;
    const sugars = parseFloat(base100g.sugars) || 0;
    const fiber = parseFloat(base100g.fiber) || 0;
    const fat = parseFloat(base100g.fat) || 0;
    const protein = parseFloat(base100g.protein) || 0;

    if (carbs === 0 && fat === 0 && protein === 0) return; 

    let calculatedGI: GlycemicIndex = 'MEDIUM';

    // Heuristic Logic for GI Estimation
    if (carbs <= 5) {
        calculatedGI = 'LOW';
    } else {
        const sugarRatio = sugars / carbs;
        const fiberRatio = fiber / carbs;

        if (fiberRatio > 0.2 || (fat + protein) > carbs) {
            calculatedGI = 'LOW';
        } 
        else if (sugarRatio > 0.4 && fiberRatio < 0.1) {
            calculatedGI = 'HIGH';
        } 
        else {
            calculatedGI = 'MEDIUM';
        }
    }

    setNewFood(prev => ({ ...prev, glycemicIndex: calculatedGI }));

  }, [base100g]);

  const handleAddUnit = () => {
      if (!unitForm.name || !unitForm.weight) {
          alert("اسم المقدار والوزن حقول إلزامية لحساب القيم");
          return;
      }
      
      setTempUnits([...tempUnits, { 
          name: unitForm.name, 
          weight: parseFloat(unitForm.weight),
          carbs: parseFloat(unitForm.carbs) || 0,
          protein: parseFloat(unitForm.protein) || 0,
          fat: parseFloat(unitForm.fat) || 0,
          calories: parseFloat(unitForm.calories) || 0,
          fiber: parseFloat(unitForm.fiber) || 0,
          sodium: parseFloat(unitForm.sodium) || 0,
          sugars: parseFloat(unitForm.sugars) || 0,
      }]);

      // Reset unit form only (Keep name empty, weight empty)
      setUnitForm({ name: '', weight: '', carbs: '', protein: '', fat: '', calories: '', fiber: '', sodium: '', sugars: '' });
  };

  const removeTempUnit = (index: number) => {
      const updated = [...tempUnits];
      updated.splice(index, 1);
      setTempUnits(updated);
  };

  const resetForm = () => {
    setNewFood({ 
        name: '', 
        category: FOOD_CATEGORIES[0], 
        image: '',
        glycemicIndex: 'LOW',
        allergens: [],
        tags: '',
        isActive: true
      });
      setBase100g({ carbs: '', protein: '', fat: '', calories: '', fiber: '', sodium: '', sugars: '' });
      setTempUnits([]);
      setEditingId(null);
  };

  const handleSaveFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempUnits.length === 0) {
        alert("يجب إضافة مقدار واحد على الأقل (مثل: ملعقة، كوب)");
        return;
    }

    const tagsArray = newFood.tags.split(' ').filter(t => t.trim() !== '').map(t => t.startsWith('#') ? t.substring(1) : t);
    
    const item: FoodItem = {
        id: editingId || Date.now().toString(),
        name: newFood.name,
        units: tempUnits,
        category: newFood.category,
        image: newFood.image || 'https://via.placeholder.com/150?text=Food',
        preference: 'NEUTRAL', // Default, now managed by Child
        glycemicIndex: newFood.glycemicIndex,
        allergens: newFood.allergens,
        tags: tagsArray,
        isActive: newFood.isActive
    };

    if (editingId) {
        dbService.updateFood(item);
    } else {
        dbService.addFood(item);
    }
    
    setFoods(dbService.getFoods());
    resetForm();
  };

  const handleEdit = (food: FoodItem) => {
    setNewFood({
        name: food.name,
        category: food.category,
        image: food.image || '',
        glycemicIndex: food.glycemicIndex || 'LOW',
        allergens: food.allergens || [],
        tags: food.tags ? food.tags.map(t => `#${t}`).join(' ') : '',
        isActive: food.isActive
    });
    
    // Logic to populate base 100g
    let baseData = { carbs: '', protein: '', fat: '', calories: '', fiber: '', sodium: '', sugars: '' };
    
    // 1. Try finding explicit 100g unit
    const unit100g = food.units.find(u => u.weight === 100 || u.name.includes('100'));
    
    if (unit100g) {
        baseData = {
            carbs: unit100g.carbs.toString(),
            protein: (unit100g.protein || 0).toString(),
            fat: (unit100g.fat || 0).toString(),
            calories: (unit100g.calories || 0).toString(),
            fiber: (unit100g.fiber || 0).toString(),
            sodium: (unit100g.sodium || 0).toString(),
            sugars: (unit100g.sugars || 0).toString(),
        };
    } else if (food.units.length > 0) {
        // 2. Fallback: Calculate from first unit with valid weight
        const validUnit = food.units.find(u => u.weight && u.weight > 0);
        if (validUnit && validUnit.weight) {
            const ratio = 100 / validUnit.weight;
            const calc = (val: number | undefined) => {
                if (val === undefined) return '';
                const res = val * ratio;
                return Number.isInteger(res) ? res.toString() : res.toFixed(1);
            };

            baseData = {
                carbs: calc(validUnit.carbs),
                protein: calc(validUnit.protein),
                fat: calc(validUnit.fat),
                calories: calc(validUnit.calories),
                fiber: calc(validUnit.fiber),
                sodium: calc(validUnit.sodium),
                sugars: calc(validUnit.sugars),
            };
        }
    }

    setBase100g(baseData);
    setTempUnits([...food.units]);
    setUnitForm({ name: '', weight: '', carbs: '', protein: '', fat: '', calories: '', fiber: '', sodium: '', sugars: '' }); // Reset unit form
    setEditingId(food.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
      if (window.confirm("هل أنت متأكد من حذف هذا الصنف؟")) {
          dbService.deleteFood(id);
          setFoods(dbService.getFoods());
          if (editingId === id) {
              resetForm();
          }
      }
  };

  const toggleAllergen = (id: string) => {
      const current = [...newFood.allergens];
      const index = current.indexOf(id as Allergen);
      if (index === -1) {
          current.push(id as Allergen);
      } else {
          current.splice(index, 1);
      }
      setNewFood({ ...newFood, allergens: current });
  };

  const toggleFoodStatus = (food: FoodItem) => {
      const updated = { ...food, isActive: !food.isActive };
      dbService.updateFood(updated);
      setFoods(dbService.getFoods());
  };

  const filteredFoods = activeTab === 'الكل' 
    ? foods 
    : foods.filter(f => f.category === activeTab);

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
        
        {/* Navigation / Header Area for Admin */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
            <h2 className="text-xl font-bold text-slate-700">إدارة الأطعمة</h2>
            <div className="flex gap-2 w-full md:w-auto">
                <button 
                    onClick={() => navigate('/admin/doctors')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-md shadow-indigo-200"
                >
                    <Stethoscope size={20} /> إدارة الأطباء
                </button>
                <button 
                    onClick={() => navigate('/admin/families')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-md shadow-slate-300"
                >
                    <Users size={20} /> سجلات العائلات
                </button>
            </div>
        </div>

        {/* Add/Edit Food Form */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-700">
                    <Database size={20} /> 
                    {editingId ? 'تعديل صنف غذائي' : 'إضافة صنف جديد'}
                </h3>
                {editingId && (
                    <button 
                        onClick={resetForm}
                        className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm bg-slate-100 px-3 py-1 rounded-full transition"
                    >
                        <RotateCcw size={14} /> إلغاء التعديل
                    </button>
                )}
            </div>

            <form onSubmit={handleSaveFood} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                      <label className="text-sm font-bold text-slate-500 mb-1 block">اسم الصنف</label>
                      <input 
                          type="text" 
                          value={newFood.name} 
                          onChange={e => setNewFood({...newFood, name: e.target.value})}
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none" 
                          placeholder="مثال: تفاح"
                          required
                      />
                  </div>
                  
                  <div className="lg:col-span-1">
                      <label className="text-sm font-bold text-slate-500 mb-1 block">التصنيف</label>
                      <select 
                          value={newFood.category} 
                          onChange={e => setNewFood({...newFood, category: e.target.value})}
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none bg-slate-50"
                      >
                          {FOOD_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                          ))}
                      </select>
                  </div>

                  <div className="lg:col-span-1">
                      <label className="text-sm font-bold text-slate-500 mb-1 block">الحالة</label>
                      <button 
                        type="button"
                        onClick={() => setNewFood({...newFood, isActive: !newFood.isActive})}
                        className={`w-full p-2 rounded-lg border font-bold flex items-center justify-center gap-2 transition ${newFood.isActive ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'}`}
                      >
                          {newFood.isActive ? <Power size={18}/> : <Power size={18}/>}
                          {newFood.isActive ? 'مفعل' : 'غير مفعل'}
                      </button>
                  </div>
                </div>

                {/* --- SEPARATION: NUTRITION vs PORTIONS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* SECTION A: BASE 100g NUTRITION */}
                    <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                        <label className="text-base font-bold text-indigo-800 block flex items-center gap-2 mb-4">
                            <Activity size={20} /> المعلومات الغذائية (لكل 100 جرام)
                        </label>
                        <p className="text-xs text-indigo-600 mb-4 opacity-80">
                            أدخل القيم الغذائية الموجودة على الملصق لـ 100 جرام (أو 100 مل). سيتم استخدام هذه الأرقام لحساب القيم للمقادير المختلفة تلقائياً.
                        </p>

                        <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm space-y-4">
                             {/* Primary Macros */}
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="text-xs text-slate-600 font-bold mb-1 block">كارب (g)</label>
                                    <input 
                                        type="number" 
                                        value={base100g.carbs}
                                        onChange={e => setBase100g({...base100g, carbs: e.target.value})}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-indigo-50/10 font-bold text-indigo-900" 
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-600 font-bold mb-1 block flex items-center gap-1"><Flame size={10} /> سعرات (Kcal)</label>
                                    <input 
                                        type="number" 
                                        value={base100g.calories}
                                        onChange={e => setBase100g({...base100g, calories: e.target.value})}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" 
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-600 font-bold mb-1 block">بروتين (g)</label>
                                    <input 
                                        type="number" 
                                        value={base100g.protein}
                                        onChange={e => setBase100g({...base100g, protein: e.target.value})}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" 
                                        placeholder="0"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-xs text-slate-600 font-bold mb-1 block flex items-center gap-1"><Droplet size={10}/> دهون (g)</label>
                                    <input 
                                        type="number" 
                                        value={base100g.fat}
                                        onChange={e => setBase100g({...base100g, fat: e.target.value})}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" 
                                        placeholder="0"
                                    />
                                 </div>
                             </div>

                             {/* Secondary Micros */}
                             <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                                 <div>
                                     <label className="text-[10px] text-slate-500 mb-1 block">ألياف (g)</label>
                                     <input 
                                        type="number" 
                                        value={base100g.fiber}
                                        onChange={e => setBase100g({...base100g, fiber: e.target.value})}
                                        className="w-full p-1.5 border border-slate-200 rounded text-xs" 
                                        placeholder="0"
                                    />
                                 </div>
                                 <div>
                                     <label className="text-[10px] text-slate-500 mb-1 block">سكريات (g)</label>
                                     <input 
                                        type="number" 
                                        value={base100g.sugars}
                                        onChange={e => setBase100g({...base100g, sugars: e.target.value})}
                                        className="w-full p-1.5 border border-slate-200 rounded text-xs" 
                                        placeholder="0"
                                    />
                                 </div>
                                 <div>
                                     <label className="text-[10px] text-slate-500 mb-1 block">صوديوم (mg)</label>
                                     <input 
                                        type="number" 
                                        value={base100g.sodium}
                                        onChange={e => setBase100g({...base100g, sodium: e.target.value})}
                                        className="w-full p-1.5 border border-slate-200 rounded text-xs" 
                                        placeholder="0"
                                    />
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* SECTION B: PORTIONS / UNITS */}
                    <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-base font-bold text-emerald-800 block flex items-center gap-2">
                                <Scale size={20} /> مقادير الصنف
                            </label>
                        </div>
                        <p className="text-xs text-emerald-600 mb-4 opacity-80">
                            عرف المقادير المتاحة للطفل (مثل: ملعقة، كوب). حدد الوزن بالجرام وسيتم الحساب تلقائياً.
                        </p>
                        
                        <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-sm space-y-4">
                             
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-600 font-bold mb-1 block">اسم المقدار</label>
                                    <input 
                                        list="commonQuantities"
                                        type="text" 
                                        value={unitForm.name}
                                        onChange={e => setUnitForm({...unitForm, name: e.target.value})}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" 
                                        placeholder="مثال: حبة متوسطة"
                                    />
                                    <datalist id="commonQuantities">
                                        {COMMON_QUANTITIES.map(q => <option key={q} value={q} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-600 font-bold mb-1 block">الوزن (جرام)</label>
                                    <input 
                                        type="number" 
                                        value={unitForm.weight}
                                        onChange={e => setUnitForm({...unitForm, weight: e.target.value})}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-yellow-50 focus:ring-2 focus:ring-emerald-500" 
                                        placeholder="مثال: 150"
                                    />
                                </div>
                             </div>

                             {/* Calculated Preview */}
                             <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 relative overflow-hidden">
                                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent opacity-50"></div>
                                 <div className="flex justify-between items-center text-xs text-slate-500 font-bold mb-2">
                                     <span className="flex items-center gap-1"><Calculator size={12}/> القيم المحسوبة لهذا المقدار:</span>
                                 </div>
                                 <div className="grid grid-cols-4 gap-2 text-center">
                                     <div className="bg-white p-1 rounded border border-slate-200">
                                         <span className="block text-[10px] text-slate-400">كارب</span>
                                         <span className="font-bold text-emerald-700">{unitForm.carbs || 0}</span>
                                     </div>
                                     <div className="bg-white p-1 rounded border border-slate-200">
                                         <span className="block text-[10px] text-slate-400">سعرات</span>
                                         <span className="font-bold text-slate-700">{unitForm.calories || 0}</span>
                                     </div>
                                     <div className="bg-white p-1 rounded border border-slate-200">
                                         <span className="block text-[10px] text-slate-400">بروتين</span>
                                         <span className="font-bold text-slate-700">{unitForm.protein || 0}</span>
                                     </div>
                                     <div className="bg-white p-1 rounded border border-slate-200">
                                         <span className="block text-[10px] text-slate-400">دهون</span>
                                         <span className="font-bold text-slate-700">{unitForm.fat || 0}</span>
                                     </div>
                                 </div>
                             </div>

                             <button 
                                type="button" 
                                onClick={handleAddUnit}
                                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 font-bold shadow-sm"
                            >
                                <Plus size={18} /> إضافة المقدار للقائمة
                            </button>
                        </div>

                        {/* List of added units */}
                        <div className="flex flex-col gap-2 mt-4 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            {tempUnits.map((unit, idx) => (
                                <div key={idx} className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs flex items-center justify-between shadow-sm group">
                                    <div>
                                        <span className="font-bold text-slate-800 block">
                                            {unit.name} <span className="text-slate-400 font-normal">({unit.weight} جم)</span>
                                        </span>
                                        <span className="text-emerald-600 font-bold">
                                            {unit.carbs}g كارب
                                        </span>
                                    </div>
                                    <button type="button" onClick={() => removeTempUnit(idx)} className="text-slate-300 hover:text-red-500 p-1.5 transition">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {tempUnits.length === 0 && (
                                <div className="text-center py-4 text-emerald-400/50 text-xs border border-dashed border-emerald-200 rounded-lg">
                                    قائمة المقادير فارغة
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Health & Tags Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block flex items-center gap-2">
                            المؤشر الجلايسيمي (GI)
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Sparkles size={8}/> يحسب تلقائياً
                            </span>
                        </label>
                        <div className="flex gap-2">
                             {(Object.keys(GI_LEVELS) as GlycemicIndex[]).map(key => (
                                 <button 
                                    key={key}
                                    type="button"
                                    onClick={() => setNewFood({...newFood, glycemicIndex: key})}
                                    className={`flex-1 text-xs py-2 px-1 rounded border transition font-bold ${newFood.glycemicIndex === key ? GI_LEVELS[key].color + ' ring-1 ring-offset-1' : 'bg-white text-slate-500 border-slate-200'}`}
                                 >
                                     {GI_LEVELS[key].label}
                                 </button>
                             ))}
                        </div>
                    </div>

                    <div>
                         <label className="text-sm font-bold text-slate-500 mb-2 block">مسببات الحساسية</label>
                         <div className="flex flex-wrap gap-2">
                            {ALLERGENS_LIST.map(allergen => (
                                <label key={allergen.id} className="inline-flex items-center gap-1 cursor-pointer select-none bg-white border border-slate-200 px-2 py-1 rounded text-xs hover:border-cyan-300">
                                    <input 
                                        type="checkbox" 
                                        checked={newFood.allergens.includes(allergen.id as Allergen)}
                                        onChange={() => toggleAllergen(allergen.id)}
                                        className="rounded text-cyan-600 focus:ring-cyan-500"
                                    />
                                    <span className={newFood.allergens.includes(allergen.id as Allergen) ? 'text-cyan-700 font-bold' : 'text-slate-600'}>{allergen.label}</span>
                                </label>
                            ))}
                         </div>
                    </div>
                </div>
                
                {/* Images & Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                  <div className="w-full">
                        <label className="text-sm font-bold text-slate-500 mb-2 block">هاشتاجات (كلمات مفتاحية)</label>
                        <div className="relative">
                            <Hash className="absolute right-3 top-2.5 text-slate-400" size={16} />
                            <input 
                                type="text"
                                value={newFood.tags}
                                onChange={e => setNewFood({...newFood, tags: e.target.value})}
                                className="w-full p-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
                                placeholder="صحي سناك سريع..."
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">افصل بين الكلمات بمسافة</p>
                  </div>

                  <div className="w-full">
                      <label className="text-sm font-bold text-slate-500 mb-1 block">رابط الصورة (URL)</label>
                      <div className="relative">
                        <ImageIcon className="absolute right-3 top-2.5 text-slate-400" size={18} />
                        <input 
                            type="url" 
                            value={newFood.image} 
                            onChange={e => setNewFood({...newFood, image: e.target.value})}
                            className="w-full p-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-left" 
                            placeholder="https://..."
                        />
                      </div>
                  </div>

                  <button className={`p-2.5 rounded-lg transition w-full shadow-md font-bold flex items-center justify-center gap-2 ${editingId ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}>
                      <Plus size={20} /> {editingId ? 'حفظ التعديلات' : 'إضافة الصنف'}
                  </button>
                </div>
            </form>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
            <button 
                onClick={() => setActiveTab('الكل')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition ${activeTab === 'الكل' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
            >
                الكل
            </button>
            {FOOD_CATEGORIES.map(cat => (
                <button 
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition ${activeTab === cat ? 'bg-cyan-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* Food List Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFoods.map(food => (
                <div key={food.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden group hover:shadow-md transition duration-300 flex flex-col ${food.isActive ? 'border-slate-100' : 'border-red-200 opacity-75'}`}>
                    <div className="h-40 w-full bg-slate-100 relative overflow-hidden">
                        {food.image ? (
                           <img src={food.image} alt={food.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-slate-300">
                             <ImageIcon size={40} />
                           </div>
                        )}
                        
                        {/* GI Badge */}
                        {food.glycemicIndex && (
                           <div className={`absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm border ${GI_LEVELS[food.glycemicIndex].color} bg-opacity-95`}>
                                GI: {GI_LEVELS[food.glycemicIndex].label}
                           </div>
                        )}

                        {/* Status Toggle on Card */}
                        <div className="absolute top-2 right-2">
                             <button 
                                onClick={() => toggleFoodStatus(food)}
                                className={`p-1.5 rounded-full shadow-sm ${food.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                                title={food.isActive ? 'إلغاء التفعيل' : 'تفعيل'}
                             >
                                 <Power size={14} />
                             </button>
                        </div>
                    </div>
                    
                    <div className="p-4 flex flex-col flex-1 gap-2">
                        <div className="flex justify-between items-start">
                           <h4 className="font-bold text-slate-800 text-lg line-clamp-1">{food.name}</h4>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                            {food.allergens?.map(a => (
                                <span key={a} className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-100 flex items-center gap-0.5">
                                    <AlertCircle size={10} /> {ALLERGENS_LIST.find(al => al.id === a)?.label}
                                </span>
                            ))}
                        </div>

                        {food.tags && food.tags.length > 0 && (
                             <div className="flex flex-wrap gap-1 mt-1">
                                {food.tags.map(tag => (
                                    <span key={tag} className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">#{tag}</span>
                                ))}
                             </div>
                        )}

                        <div className="flex flex-col gap-1 mt-auto pt-3 border-t border-slate-50">
                            {/* Units Display */}
                            <div className="text-xs text-slate-500 space-y-1">
                                {food.units?.slice(0, 3).map((u, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            {u.name}
                                            {u.weight && <span className="text-[10px] text-slate-400">({u.weight}g)</span>}
                                        </span>
                                        <div className="flex gap-2">
                                            <span className="font-bold text-cyan-600">{u.carbs}g كارب</span>
                                        </div>
                                    </div>
                                ))}
                                {food.units && food.units.length > 3 && (
                                    <span className="text-[10px] text-slate-400">+{food.units.length - 3} مقادير أخرى</span>
                                )}
                            </div>
                        </div>
                        
                         <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">
                                    {food.category}
                            </span>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleEdit(food)}
                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                    title="تعديل"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(food.id)}
                                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                                    title="حذف"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            {filteredFoods.length === 0 && (
                <div className="col-span-full text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 text-slate-400">
                    <Database size={40} className="mx-auto mb-2 opacity-50" />
                    لا توجد أصناف في هذا التصنيف حالياً
                </div>
            )}
        </div>
    </div>
  );
};
