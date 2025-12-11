
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { dbService } from '../services/dbService';
import { useNavigate } from 'react-router-dom';
import { GlucoseReading, GlucoseUnit } from '../types';
import { THRESHOLDS, mmolToMgdl } from '../constants';
import { 
  Activity, 
  Utensils, 
  FileText, 
  FlaskConical, 
  User as UserIcon, 
  Stethoscope, 
  ChevronRight,
  Award,
  GripVertical,
  Clock,
  Target,
  Calculator,
  Gift // NEW ICON
} from 'lucide-react';

// Define the menu item type
interface MenuItem {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    shadow: string;
    path: string;
}

// Initial Items List
const INITIAL_MENU_ITEMS: MenuItem[] = [
    {
        id: 'measurements',
        title: 'سجل القياسات',
        description: 'تسجيل ومتابعة قراءات السكر اليومية',
        icon: Activity,
        color: 'bg-gradient-to-br from-blue-500 to-blue-600',
        shadow: 'shadow-blue-200',
        path: '/child/measurements'
    },
    {
        id: 'rewards', // NEW
        title: 'النقاط والمكافآت',
        description: 'أكمل المهام اليومية واربح الجوائز',
        icon: Gift,
        color: 'bg-gradient-to-br from-amber-400 to-orange-500',
        shadow: 'shadow-orange-200',
        path: '/child/rewards'
    },
    {
        id: 'meals',
        title: 'سجل الوجبات',
        description: 'تتبع الكربوهيدرات والوجبات المتناولة',
        icon: Utensils,
        color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
        shadow: 'shadow-emerald-200',
        path: '/child/meals'
    },
    {
        id: 'reports',
        title: 'التقارير الطبية',
        description: 'استعراض الملخصات والتقارير الدورية',
        icon: FileText,
        color: 'bg-gradient-to-br from-violet-500 to-violet-600',
        shadow: 'shadow-violet-200',
        path: '/child/reports'
    },
    {
        id: 'labs',
        title: 'التحاليل',
        description: 'أرشيف نتائج التحاليل المخبرية والتراكمي',
        icon: FlaskConical,
        color: 'bg-gradient-to-br from-rose-500 to-rose-600',
        shadow: 'shadow-rose-200',
        path: '/child/labs'
    },
    {
        id: 'profile',
        title: 'البيانات الشخصية',
        description: 'المعلومات الأساسية، المعاملات، والأجهزة',
        icon: UserIcon,
        color: 'bg-gradient-to-br from-slate-600 to-slate-700',
        shadow: 'shadow-slate-200',
        path: '/child/profile'
    },
    {
        id: 'visits',
        title: 'الزيارات الطبية',
        description: 'سجل المواعيد وملاحظات الطبيب',
        icon: Stethoscope,
        color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
        shadow: 'shadow-cyan-200',
        path: '/child/visits'
    },
];

