
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { dbService } from '../services/dbService';
import { User, MeasurementTime, GlucoseUnit, FoodItem, SelectedFoodItem, GlucoseReading, MealEntry, SavedMeal } from '../types';
import { THRESHOLDS, mmolToMgdl, mgdlToMmol, FOOD_CATEGORIES, ALLERGENS_LIST, GI_LEVELS } from '../constants';
import { 
    Utensils, Calculator, Search, Plus, Trash2, Save, 
    AlertTriangle, CheckCircle, BrainCircuit, Wand2, 
    Clock, X, Heart, ThumbsDown, ShieldCheck, AlertOctagon, 
    Bookmark, FolderHeart, PlusCircle, Calendar, Flame, PenTool,
    ShoppingBag, Carrot, Apple, Coffee, Fish, Smile, Frown, Zap,
    Droplet, Sunrise, Activity, Ban
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// Helper to map categories to icons
const getCategoryIcon = (cat: string) => {
    switch(cat) {
        case 'النشويات': return <Coffee size={18}/>;
        case 'الفواكه': return <Apple size={18}/>;
        case 'اللحوم': return <Fish size={18}/>;
        case 'خضروات': return <Carrot size={18}/>;
        case 'الحليب': return <Droplet size={18}/>;
        default: return <Utensils size={18}/>;
    }
};

export const MealTracker = () => {
    const { user, selectedChildId } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const targetId = selectedChildId || user?.id;

    // --- State: User & Context ---
    const [targetUser, setTargetUser] = useState<User | null>(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Mapping Meal Names to MeasurementTime
    const [selectedMealType, setSelectedMealType] = useState<string>('BREAKFAST');
    const [timeSlot, setTimeSlot] = useState<MeasurementTime>(MeasurementTime.PRE_BREAKFAST);
    
    // --- State: Glucose Sync ---
    const [existingReading, setExistingReading] = useState<GlucoseReading | null>(null);
    const [glucoseValue, setGlucoseValue] = useState<string>('');
    
    // --- State: Food Library & Selection ---
    const [allFoods, setAllFoods] = useState<FoodItem[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('الكل');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSafeOnly, setShowSafeOnly] = useState(false);
    
    // --- State: Custom Item ---
    const [showCustomItemForm, setShowCustomItemForm] = useState(false);
    const [customItemName, setCustomItemName] = useState('');
    const [customItemCarbs, setCustomItemCarbs] = useState('');

    // --- State: The Meal Box (Cart) ---
    const [selectedItems, setSelectedItems] = useState<SelectedFoodItem[]>([]);

    // --- State: Saved Meals (Templates) ---
    const [viewMode, setViewMode] = useState<'MARKET' | 'SAVED'>('MARKET');
    const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
    const [showSaveTemplateForm, setShowSaveTemplateForm] = useState(false);
    const [templateName, setTemplateName] = useState('');

    // --- State: Daily Meals Table ---
    const [dailyMeals, setDailyMeals] = useState<MealEntry[]>([]);

    // --- State: Calculations ---
    const [manualCorrection, setManualCorrection] = useState<number | ''>('');
    const [manualTotalDose, setManualTotalDose] = useState<number | ''>('');

    // --- Effect: Handle Navigation State ---
    useEffect(() => {
        if (location.state) {
            const { date: incomeDate, mealType: incomeMealType } = location.state;
            if (incomeDate) setDate(incomeDate);
            if (incomeMealType) setSelectedMealType(incomeMealType);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    // --- Effect: Load User & Foods & Templates & Daily Meals ---
    useEffect(() => {
        if (targetId) {
            let foundUser = null;
            if (user?.id === targetId) foundUser = user;
            else {
                foundUser = dbService.getChildrenByParent(user?.id || '').find(c => c.id === targetId) 
                         || dbService.getPatientsByDoctor(user?.id || '').find(p => p.id === targetId);
            }
            setTargetUser(foundUser || null);
            setAllFoods(dbService.getFoods().filter(f => f.isActive));
            setSavedMeals(dbService.getSavedMealTemplates(targetId));
            fetchDailyMeals();
        }
    }, [targetId, user, date]);

    const fetchDailyMeals = () => {
        if (!targetId) return;
        const allEntries = dbService.getMealEntries(targetId);
        const todays = allEntries.filter(m => m.date === date);
        setDailyMeals(todays);
    };

    // --- Effect: Sync Meal Type to Time Slot ---
    useEffect(() => {
        switch (selectedMealType) {
            case 'BREAKFAST': setTimeSlot(MeasurementTime.PRE_BREAKFAST); break;
            case 'LUNCH': setTimeSlot(MeasurementTime.PRE_LUNCH); break;
            case 'DINNER': setTimeSlot(MeasurementTime.PRE_DINNER); break;
            case 'SNACK': setTimeSlot(MeasurementTime.SNACK); break;
            default: setTimeSlot(MeasurementTime.PRE_BREAKFAST);
        }
    }, [selectedMealType]);

    // --- Effect: Sync Reading ---
    useEffect(() => {
        if (targetId) {
            const reading = dbService.getReadingBySlot(targetId, date, timeSlot);
            setExistingReading(reading || null);
            if (reading) {
                const val = targetUser?.medicalData?.preferredUnit === GlucoseUnit.MG_DL 
                    ? Math.round(mmolToMgdl(reading.value)) 
                    : reading.value;
                setGlucoseValue(val.toString());
            } else {
                setGlucoseValue('');
            }
            setSelectedItems([]); 
            setManualTotalDose('');
            setManualCorrection('');
        }
    }, [targetId, date, timeSlot, targetUser]);

    // --- Helpers ---
    const isMgDl = targetUser?.medicalData?.preferredUnit === GlucoseUnit.MG_DL;
    const roundToHalf = (num: number) => Math.round(num * 2) / 2;

    const getNormalizedGlucose = () => {
        const val = parseFloat(glucoseValue);
        if (isNaN(val)) return 0;
        return isMgDl ? mgdlToMmol(val) : val;
    };

    const currentGlucose = getNormalizedGlucose();
    const isHypo = currentGlucose > 0 && currentGlucose < THRESHOLDS.HYPO;
    const isHigh = currentGlucose > (targetUser?.medicalData?.targetHigh || THRESHOLDS.HIGH);

    // --- Calculations ---
    const totalCarbs = selectedItems.reduce((sum, item) => sum + item.totalCarbs, 0);
    
    // Meal Balance Score
    const mealScore = React.useMemo(() => {
        if (totalCarbs === 0) return { score: 0, text: 'ابدأ بإضافة الطعام', color: 'bg-slate-200 text-slate-500' };
        
        let fiber = 0;
        let protein = 0;
        selectedItems.forEach(i => {
            fiber += (i.fiberPerUnit * i.quantity);
            const food = allFoods.find(f => f.id === i.foodId);
            if (food && (food.category === 'اللحوم' || food.category === 'الحليب' || food.category === 'البيض')) {
                protein += 1;
            }
        });

        if (fiber > 3 && protein > 0) return { score: 100, text: 'وجبة ممتازة ومتوازنة! 🌟', color: 'bg-emerald-500 text-white' };
        if (fiber > 1 || protein > 0) return { score: 70, text: 'جيد! أضف خضروات أكثر 🥗', color: 'bg-blue-500 text-white' };
        return { score: 40, text: 'انتبه! وجبة عالية الكارب ⚠️', color: 'bg-orange-500 text-white' };
    }, [selectedItems, allFoods, totalCarbs]);

    const getICR = () => {
        const medical = targetUser?.medicalData;
        if (!medical) return 10;
        if (timeSlot === MeasurementTime.PRE_BREAKFAST) return medical.icrBreakfast || medical.icr;
        if (timeSlot === MeasurementTime.PRE_LUNCH) return medical.icrLunch || medical.icr;
        if (timeSlot === MeasurementTime.PRE_DINNER) return medical.icrDinner || medical.icr;
        return medical.icr;
    };

    const icr = getICR();
    const isf = targetUser?.medicalData?.isf || 30;
    
    const rawFoodBolus = icr > 0 ? (totalCarbs / icr) : 0;
    const foodBolus = roundToHalf(rawFoodBolus);
    
    let calculatedCorrection = 0;
    if (isHigh && glucoseValue) {
        const currentVal = parseFloat(glucoseValue);
        const targetVal = targetUser?.medicalData?.correctionTarget || (isMgDl ? 100 : 6);
        const diff = currentVal - targetVal;
        if (isf > 0 && diff > 0) {
            calculatedCorrection = roundToHalf(diff / isf);
        }
    }

    const finalCorrection = manualCorrection !== '' ? Number(manualCorrection) : calculatedCorrection;
    const calculatedTotalDose = isHypo ? 0 : (foodBolus + (isHigh ? finalCorrection : 0));
    const finalTotalDose = manualTotalDose !== '' ? Number(manualTotalDose) : calculatedTotalDose;

    // --- Handlers ---
    const handleAddFood = (food: FoodItem) => {
        const userAllergies = targetUser?.medicalData?.allergies || [];
        const conflict = food.allergens?.find(a => userAllergies.includes(a));
        
        if (conflict) {
            const allergenName = ALLERGENS_LIST.find(a => a.id === conflict)?.label || conflict;
            if (!window.confirm(`تحذير: يحتوي على "${allergenName}" المسبب للحساسية. إضافة؟`)) return;
        }

        const defaultUnit = food.units[0];
        const newItem: SelectedFoodItem = {
            foodId: food.id,
            foodName: food.name,
            unitName: defaultUnit.name,
            unitWeight: defaultUnit.weight || 0,
            quantity: 1,
            carbsPerUnit: defaultUnit.carbs,
            fiberPerUnit: defaultUnit.fiber || 0,
            totalCarbs: defaultUnit.carbs
        };
        setSelectedItems([...selectedItems, newItem]);
    };

    const handleAddCustomItem = () => {
        if (!customItemName || !customItemCarbs) return;
        const carbs = parseFloat(customItemCarbs);
        if (isNaN(carbs)) return;

        const newItem: SelectedFoodItem = {
            foodId: `custom_${Date.now()}`,
            foodName: customItemName,
            unitName: 'تقديري',
            unitWeight: 0,
            quantity: 1,
            carbsPerUnit: carbs,
            fiberPerUnit: 0,
            totalCarbs: carbs
        };
        setSelectedItems([...selectedItems, newItem]);
        setCustomItemName(''); setCustomItemCarbs(''); setShowCustomItemForm(false);
    };

    const updateItem = (index: number, updates: Partial<SelectedFoodItem>) => {
        const newItems = [...selectedItems];
        const item = { ...newItems[index], ...updates };
        item.totalCarbs = parseFloat((item.carbsPerUnit * item.quantity).toFixed(1));
        newItems[index] = item;
        setSelectedItems(newItems);
    };

    const removeItem = (index: number) => {
        const newItems = [...selectedItems];
        newItems.splice(index, 1);
        setSelectedItems(newItems);
    };

    const handleSaveTemplate = () => {
        if (!templateName.trim() || !targetId) return;
        const newTemplate: SavedMeal = {
            id: Date.now().toString(),
            userId: targetId,
            name: templateName,
            items: selectedItems,
            totalCarbs: totalCarbs
        };
        dbService.saveMealTemplate(newTemplate);
        setSavedMeals(dbService.getSavedMealTemplates(targetId));
        setShowSaveTemplateForm(false);
        setTemplateName('');
    };

    const handleLoadTemplate = (template: SavedMeal) => {
        setSelectedItems([...selectedItems, ...template.items]);
    };

    const handleDeleteTemplate = (id: string) => {
        if (window.confirm('حذف الوجبة المحفوظة؟')) {
            dbService.deleteSavedMealTemplate(id);
            if(targetId) setSavedMeals(dbService.getSavedMealTemplates(targetId));
        }
    };

    const handleDeleteMealEntry = (id: string) => {
        if (window.confirm("حذف هذه الوجبة من السجل؟")) {
            dbService.deleteMealEntry(id);
            fetchDailyMeals();
        }
    };

    const handleAIMealSuggestion = () => {
        if (!targetUser) return;
        // Same AI Logic as before ...
        const userAllergies = targetUser.medicalData?.allergies || [];
        const lovedFoods = targetUser.medicalData?.lovedFoodIds || [];
        const avoidFoods = targetUser.medicalData?.avoidFoodIds || [];

        const safeFoods = allFoods.filter(f => !f.allergens?.some(a => userAllergies.includes(a)) && !avoidFoods.includes(f.id));
        const getScoredList = (category: string) => safeFoods.filter(f => f.category === category).sort((a, b) => (lovedFoods.includes(b.id) ? 10 : 0) - (lovedFoods.includes(a.id) ? 10 : 0) + Math.random() - 0.5);

        const carbs = getScoredList('النشويات');
        const proteins = getScoredList('اللحوم');
        const dairy = getScoredList('الحليب');
        const fruits = getScoredList('الفواكه');
        const veggies = getScoredList('خضروات');

        let suggestion: FoodItem[] = [];
        if (selectedMealType === 'BREAKFAST') {
            if (dairy.length) suggestion.push(dairy[0]); else if (proteins.length) suggestion.push(proteins[0]);
            if (carbs.length) suggestion.push(carbs[0]);
            if (fruits.length) suggestion.push(fruits[0]);
        } else if (selectedMealType === 'SNACK') {
            if (Math.random() > 0.5 && fruits.length) suggestion.push(fruits[0]);
            else if (dairy.length) suggestion.push(dairy[0]);
        } else {
            if (proteins.length) suggestion.push(proteins[0]);
            if (carbs.length) suggestion.push(carbs[0]);
            if (veggies.length) suggestion.push(veggies[0]);
        }

        if (suggestion.length === 0) { alert("لا توجد أصناف كافية للاقتراح"); return; }

        const newItems: SelectedFoodItem[] = suggestion.map(f => {
            const u = f.units[0];
            return {
                foodId: f.id,
                foodName: f.name,
                unitName: u.name,
                unitWeight: u.weight || 0,
                quantity: 1,
                carbsPerUnit: u.carbs,
                fiberPerUnit: u.fiber || 0,
                totalCarbs: u.carbs
            };
        });
        setSelectedItems(newItems);
    };

    const handleSaveMeal = () => {
        if (!targetId) return;
        if (isHypo) { alert("عالج الهبوط أولاً!"); return; }

        let finalReadingId = existingReading?.id;
        if (glucoseValue) {
            const readingData: GlucoseReading = {
                id: existingReading?.id || `meal_${Date.now()}`,
                userId: targetId,
                value: getNormalizedGlucose(),
                timestamp: existingReading?.timestamp || new Date(`${date}T${new Date().toLocaleTimeString('en-GB')}`).toISOString(),
                timeLabel: timeSlot,
                notes: existingReading?.notes ? existingReading.notes : `وجبة مسجلة (${totalCarbs}g كارب)`,
                insulinUnits: finalTotalDose > 0 ? finalTotalDose : undefined
            };
            dbService.addReading(readingData);
            finalReadingId = readingData.id;
        }

        const mealEntry: MealEntry = {
            id: Date.now().toString(),
            userId: targetId,
            date: date,
            timeLabel: timeSlot,
            items: selectedItems,
            totalCarbs,
            suggestedBolus: foodBolus,
            correctionBolus: isHigh ? finalCorrection : 0,
            totalBolus: finalTotalDose,
            glucoseReadingId: finalReadingId
        };

        dbService.addMealEntry(mealEntry);
        fetchDailyMeals();
        setSelectedItems([]);
        setManualTotalDose('');
        setManualCorrection('');
        alert("صحة وعافية! تم تسجيل الوجبة.");
    };

    // --- PREFERENCE & SORTING LOGIC ---
    const userAllergies = targetUser?.medicalData?.allergies || [];
    const lovedFoods = targetUser?.medicalData?.lovedFoodIds || [];
    const avoidFoods = targetUser?.medicalData?.avoidFoodIds || [];

    const filteredFoods = allFoods.filter(f => {
        const matchesSearch = f.name.includes(searchTerm);
        const matchesCat = activeCategory === 'الكل' || f.category === activeCategory;
        if (showSafeOnly) {
            const hasAllergy = f.allergens?.some(a => userAllergies.includes(a));
            if (hasAllergy) return false;
        }
        return matchesSearch && matchesCat;
    }).sort((a, b) => {
        // Sorting Priority: Loved -> Neutral -> Avoid
        const getScore = (foodId: string) => {
            if (lovedFoods.includes(foodId)) return 2; // High priority
            if (avoidFoods.includes(foodId)) return -1; // Low priority (push to bottom)
            return 1; // Neutral
        };
        return getScore(b.id) - getScore(a.id);
    });

    const favoriteFoodsList = allFoods.filter(f => lovedFoods.includes(f.id));

    return (
        <div className="space-y-6 pb-20 animate-fadeIn">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                <div className="flex items-center gap-4 z-10">
                    <div className="relative">
                        <img src={targetUser?.avatar} className="w-16 h-16 rounded-full border-4 border-slate-50 shadow-sm" alt="Avatar"/>
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-white">
                            <Smile size={12} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 font-cairo">وجبة {targetUser?.name}</h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <Calendar size={12}/>
                            <input 
                                type="date" 
                                value={date} 
                                onChange={e => setDate(e.target.value)} 
                                className="bg-transparent font-bold outline-none cursor-pointer hover:text-indigo-600"
                            />
                        </div>
                    </div>
                </div>
                
                {/* Visual Meal Picker */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto z-10">
                    {[
                        { id: 'BREAKFAST', label: 'فطار', icon: <Sunrise size={16}/> },
                        { id: 'LUNCH', label: 'غداء', icon: <Clock size={16}/> },
                        { id: 'DINNER', label: 'عشاء', icon: <Clock size={16}/> },
                        { id: 'SNACK', label: 'سناك', icon: <Coffee size={16}/> }
                    ].map((meal) => (
                        <button
                            key={meal.id}
                            onClick={() => setSelectedMealType(meal.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${selectedMealType === meal.id ? 'bg-white text-emerald-600 shadow-md scale-105' : 'text-slate-500 hover:text-emerald-600'}`}
                        >
                            {meal.icon}
                            <span className="hidden sm:inline">{meal.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* --- LEFT: FOOD MARKETPLACE --- */}
                <div className="lg:col-span-7 space-y-4">
                    
                    {/* Favorites Quick Bar (Visual Distinction) */}
                    {favoriteFoodsList.length > 0 && (
                        <div className="mb-2">
                            <p className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1">
                                <Heart size={12} className="fill-rose-500 text-rose-500"/> وجباتي المفضلة:
                            </p>
                            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                {favoriteFoodsList.map(food => (
                                    <div key={food.id} onClick={() => handleAddFood(food)} className="flex-shrink-0 cursor-pointer flex flex-col items-center gap-1 group relative">
                                        <div className="w-16 h-16 rounded-2xl border-2 border-rose-200 shadow-sm overflow-hidden group-hover:scale-105 transition bg-white p-1">
                                            <img src={food.image} alt={food.name} className="w-full h-full object-cover rounded-xl" />
                                            <div className="absolute -top-1 -right-1 bg-rose-500 text-white p-0.5 rounded-full border border-white">
                                                <Heart size={8} className="fill-white"/>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-rose-700 truncate max-w-[60px]">{food.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 border-b border-slate-200 pb-1">
                        <button 
                            onClick={() => setViewMode('MARKET')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-t-xl transition ${viewMode === 'MARKET' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <ShoppingBag size={18} /> المتجر
                        </button>
                        <button 
                            onClick={() => setViewMode('SAVED')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-t-xl transition ${viewMode === 'SAVED' ? 'bg-rose-50 text-rose-700 border-b-2 border-rose-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <FolderHeart size={18} /> وجباتي الجاهزة
                        </button>
                    </div>

                    {viewMode === 'MARKET' ? (
                        <>
                            {/* Search */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute right-3 top-3 text-slate-400" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="ماذا تريد أن تأكل اليوم؟" 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full p-3 pr-10 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400 bg-white shadow-sm font-bold text-slate-700 placeholder:font-normal"
                                    />
                                </div>
                                <button onClick={handleAIMealSuggestion} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 font-bold text-sm">
                                    <Wand2 size={20} className="text-yellow-300" /> <span className="hidden sm:inline">السحر!</span>
                                </button>
                            </div>

                            {/* Categories */}
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                <button onClick={() => setActiveCategory('الكل')} className={`flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap border ${activeCategory === 'الكل' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>الكل</button>
                                {FOOD_CATEGORIES.map(cat => (
                                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap border ${activeCategory === cat ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                                        {getCategoryIcon(cat)} {cat}
                                    </button>
                                ))}
                                <button onClick={() => setShowCustomItemForm(true)} className="flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap hover:bg-indigo-100"><PenTool size={14}/> يدوي</button>
                            </div>

                            {/* Custom Item Form */}
                            {showCustomItemForm && (
                                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex items-end gap-2 animate-slideUp">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-indigo-800">اسم الصنف</label>
                                        <input type="text" value={customItemName} onChange={e => setCustomItemName(e.target.value)} className="w-full p-2 rounded-lg border text-sm" placeholder="مثال: قطعة كيك" autoFocus />
                                    </div>
                                    <div className="w-24">
                                        <label className="text-[10px] font-bold text-indigo-800">كارب (g)</label>
                                        <input type="number" value={customItemCarbs} onChange={e => setCustomItemCarbs(e.target.value)} className="w-full p-2 rounded-lg border text-sm text-center" placeholder="0" />
                                    </div>
                                    <button onClick={handleAddCustomItem} className="bg-indigo-600 text-white p-2 rounded-lg h-[38px] w-[38px] flex items-center justify-center"><Plus size={20}/></button>
                                    <button onClick={() => setShowCustomItemForm(false)} className="text-slate-400 p-2"><X size={20}/></button>
                                </div>
                            )}

                            {/* THE MARKET GRID - WITH LOVED/AVOID VISUALS */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 h-[450px] overflow-y-auto p-1 custom-scrollbar">
                                {filteredFoods.map(food => {
                                    const hasAllergy = food.allergens?.some(a => userAllergies.includes(a));
                                    const isLoved = lovedFoods.includes(food.id);
                                    const isAvoided = avoidFoods.includes(food.id);
                                    
                                    return (
                                        <div key={food.id} className={`bg-white rounded-2xl border flex flex-col overflow-hidden group shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-300 relative
                                            ${hasAllergy ? 'border-red-300 opacity-80' : isLoved ? 'border-rose-300 ring-1 ring-rose-100' : isAvoided ? 'border-slate-200 bg-slate-50 opacity-70 grayscale-[0.5]' : 'border-slate-100'}
                                        `}>
                                            {/* Badges */}
                                            {isLoved && <div className="absolute top-2 left-2 z-10 bg-white rounded-full p-1 shadow-sm border border-rose-100"><Heart size={12} className="fill-rose-500 text-rose-500"/></div>}
                                            {hasAllergy && <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">حساسية</div>}
                                            {isAvoided && !hasAllergy && <div className="absolute top-2 right-2 z-10 bg-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm flex items-center gap-1"><ThumbsDown size={10}/> غير مفضل</div>}
                                            
                                            <div className="h-28 w-full bg-slate-50 relative">
                                                <img src={food.image} alt={food.name} className={`w-full h-full object-cover transition duration-500 group-hover:scale-110 ${hasAllergy || isAvoided ? 'grayscale' : ''}`} />
                                            </div>
                                            <div className="p-3 flex flex-col flex-1">
                                                <h4 className={`font-bold text-sm line-clamp-1 ${isLoved ? 'text-rose-700' : 'text-slate-800'}`}>{food.name}</h4>
                                                <p className="text-[10px] text-slate-400 mb-2">{food.units[0]?.name} ({food.units[0]?.carbs}g)</p>
                                                
                                                <button 
                                                    onClick={() => handleAddFood(food)}
                                                    className={`mt-auto w-full py-2 rounded-xl flex items-center justify-center font-bold text-xs transition gap-1 
                                                        ${hasAllergy ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                                                        : isLoved ? 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white'
                                                        : isAvoided ? 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-emerald-500 hover:text-white'}`}
                                                >
                                                    {hasAllergy ? <AlertTriangle size={14}/> : isAvoided ? <Ban size={14}/> : <PlusCircle size={14} />}
                                                    إضافة
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        // Saved Meals View
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {savedMeals.length === 0 && <div className="col-span-full text-center py-10 text-slate-400">لا توجد وجبات محفوظة</div>}
                            {savedMeals.map(meal => (
                                <div key={meal.id} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition group relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><FolderHeart size={16} className="text-rose-500"/> {meal.name}</h4>
                                        <button onClick={() => handleDeleteTemplate(meal.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg mb-3 line-clamp-2">
                                        {meal.items.map(i => i.foodName).join(' + ')}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100">{Math.round(meal.totalCarbs)}g كارب</span>
                                        <button onClick={() => handleLoadTemplate(meal)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700">تحميل</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- RIGHT: THE LUNCHBOX (5 cols) --- */}
                <div className="lg:col-span-5 space-y-4">
                    {/* ... (Existing Lunchbox & Calculator UI - UNCHANGED) ... */}
                    <div className={`p-4 rounded-3xl border-2 flex items-center justify-between transition-colors ${
                        isHypo ? 'bg-red-50 border-red-200 animate-pulse' : 
                        isHigh ? 'bg-orange-50 border-orange-200' : 
                        'bg-white border-slate-200'
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isHypo ? 'bg-red-200 text-red-700' : isHigh ? 'bg-orange-200 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                                <Activity size={20} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400">تحليل السكر الحالي</label>
                                <div className="flex items-center gap-1">
                                    <input 
                                        type="number" 
                                        value={glucoseValue} 
                                        onChange={e => setGlucoseValue(e.target.value)}
                                        placeholder="--"
                                        className="w-16 bg-transparent text-xl font-bold outline-none placeholder:text-slate-300"
                                    />
                                    <span className="text-xs font-bold text-slate-400">{targetUser?.medicalData?.preferredUnit}</span>
                                </div>
                            </div>
                        </div>
                        {existingReading && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle size={10}/> مسجل</span>}
                    </div>

                    {/* THE LUNCHBOX CONTAINER */}
                    <div className="bg-slate-100 rounded-[2rem] p-4 shadow-inner border border-slate-200 relative min-h-[400px] flex flex-col">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-slate-300 rounded-b-lg"></div>
                        
                        <div className="flex justify-between items-center mb-4 px-2">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <Utensils size={18} className="text-orange-500"/> صندوق الوجبة
                            </h3>
                            <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-slate-800 shadow-sm border border-slate-200">
                                {Math.round(totalCarbs)}g <span className="text-[10px] text-slate-400">كارب</span>
                            </span>
                        </div>

                        {/* Save Template Inline */}
                        {showSaveTemplateForm && (
                            <div className="mb-3 p-2 bg-white rounded-xl shadow-sm flex gap-2 animate-fadeIn">
                                <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} className="flex-1 text-sm outline-none bg-slate-50 p-1.5 rounded" placeholder="اسم الوجبة المفضلة..." autoFocus/>
                                <button onClick={handleSaveTemplate} className="bg-rose-500 text-white px-3 rounded-lg text-xs font-bold">حفظ</button>
                                <button onClick={() => setShowSaveTemplateForm(false)} className="text-slate-400"><X size={16}/></button>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto space-y-2 px-1 custom-scrollbar">
                            {selectedItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                    <Utensils size={48} className="mb-2"/>
                                    <p className="text-sm font-bold">الصندوق فارغ!</p>
                                    <p className="text-xs">أضف طعاماً من المتجر</p>
                                </div>
                            ) : (
                                selectedItems.map((item, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg">
                                                {allFoods.find(f => f.id === item.foodId)?.image ? (
                                                    <img src={allFoods.find(f => f.id === item.foodId)?.image} className="w-full h-full object-cover rounded-xl"/>
                                                ) : <Utensils size={16} className="text-slate-300"/>}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm">{item.foodName}</h4>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <div className="flex items-center border rounded bg-slate-50">
                                                        <button onClick={() => updateItem(idx, { quantity: Math.max(0.25, item.quantity - 0.25) })} className="px-1.5 hover:bg-slate-200">-</button>
                                                        <span className="w-6 text-center font-bold">{item.quantity}</span>
                                                        <button onClick={() => updateItem(idx, { quantity: item.quantity + 0.25 })} className="px-1.5 hover:bg-slate-200">+</button>
                                                    </div>
                                                    <span>{item.unitName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-bold text-emerald-600 text-sm">{Math.round(item.totalCarbs)}g</span>
                                            <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Balance Meter */}
                        {selectedItems.length > 0 && (
                            <div className="mt-4 bg-white p-3 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-center text-xs font-bold mb-1">
                                    <span className="text-slate-500">توازن الوجبة:</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${mealScore.color}`}>{mealScore.text}</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${mealScore.score > 80 ? 'bg-emerald-500' : mealScore.score > 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                                        style={{ width: `${mealScore.score}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setShowSaveTemplateForm(true)} className="flex-1 bg-white text-rose-500 border border-rose-200 py-2 rounded-xl text-xs font-bold hover:bg-rose-50 transition">
                                حفظ في المفضلة
                            </button>
                        </div>
                    </div>

                    {/* Final Calculator Button */}
                    <div className="bg-slate-800 text-white rounded-3xl p-5 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-xs text-slate-400 font-bold">جرعة الأنسولين المقترحة</p>
                                <h3 className="text-3xl font-bold font-mono text-cyan-400">{calculatedTotalDose} <span className="text-sm text-white">وحدة</span></h3>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400">طعام: {foodBolus}u</p>
                                <p className="text-[10px] text-slate-400">تصحيح: {calculatedCorrection > 0 ? calculatedCorrection : 0}u</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl mb-4">
                            <span className="text-xs font-bold whitespace-nowrap">الجرعة الفعلية:</span>
                            <input 
                                type="number" 
                                value={manualTotalDose} 
                                onChange={e => setManualTotalDose(Number(e.target.value))}
                                className="w-full bg-transparent text-white font-bold text-lg outline-none text-center border-b border-white/30 focus:border-cyan-400"
                                placeholder={calculatedTotalDose.toString()}
                            />
                        </div>

                        <button 
                            onClick={handleSaveMeal}
                            disabled={isHypo || selectedItems.length === 0}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white py-3 rounded-2xl font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Save size={20} /> تسجيل الوجبة
                        </button>
                    </div>
                </div>
            </div>

            {/* Today's Log (Simplified) */}
            {dailyMeals.length > 0 && (
                <div className="mt-8">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-indigo-500"/> وجبات اليوم
                    </h3>
                    <div className="grid gap-3">
                        {dailyMeals.map(meal => (
                            <div key={meal.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-50 text-indigo-700 p-2 rounded-xl font-bold text-xs">{meal.timeLabel}</div>
                                    <div className="text-sm text-slate-600">
                                        {meal.items.map(i => i.foodName).join(' + ')}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-emerald-600 font-bold text-sm">{Math.round(meal.totalCarbs)}g كارب</span>
                                    <button onClick={() => handleDeleteMealEntry(meal.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
