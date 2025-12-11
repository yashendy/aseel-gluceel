
export enum UserRole {
  ADMIN = 'ADMIN',
  PARENT = 'PARENT',
  CHILD = 'CHILD',
  DOCTOR = 'DOCTOR',
}

export enum GlucoseUnit {
  MMOL_L = 'mmol/L',
  MG_DL = 'mg/dL',
}

export enum MeasurementTime {
  WAKING = 'الاستيقاظ',
  PRE_BREAKFAST = 'قبل الفطار',
  POST_BREAKFAST = 'بعد الفطار',
  PRE_LUNCH = 'قبل الغدا',
  POST_LUNCH = 'بعد الغدا',
  PRE_DINNER = 'قبل العشا',
  POST_DINNER = 'بعد العشا',
  SNACK = 'سناك',
  BEDTIME = 'قبل النوم',
  DURING_SLEEP = 'اثناء النوم',
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  isApproved?: boolean;
  activationCode?: string;
  linkedDoctorId?: string;
  parentId?: string;
  points?: number;
  
  // Basic Child Info
  civilId?: string; // الرقم المدني
  gender?: 'MALE' | 'FEMALE';
  dob?: string; // Date of Birth
  height?: number; // cm
  weight?: number; // kg
  bmi?: number; // Calculated
  
  medicalData?: MedicalProfile;
  lastUpdate?: string; // Timestamp
}

export interface MedicalProfile {
  preferredUnit: GlucoseUnit; // وحدة القياس المفضلة (جديد)

  // Glucose Limits
  targetLow: number; // الهبوط (<4)
  targetHigh: number; // الارتفاع (>10.9)
  criticalHigh?: number; // الارتفاع الحرج (>13.9)
  normalRangeMin: number; // 4
  normalRangeMax: number; // 8

  // Factors
  icr: number; // Insulin to Carb Ratio (General)
  icrBreakfast?: number; // معامل الفطار
  icrLunch?: number; // معامل الغداء
  icrDinner?: number; // معامل العشاء
  
  isf: number; // Insulin Sensitivity Factor
  correctionTarget?: number; // هدف التصحيح (الحد الأعلى للمدى الطبيعي)

  // Insulin & Device
  longActingInsulin: string;
  rapidInsulin: string;
  longActingDose?: number; // Added to store current dosage
  longActingTime?: string; // Added to store time of basal dose (HH:MM)
  deviceType?: 'PEN' | 'PUMP';
  deviceModel?: string;
  insulinNotes?: string;
  injectionSites?: string[]; // Array of site IDs

  // Diet & Allergies
  allergies?: string[];
  dietRegimes?: string[]; // Vegan, Keto, etc.
  lovedFoodIds?: string[];
  avoidFoodIds?: string[];
  dietNotes?: string;
}

export interface GlucoseReading {
  id: string;
  userId: string;
  value: number;
  timestamp: string;
  timeLabel: MeasurementTime;
  notes?: string;
  mealId?: string; // Links to MealEntry
  insulinUnits?: number; // الجرعة التصحيحية + الوجبة (Rapid)
  longActingUnits?: number; // الأنسولين القاعدي (Basal) - NEW
  correctionMethod?: string; // طريقة تصحيح الهبوط
  carbs?: number; // كمية الكربوهيدرات بالجرام (Manual Entry)
}

// --- Meal Entry Types (New) ---
export interface SelectedFoodItem {
    foodId: string;
    foodName: string;
    unitName: string;
    unitWeight: number; // weight in grams for 1 unit
    quantity: number; // how many units
    carbsPerUnit: number; // calculated based on 100g base or unit def
    fiberPerUnit: number;
    totalCarbs: number;
}

export interface SavedMeal {
    id: string;
    userId: string;
    name: string;
    items: SelectedFoodItem[];
    totalCarbs: number;
}

export interface MealEntry {
    id: string;
    userId: string;
    date: string;
    timeLabel: MeasurementTime;
    items: SelectedFoodItem[];
    totalCarbs: number;
    suggestedBolus: number; // Food Bolus
    correctionBolus: number;
    totalBolus: number;
    glucoseReadingId?: string; // Link back to reading
}

// --- Lab Types ---
export type LabType = 'HBA1C' | 'LIPID' | 'KIDNEY' | 'THYROID' | 'VITAMIN' | 'COMPREHENSIVE' | 'OTHER';
export type LabStatus = 'NORMAL' | 'HIGH' | 'LOW';

export interface LabValue {
    name: string; // e.g., "Cholesterol", "HbA1c"
    value: number;
    unit: string;
    rangeMin?: number;
    rangeMax?: number;
    status: LabStatus;
}

export interface LabResult {
    id: string;
    userId: string;
    date: string; // ISO Date
    type: LabType;
    title: string; // "فحص دوري شامل"
    labName?: string; // "مختبر الجابرية"
    values: LabValue[];
    notes?: string;
    images?: string[]; // For future file upload
}

// --- Visits Types (NEW) ---
export type VisitType = 'ROUTINE' | 'EMERGENCY' | 'FOLLOWUP' | 'LABS' | 'DIETITIAN';

export interface VisitTask {
    id: string;
    text: string;
    isCompleted: boolean;
}

export interface Visit {
    id: string;
    userId: string;
    doctorId?: string; // If linked within app
    doctorName: string; // Text field if external
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    type: VisitType; // New field
    reason: string; // "Mothly Checkup"
    location?: string;
    status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
    
    // Clinical Outcomes (New Fields)
    diagnosis?: string; // تشخيص الطبيب
    recommendations?: string; // التوصيات العامة
    requiredLabs?: string; // فحوصات مطلوبة
    
    // Adjustments (التعديلات المقترحة)
    newLongActingDose?: number; // تعديل جرعة القاعدي
    newLongActingTime?: string; // تعديل وقت القاعدي (HH:MM)
    
    // New specific ICR adjustments
    newIcrBreakfast?: number;
    newIcrLunch?: number;
    newIcrDinner?: number;
    
    newIsf?: number; // تعديل معامل التصحيح
    
    changesApplied?: boolean; // هل تم تطبيق التعديلات على الملف؟

    tasks?: VisitTask[]; // المهام قبل الزيارة
    notes?: string;
}

// --- Gamification Types (NEW) ---
export interface Mission {
    id: string;
    title: string;
    points: number;
    icon: string; // Lucide icon name or emoji
    type: 'DAILY' | 'ONE_TIME';
    isCompletedToday: boolean; // Computed for UI
}

export interface Reward {
    id: string;
    userId?: string; // If custom to user
    title: string;
    cost: number;
    image?: string;
    isRedeemed: boolean;
}

export type FoodPreference = 'LOVED' | 'AVOID' | 'NEUTRAL';
export type GlycemicIndex = 'LOW' | 'MEDIUM' | 'HIGH';
export type Allergen = 'GLUTEN' | 'DAIRY' | 'NUTS' | 'EGGS' | 'SOY' | 'FISH';

export interface FoodUnit {
  name: string;
  weight?: number;
  carbs: number;
  protein?: number;
  fat?: number;
  calories?: number;
  fiber?: number;
  sodium?: number;
  sugars?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  units: FoodUnit[];
  category: string;
  image?: string;
  preference?: FoodPreference;
  glycemicIndex?: GlycemicIndex;
  allergens?: Allergen[];
  tags?: string[];
  isActive: boolean;
}

export interface DoctorLinkCode {
  code: string;
  doctorId: string;
  expiresAt: number;
}