export const ChildDashboard = () => {
  const { user, selectedChildId } = useAuth();
  const navigate = useNavigate();
  
  const targetId = selectedChildId || user?.id;
  const [targetUser, setTargetUser] = useState<any>(null);
  const [lastReading, setLastReading] = useState<GlucoseReading | null>(null);
  
  // Drag & Drop State
  const [items, setItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    if (targetId) {
      // 1. Fetch User Data
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
      setTargetUser(foundUser);

      // 2. Fetch Last Reading for Header Stats
      const readings = dbService.getReadings(targetId);
      if (readings.length > 0) {
          setLastReading(readings[0]);
      }

      // 3. Load Custom Order from LocalStorage
      const savedOrder = localStorage.getItem(`menu_order_${targetId}`);
      if (savedOrder) {
          try {
              const parsedOrder = JSON.parse(savedOrder) as string[];
              // Sort INITIAL_MENU_ITEMS based on saved IDs
              const sorted = [...INITIAL_MENU_ITEMS].sort((a, b) => {
                  const indexA = parsedOrder.indexOf(a.id);
                  const indexB = parsedOrder.indexOf(b.id);
                  // If new items were added to code that are not in storage, put them at the end
                  if (indexA === -1) return 1;
                  if (indexB === -1) return -1;
                  return indexA - indexB;
              });
              setItems(sorted);
          } catch (e) {
              console.error("Failed to parse menu order");
          }
      }
    }
  }, [targetId, user]);

  // Handle Drag Sorting
  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;

    // Duplicate items
    const _items = [...items];
    
    // Remove and save the dragged item content
    const draggedItemContent = _items.splice(dragItem.current, 1)[0];

    // Switch the position
    _items.splice(dragOverItem.current, 0, draggedItemContent);

    // Update State
    dragItem.current = null;
    dragOverItem.current = null;
    setItems(_items);

    // Save to LocalStorage
    if (targetId) {
        const orderIds = _items.map(i => i.id);
        localStorage.setItem(`menu_order_${targetId}`, JSON.stringify(orderIds));
    }
  };

  const getStatusColor = (val: number) => {
    if (val < THRESHOLDS.HYPO) return 'bg-red-500 text-white';
    if (val > THRESHOLDS.HIGH) return 'bg-orange-500 text-white';
    if (val >= THRESHOLDS.NORMAL_MIN && val <= THRESHOLDS.NORMAL_MAX) return 'bg-emerald-500 text-white';
    return 'bg-yellow-400 text-white';
  };

  const isMgDl = targetUser?.medicalData?.preferredUnit === GlucoseUnit.MG_DL;
  const displayGlucose = (val: number) => isMgDl ? Math.round(mmolToMgdl(val)) : val.toFixed(1);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
        
        {/* --- 1. Enhanced Header (Important Data) --- */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-400 to-indigo-500"></div>
            
            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* User Info Section */}
                <div className="flex items-center gap-4 lg:w-1/3 border-b lg:border-b-0 lg:border-l border-slate-100 pb-4 lg:pb-0 lg:pl-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-slate-50 shadow-md overflow-hidden">
                            <img src={targetUser?.avatar || 'https://via.placeholder.com/100'} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-sky-500 text-white p-1.5 rounded-full border-2 border-white text-xs">
                           <Award size={14} fill="white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 font-cairo">
                            {targetUser ? targetUser.name : '...'}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                             <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                 {targetUser?.points || 0} نقطة
                             </span>
                             <span className="text-xs text-slate-400">
                                 #{targetUser?.civilId?.slice(-4) || '0000'}
                             </span>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Section */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Metric 1: Last Reading */}
                    <div className={`rounded-2xl p-4 flex flex-col justify-between shadow-sm transition-colors ${lastReading ? getStatusColor(lastReading.value) : 'bg-slate-100 text-slate-500'}`}>
                        <div className="flex justify-between items-start opacity-90">
                            <span className="text-xs font-bold flex items-center gap-1"><Activity size={14} /> آخر قراءة</span>
                            {lastReading && (
                                <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Clock size={10} /> {new Date(lastReading.timestamp).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}
                                </span>
                            )}
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-4xl font-bold font-mono tracking-tighter">
                                {lastReading ? displayGlucose(lastReading.value) : '--'}
                            </span>
                            <span className="text-sm opacity-80 font-cairo">
                                {targetUser?.medicalData?.preferredUnit || 'mmol/L'}
                            </span>
                        </div>
                    </div>

                    {/* Metric 2: Target Range */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between">
                         <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Target size={16} className="text-emerald-500" />
                            <span className="text-xs font-bold">النطاق المستهدف</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="text-2xl font-bold text-slate-700 font-mono">
                                    {isMgDl ? Math.round(mmolToMgdl(targetUser?.medicalData?.normalRangeMin || 4)) : (targetUser?.medicalData?.normalRangeMin || 4)}
                                    <span className="text-slate-400 mx-1">-</span>
                                    {isMgDl ? Math.round(mmolToMgdl(targetUser?.medicalData?.normalRangeMax || 8)) : (targetUser?.medicalData?.normalRangeMax || 8)}
                                </span>
                            </div>
                            <span className="text-[10px] text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">
                                {targetUser?.medicalData?.preferredUnit}
                            </span>
                        </div>
                    </div>

                    {/* Metric 3: Factors (ICR/ISF) */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between">
                         <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Calculator size={16} className="text-indigo-500" />
                            <span className="text-xs font-bold">المعاملات</span>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold">ICR (كارب)</span>
                                <span className="text-xl font-bold text-slate-700 font-mono">1:{targetUser?.medicalData?.icr || '--'}</span>
                            </div>
                            <div className="w-px bg-slate-200 h-full"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold">ISF (حساسية)</span>
                                <span className="text-xl font-bold text-slate-700 font-mono">1:{targetUser?.medicalData?.isf ? (isMgDl ? Math.round(mmolToMgdl(targetUser.medicalData.isf)) : targetUser.medicalData.isf) : '--'}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        {/* --- 2. Draggable Cards Grid --- */}
        <div>
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Activity size={20} className="text-sky-600"/> القائمة الرئيسية
                </h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    💡 يمكنك سحب الكروت لإعادة ترتيبها
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item, index) => (
                    <div 
                        key={item.id}
                        draggable
                        onDragStart={() => (dragItem.current = index)}
                        onDragEnter={() => (dragOverItem.current = index)}
                        onDragEnd={handleSort}
                        onDragOver={(e) => e.preventDefault()}
                        className="relative group cursor-move"
                    >
                        <button 
                            onClick={() => navigate(item.path)}
                            className="w-full bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 text-right flex flex-col relative overflow-hidden hover:-translate-y-1 active:scale-[0.98]"
                        >
                            {/* Grip Icon for UX */}
                            <div className="absolute top-4 left-4 text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab">
                                <GripVertical size={20} />
                            </div>

                            <div className={`w-14 h-14 rounded-2xl ${item.color} text-white flex items-center justify-center mb-4 shadow-lg ${item.shadow} group-hover:scale-110 transition-transform`}>
                                <item.icon size={28} />
                            </div>
                            
                            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-sky-600 transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed mb-4">
                                {item.description}
                            </p>

                            <div className="mt-auto flex justify-end">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
