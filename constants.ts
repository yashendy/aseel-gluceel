
import { UserRole, MeasurementTime, FoodItem, User, GlucoseUnit } from './types';

export const APP_NAME = "منصة اسيل";

// Thresholds in mmol/L
export const THRESHOLDS = {
  HYPO: 4.0, 
  NORMAL_MIN: 4.0,
  NORMAL_MAX: 8.0,
  HIGH: 10.9, 
  CRITICAL: 13.9, 
};

export const FOOD_CATEGORIES = [
  'النشويات',
  'الفواكه',
  'اللحوم',
  'الدهون',
  'الحليب',
  'خضروات'
];

export const COMMON_QUANTITIES = [
  'ملعقة كبيرة',
  'ملعقة صغيرة',
  'كوب',
  'نصف كوب',
  'طبق متوسط',
  'طبق صغير',
  'حبة',
  'حبة متوسطة',
  'حبة صغيرة',
  'شريحة',
  'وحدة',
  '100 جرام'
];

export const VALID_ACTIVATION_CODES = [
    'ASEEL2024',
    'DOCTOR_VIP',
    'MED_KWT'
];

export const GI_LEVELS = {
  LOW: { label: 'منخفض', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  MEDIUM: { label: 'متوسط', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  HIGH: { label: 'مرتفع', color: 'bg-rose-100 text-rose-700 border-rose-200' },
};

export const ALLERGENS_LIST = [
  { id: 'GLUTEN', label: 'جلوتين' },
  { id: 'DAIRY', label: 'ألبان' },
  { id: 'NUTS', label: 'مكسرات' },
  { id: 'EGGS', label: 'بيض' },
  { id: 'SOY', label: 'صويا' },
  { id: 'FISH', label: 'سمك' },
];

// New: Diet Regimes Options
export const DIET_REGIMES = [
  'نباتي (Vegetarian)',
  'خالي من الجلوتين (Gluten Free)',
  'خالي من اللاكتوز (Lactose Free)',
  'قليل السكر (Low Sugar)',
  'قليل الكارب (Low Carb)',
  'قليل الدهون (Low Fat)',
  'قليل الصوديوم (Low Sodium)',
  'قليل الدهون المشبعة'
];

// New: Injection Sites
export const INJECTION_SITES = [
  { id: 'ARM_LEFT', label: 'الذراع الأيسر' },
  { id: 'ARM_RIGHT', label: 'الذراع الأيمن' },
  { id: 'ABDOMEN', label: 'البطن' },
  { id: 'THIGH_LEFT', label: 'الفخذ الأيسر' },
  { id: 'THIGH_RIGHT', label: 'الفخذ الأيمن' },
  { id: 'BUTTOCK_LEFT', label: 'المؤخرة يسار' },
  { id: 'BUTTOCK_RIGHT', label: 'المؤخرة يمين' },
];

export const MOCK_FOODS: FoodItem[] = [
  { 
    id: '1', 
    name: 'تفاح', 
    units: [
      { name: 'حبة متوسطة', weight: 150, carbs: 15, protein: 0.3, fat: 0.2, calories: 52, fiber: 2.4, sodium: 1, sugars: 10 },
      { name: 'شريحة', weight: 30, carbs: 3, protein: 0, fat: 0, calories: 10, fiber: 0.5, sodium: 0, sugars: 2 },
      { name: '100 جرام', weight: 100, carbs: 14, protein: 0.3, fat: 0.2, calories: 52, fiber: 2.4, sodium: 1, sugars: 10 }
    ],
    category: 'الفواكه',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&q=80',
    preference: 'LOVED',
    glycemicIndex: 'LOW',
    tags: ['سناك', 'صحي', 'ألياف'],
    allergens: [],
    isActive: true
  },
  { 
    id: '2', 
    name: 'موز', 
    units: [
      { name: 'حبة متوسطة', weight: 120, carbs: 23, protein: 1.1, fat: 0.3, calories: 89, fiber: 2.6, sodium: 1, sugars: 12 },
      { name: 'حبة صغيرة', weight: 80, carbs: 15, protein: 0.8, fat: 0.2, calories: 60, fiber: 1.8, sodium: 1, sugars: 8 }
    ],
    category: 'الفواكه',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&q=80',
    preference: 'NEUTRAL',
    glycemicIndex: 'MEDIUM',
    tags: ['بوتاسيوم', 'طاقة'],
    allergens: [],
    isActive: true
  },
  { 
    id: '3', 
    name: 'عيش (خبز) لبناني', 
    units: [
      { name: 'رغيف كامل', weight: 120, carbs: 60, protein: 8, fat: 2, calories: 280, fiber: 2, sodium: 300, sugars: 1 },
      { name: 'نصف رغيف', weight: 60, carbs: 30, protein: 4, fat: 1, calories: 140, fiber: 1, sodium: 150, sugars: 0.5 },
      { name: 'ربع رغيف', weight: 30, carbs: 15, protein: 2, fat: 0.5, calories: 70, fiber: 0.5, sodium: 75, sugars: 0.2 }
    ],
    category: 'النشويات',
    image: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=200&q=80',
    preference: 'NEUTRAL',
    glycemicIndex: 'HIGH',
    tags: ['فطار', 'عشا'],
    allergens: ['GLUTEN'],
    isActive: true
  },
  { 
    id: '4', 
    name: 'أرز مطبوخ', 
    units: [
      { name: 'كوب', weight: 160, carbs: 45, protein: 4, fat: 0.4, calories: 205, fiber: 0.6, sodium: 2, sugars: 0.1 },
      { name: 'ملعقة كبيرة', weight: 20, carbs: 5, protein: 0.5, fat: 0, calories: 22, fiber: 0.1, sodium: 0, sugars: 0 },
      { name: 'طبق صغير', weight: 100, carbs: 30, protein: 2.5, fat: 0.3, calories: 136, fiber: 0.4, sodium: 1, sugars: 0 }
    ],
    category: 'النشويات',
    image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=200&q=80',
    preference: 'AVOID',
    glycemicIndex: 'HIGH',
    tags: ['غداء', 'نشويات'],
    allergens: [],
    isActive: true
  },
  { 
    id: '5', 
    name: 'حليب كامل الدسم', 
    units: [
       { name: 'كوب (240 مل)', weight: 240, carbs: 12, protein: 8, fat: 8, calories: 150, fiber: 0, sodium: 100, sugars: 12 },
       { name: 'نصف كوب', weight: 120, carbs: 6, protein: 4, fat: 4, calories: 75, fiber: 0, sodium: 50, sugars: 6 }
    ],
    category: 'الحليب',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80',
    preference: 'NEUTRAL',
    glycemicIndex: 'LOW',
    tags: ['كالسيوم', 'مشروب'],
    allergens: ['DAIRY'],
    isActive: true
  },
  { 
    id: '6', 
    name: 'دجاج مشوي', 
    units: [
      { name: '100 جرام', weight: 100, carbs: 0, protein: 31, fat: 3.6, calories: 165, fiber: 0, sodium: 74, sugars: 0 },
      { name: 'صدر كامل', weight: 180, carbs: 0, protein: 50, fat: 5, calories: 280, fiber: 0, sodium: 120, sugars: 0 },
      { name: 'فخذ', weight: 120, carbs: 0, protein: 20, fat: 10, calories: 180, fiber: 0, sodium: 90, sugars: 0 }
    ],
    category: 'اللحوم',
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=200&q=80',
    preference: 'LOVED',
    glycemicIndex: 'LOW',
    tags: ['بروتين', 'كيتو', 'غداء'],
    allergens: [],
    isActive: true
  },
  { 
    id: '7', 
    name: 'خيار', 
    units: [
      { name: 'حبة متوسطة', weight: 80, carbs: 4, protein: 1, fat: 0, calories: 16, fiber: 1.5, sodium: 2, sugars: 2 },
      { name: 'كوب مقطع', weight: 120, carbs: 3, protein: 0.5, fat: 0, calories: 14, fiber: 1, sodium: 1, sugars: 1.5 }
    ],
    category: 'خضروات',
    image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=200&q=80',
    preference: 'LOVED',
    glycemicIndex: 'LOW',
    tags: ['سلطة', 'خفيف'],
    allergens: [],
    isActive: true
  },
  { 
    id: '8', 
    name: 'زيت زيتون', 
    units: [
      { name: 'ملعقة طعام', weight: 14, carbs: 0, protein: 0, fat: 14, calories: 119, fiber: 0, sodium: 0, sugars: 0 },
      { name: 'ملعقة صغيرة', weight: 5, carbs: 0, protein: 0, fat: 4.5, calories: 40, fiber: 0, sodium: 0, sugars: 0 }
    ],
    category: 'الدهون',
    image: 'https://images.unsplash.com/photo-1474979266404-7cadd259d366?w=200&q=80',
    preference: 'NEUTRAL',
    glycemicIndex: 'LOW',
    tags: ['دهون صحية'],
    allergens: [],
    isActive: true
  },
];

export const INITIAL_USERS: User[] = [
  { 
    id: 'admin1', 
    name: 'أدمن المنصة', 
    email: 'yashendy@gmail.com', 
    password: '123456',
    role: UserRole.ADMIN, 
    avatar: 'https://picsum.photos/200/200' 
  },
  { 
    id: 'doc1', 
    name: 'د. أحمد القلب', 
    email: 'doctor@aseel.com', 
    password: '123456',
    role: UserRole.DOCTOR, 
    avatar: 'https://picsum.photos/201/201',
    isApproved: true 
  },
  { 
    id: 'doc2', 
    name: 'د. سارة الغدد', 
    email: 'sara@aseel.com', 
    password: '123456',
    role: UserRole.DOCTOR, 
    avatar: 'https://picsum.photos/205/205',
    isApproved: false 
  },
  { 
    id: 'parent1', 
    name: 'ولي أمر (أبو محمد)', 
    email: 'parent@aseel.com', 
    password: '123456',
    role: UserRole.PARENT, 
    avatar: 'https://picsum.photos/202/202' 
  },
  { 
    id: 'child1', 
    name: 'محمد', 
    email: 'child', 
    role: UserRole.CHILD, 
    parentId: 'parent1',
    linkedDoctorId: 'doc1',
    points: 120,
    civilId: '290010100123',
    gender: 'MALE',
    dob: '2014-05-15',
    height: 140,
    weight: 35,
    bmi: 17.8,
    medicalData: {
      preferredUnit: GlucoseUnit.MMOL_L,
      icr: 10,
      isf: 3, // Corrected for mmol/L
      targetLow: 4,
      targetHigh: 8,
      criticalHigh: 13.9,
      normalRangeMin: 4,
      normalRangeMax: 8,
      correctionTarget: 6,
      longActingInsulin: 'Lantus',
      rapidInsulin: 'Novorapid',
      deviceType: 'PEN',
      dietRegimes: ['خالي من الجلوتين'],
      injectionSites: ['ARM_LEFT', 'THIGH_RIGHT']
    },
    avatar: 'https://picsum.photos/203/203' 
  }
];

// Chronological Order for Reports Matrix
export const TIME_LABELS = [
    MeasurementTime.WAKING,
    MeasurementTime.PRE_BREAKFAST,
    MeasurementTime.POST_BREAKFAST,
    MeasurementTime.PRE_LUNCH,
    MeasurementTime.POST_LUNCH,
    MeasurementTime.PRE_DINNER,
    MeasurementTime.POST_DINNER,
    MeasurementTime.SNACK,
    MeasurementTime.BEDTIME,
    MeasurementTime.DURING_SLEEP
];

export const mgdlToMmol = (val: number) => parseFloat((val / 18).toFixed(1));
export const mmolToMgdl = (val: number) => Math.round(val * 18);
