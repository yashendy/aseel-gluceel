
import { User, GlucoseReading, FoodItem, MealEntry, SavedMeal, Visit, LabResult, UserRole, MeasurementTime, Mission, Reward } from '../types';
import { INITIAL_USERS, MOCK_FOODS, VALID_ACTIVATION_CODES } from '../constants';

const DB_KEYS = {
  USERS: 'aseel_users',
  READINGS: 'aseel_readings',
  FOODS: 'aseel_foods',
  MEALS: 'aseel_meals',
  SAVED_MEALS: 'aseel_saved_meals',
  VISITS: 'aseel_visits',
  LABS: 'aseel_labs',
  MISSIONS: 'aseel_missions', // NEW
  REWARDS: 'aseel_rewards',   // NEW
  ACTIVATION_CODES: 'aseel_activation_codes',
  LINK_CODES: 'aseel_link_codes',
};

// Helper to get data from local storage
function getCollection<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// Helper to save data to local storage
function saveCollection<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// --- MOCK GAMIFICATION DATA (Initial) ---
const INITIAL_MISSIONS: Mission[] = [
    { id: 'm1', title: 'تسجيل قياس الاستيقاظ', points: 10, icon: 'Sunrise', type: 'DAILY', isCompletedToday: false },
    { id: 'm2', title: 'أخذ جرعة القاعدي في موعدها', points: 20, icon: 'Moon', type: 'DAILY', isCompletedToday: false },
    { id: 'm3', title: 'تسجيل 4 قراءات يومية', points: 30, icon: 'Activity', type: 'DAILY', isCompletedToday: false },
    { id: 'm4', title: 'تناول فطور صحي', points: 15, icon: 'Utensils', type: 'DAILY', isCompletedToday: false },
    { id: 'm5', title: 'شرب 8 أكواب ماء', points: 10, icon: 'Droplet', type: 'DAILY', isCompletedToday: false },
];

const INITIAL_REWARDS: Reward[] = [
    { id: 'r1', title: 'ساعة ألعاب فيديو', cost: 150, image: 'https://cdn-icons-png.flaticon.com/512/3081/3081329.png', isRedeemed: false },
    { id: 'r2', title: 'خروجة في الويك إند', cost: 500, image: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png', isRedeemed: false },
    { id: 'r3', title: 'لعبة جديدة صغيرة', cost: 300, image: 'https://cdn-icons-png.flaticon.com/512/3209/3209931.png', isRedeemed: false },
    { id: 'r4', title: 'مشاهدة فيلم كرتون', cost: 100, image: 'https://cdn-icons-png.flaticon.com/512/2809/2809590.png', isRedeemed: false },
];

// ... existing generateMockHistory ...
const generateMockHistory = () => {
    const readings: GlucoseReading[] = [];
    const meals: MealEntry[] = [];
    const childId = 'child1'; // The default mock child
    const now = new Date();

    // Loop for the past 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // --- 1. WAKING (07:00) ---
        const wakeTime = new Date(date); wakeTime.setHours(7, 0, 0);
        readings.push({
            id: `reading_wake_${i}`,
            userId: childId,
            value: parseFloat((5.0 + Math.random()).toFixed(1)),
            timestamp: wakeTime.toISOString(),
            timeLabel: MeasurementTime.WAKING,
            notes: 'صائم'
        });

        // --- 2. Pre-Breakfast (08:30) ---
        const bfTime = new Date(date); bfTime.setHours(8, 30, 0);
        const bfCarbs = 45;
        const bfBolus = 4.5;
        const bfValue = 5.2 + (Math.random() * 2);

        const bfMealId = `meal_bf_${i}`;
        meals.push({
            id: bfMealId,
            userId: childId,
            date: dateStr,
            timeLabel: MeasurementTime.PRE_BREAKFAST,
            items: [
                { foodId: '3', foodName: 'عيش لبناني', unitName: 'نصف رغيف', quantity: 1, carbsPerUnit: 30, fiberPerUnit: 1, totalCarbs: 30, unitWeight: 60 },
                { foodId: '5', foodName: 'حليب', unitName: 'كوب', quantity: 1, carbsPerUnit: 12, fiberPerUnit: 0, totalCarbs: 12, unitWeight: 240 }
            ],
            totalCarbs: bfCarbs,
            suggestedBolus: bfBolus,
            correctionBolus: 0,
            totalBolus: bfBolus
        });

        readings.push({
            id: `reading_bf_${i}`,
            userId: childId,
            value: parseFloat(bfValue.toFixed(1)),
            timestamp: bfTime.toISOString(),
            timeLabel: MeasurementTime.PRE_BREAKFAST,
            mealId: bfMealId,
            insulinUnits: bfBolus,
            notes: 'فطار صحي'
        });

        // --- 3. Post-Breakfast (10:30) ---
        const postBfTime = new Date(date); postBfTime.setHours(10, 30, 0);
        readings.push({
            id: `reading_post_bf_${i}`,
            userId: childId,
            value: parseFloat((6.5 + Math.random() * 3).toFixed(1)), // Slightly higher
            timestamp: postBfTime.toISOString(),
            timeLabel: MeasurementTime.POST_BREAKFAST,
        });

        // --- 4. Pre-Lunch (13:30) ---
        const lnTime = new Date(date); lnTime.setHours(13, 30, 0);
        const lnCarbs = 60;
        const lnBolus = 6;
        // Simulate a high reading one day
        const lnValue = i === 2 ? 11.5 : (6.0 + Math.random() * 2); 
        const lnCorrection = lnValue > 10 ? 1 : 0;

        const lnMealId = `meal_ln_${i}`;
        meals.push({
            id: lnMealId,
            userId: childId,
            date: dateStr,
            timeLabel: MeasurementTime.PRE_LUNCH,
            items: [
                { foodId: '4', foodName: 'أرز مطبوخ', unitName: 'طبق صغير', quantity: 2, carbsPerUnit: 30, fiberPerUnit: 0.4, totalCarbs: 60, unitWeight: 200 },
                { foodId: '6', foodName: 'دجاج مشوي', unitName: 'صدر كامل', quantity: 1, carbsPerUnit: 0, fiberPerUnit: 0, totalCarbs: 0, unitWeight: 180 }
            ],
            totalCarbs: lnCarbs,
            suggestedBolus: lnBolus,
            correctionBolus: lnCorrection,
            totalBolus: lnBolus + lnCorrection
        });

        readings.push({
            id: `reading_ln_${i}`,
            userId: childId,
            value: parseFloat(lnValue.toFixed(1)),
            timestamp: lnTime.toISOString(),
            timeLabel: MeasurementTime.PRE_LUNCH,
            mealId: lnMealId,
            insulinUnits: lnBolus + lnCorrection,
            correctionMethod: lnCorrection > 0 ? 'تصحيح مع الوجبة' : undefined
        });

        // --- 5. Post-Lunch (15:30) ---
        const postLnTime = new Date(date); postLnTime.setHours(15, 30, 0);
        readings.push({
            id: `reading_post_ln_${i}`,
            userId: childId,
            value: parseFloat((7.0 + Math.random() * 3).toFixed(1)),
            timestamp: postLnTime.toISOString(),
            timeLabel: MeasurementTime.POST_LUNCH,
        });

        // --- 6. Pre-Dinner (19:30) ---
        const dnTime = new Date(date); dnTime.setHours(19, 30, 0);
        const dnCarbs = 30;
        const dnBolus = 3;
        const dnValue = 7.0 + (Math.random() * 2);

        const dnMealId = `meal_dn_${i}`;
        meals.push({
            id: dnMealId,
            userId: childId,
            date: dateStr,
            timeLabel: MeasurementTime.PRE_DINNER,
            items: [
                { foodId: '3', foodName: 'عيش لبناني', unitName: 'ربع رغيف', quantity: 2, carbsPerUnit: 15, fiberPerUnit: 0.5, totalCarbs: 30, unitWeight: 60 },
                { foodId: '7', foodName: 'خيار', unitName: 'حبة متوسطة', quantity: 1, carbsPerUnit: 4, fiberPerUnit: 1.5, totalCarbs: 4, unitWeight: 80 }
            ],
            totalCarbs: dnCarbs,
            suggestedBolus: dnBolus,
            correctionBolus: 0,
            totalBolus: dnBolus
        });

        readings.push({
            id: `reading_dn_${i}`,
            userId: childId,
            value: parseFloat(dnValue.toFixed(1)),
            timestamp: dnTime.toISOString(),
            timeLabel: MeasurementTime.PRE_DINNER,
            mealId: dnMealId,
            insulinUnits: dnBolus,
        });

        // --- 7. Post-Dinner (21:30) ---
        const postDnTime = new Date(date); postDnTime.setHours(21, 30, 0);
        readings.push({
            id: `reading_post_dn_${i}`,
            userId: childId,
            value: parseFloat((8.0 + Math.random() * 2).toFixed(1)),
            timestamp: postDnTime.toISOString(),
            timeLabel: MeasurementTime.POST_DINNER,
        });

        // --- 8. Bedtime / Basal (23:00) ---
        const bdTime = new Date(date); bdTime.setHours(23, 0, 0);
        readings.push({
            id: `reading_bd_${i}`,
            userId: childId,
            value: parseFloat((6.5 + Math.random()).toFixed(1)),
            timestamp: bdTime.toISOString(),
            timeLabel: MeasurementTime.BEDTIME,
            longActingUnits: 12, // BASAL DOSE
            notes: 'Lantus جرعة المساء'
        });

        // --- 9. During Sleep (03:00) ---
        if (i % 2 === 0) { // Measure every other night
            const slTime = new Date(date); slTime.setHours(27, 0, 0); // Next day 3am effectively
            readings.push({
                id: `reading_sleep_${i}`,
                userId: childId,
                value: parseFloat((5.5 + Math.random()).toFixed(1)),
                timestamp: slTime.toISOString(),
                timeLabel: MeasurementTime.DURING_SLEEP,
            });
        }
    }

    return { readings, meals };
};

// Initialize DB with mock data if empty
const initDB = () => {
    if (!localStorage.getItem(DB_KEYS.USERS)) {
        saveCollection(DB_KEYS.USERS, INITIAL_USERS);
    }
    if (!localStorage.getItem(DB_KEYS.FOODS)) {
        saveCollection(DB_KEYS.FOODS, MOCK_FOODS);
    }
    if (!localStorage.getItem(DB_KEYS.ACTIVATION_CODES)) {
        saveCollection(DB_KEYS.ACTIVATION_CODES, VALID_ACTIVATION_CODES);
    }

    // NEW: Inject Mock Readings & Meals if empty
    if (!localStorage.getItem(DB_KEYS.READINGS)) {
        const { readings, meals } = generateMockHistory();
        saveCollection(DB_KEYS.READINGS, readings);
        saveCollection(DB_KEYS.MEALS, meals);
    }

    // NEW: Inject Mock Missions & Rewards (Persistent now)
    if (!localStorage.getItem(DB_KEYS.MISSIONS)) {
        saveCollection(DB_KEYS.MISSIONS, INITIAL_MISSIONS);
    }
    if (!localStorage.getItem(DB_KEYS.REWARDS)) {
        saveCollection(DB_KEYS.REWARDS, INITIAL_REWARDS);
    }
};

initDB();

export const dbService = {
  // ... existing methods ...
  // --- User / Auth ---
  login: (email: string, password?: string): User | null => {
      const users = getCollection<User>(DB_KEYS.USERS);
      // Simple match
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && (!password || u.password === password));
      return user || null;
  },

  register: (user: User): boolean | string => {
      const users = getCollection<User>(DB_KEYS.USERS);
      if (users.find(u => u.email === user.email)) {
          return "البريد الإلكتروني مسجل مسبقاً";
      }
      
      // Check activation code for doctors
      if (user.role === UserRole.DOCTOR) {
          if (user.activationCode) {
              const codes = getCollection<string>(DB_KEYS.ACTIVATION_CODES);
              if (codes.includes(user.activationCode)) {
                  user.isApproved = true;
              }
          }
      }

      users.push(user);
      saveCollection(DB_KEYS.USERS, users);
      return true;
  },

  updateUser: (user: User) => {
      const users = getCollection<User>(DB_KEYS.USERS);
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) {
          users[index] = { ...users[index], ...user };
          saveCollection(DB_KEYS.USERS, users);
      }
  },
  
  getUsersByRole: (role: UserRole): User[] => {
      return getCollection<User>(DB_KEYS.USERS).filter(u => u.role === role);
  },

  getChildrenByParent: (parentId: string): User[] => {
      return getCollection<User>(DB_KEYS.USERS).filter(u => u.role === UserRole.CHILD && u.parentId === parentId);
  },

  getPatientsByDoctor: (doctorId: string): User[] => {
      return getCollection<User>(DB_KEYS.USERS).filter(u => u.role === UserRole.CHILD && u.linkedDoctorId === doctorId);
  },
  
  addChild: (child: User) => {
      const users = getCollection<User>(DB_KEYS.USERS);
      users.push(child);
      saveCollection(DB_KEYS.USERS, users);
  },

  // --- Doctors & Admin ---
  getAllDoctors: (): User[] => {
      return getCollection<User>(DB_KEYS.USERS).filter(u => u.role === UserRole.DOCTOR);
  },

  toggleDoctorStatus: (id: string) => {
      const users = getCollection<User>(DB_KEYS.USERS);
      const index = users.findIndex(u => u.id === id);
      if (index !== -1) {
          users[index].isApproved = !users[index].isApproved;
          saveCollection(DB_KEYS.USERS, users);
      }
  },

  getActivationCodes: (): string[] => {
      return getCollection<string>(DB_KEYS.ACTIVATION_CODES);
  },

  addActivationCode: (code: string) => {
      const codes = getCollection<string>(DB_KEYS.ACTIVATION_CODES);
      if (!codes.includes(code)) {
          codes.push(code);
          saveCollection(DB_KEYS.ACTIVATION_CODES, codes);
      }
  },

  deleteActivationCode: (code: string) => {
      let codes = getCollection<string>(DB_KEYS.ACTIVATION_CODES);
      codes = codes.filter(c => c !== code);
      saveCollection(DB_KEYS.ACTIVATION_CODES, codes);
  },
  
  generateLinkCode: (doctorId: string): string => {
      // Mock implementation
      return `LINK-${Math.floor(1000 + Math.random() * 9000)}`;
  },

  // --- Readings ---
  getReadings: (userId: string): GlucoseReading[] => {
      const readings = getCollection<GlucoseReading>(DB_KEYS.READINGS);
      return readings
          .filter(r => r.userId === userId)
          .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  addReading: (reading: GlucoseReading) => {
      const readings = getCollection<GlucoseReading>(DB_KEYS.READINGS);
      readings.push(reading);
      saveCollection(DB_KEYS.READINGS, readings);
  },
  
  getReadingBySlot: (userId: string, date: string, timeSlot: MeasurementTime): GlucoseReading | undefined => {
      // date is YYYY-MM-DD
      const readings = getCollection<GlucoseReading>(DB_KEYS.READINGS);
      return readings.find(r => 
        r.userId === userId && 
        r.timeLabel === timeSlot && 
        new Date(r.timestamp).toISOString().split('T')[0] === date
      );
  },

  // --- Foods ---
  getFoods: (): FoodItem[] => {
      return getCollection<FoodItem>(DB_KEYS.FOODS);
  },

  addFood: (food: FoodItem) => {
      const foods = getCollection<FoodItem>(DB_KEYS.FOODS);
      foods.push(food);
      saveCollection(DB_KEYS.FOODS, foods);
  },

  updateFood: (food: FoodItem) => {
      const foods = getCollection<FoodItem>(DB_KEYS.FOODS);
      const index = foods.findIndex(f => f.id === food.id);
      if (index !== -1) {
          foods[index] = food;
          saveCollection(DB_KEYS.FOODS, foods);
      }
  },

  deleteFood: (id: string) => {
      let foods = getCollection<FoodItem>(DB_KEYS.FOODS);
      foods = foods.filter(f => f.id !== id);
      saveCollection(DB_KEYS.FOODS, foods);
  },

  // --- Meal Entries ---
  addMealEntry: (meal: MealEntry) => {
      const meals = getCollection<MealEntry>(DB_KEYS.MEALS);
      const index = meals.findIndex(m => m.id === meal.id);
      if (index !== -1) {
          meals[index] = meal;
      } else {
          meals.push(meal);
      }
      saveCollection(DB_KEYS.MEALS, meals);
  },

  getMealEntries: (userId: string): MealEntry[] => {
      const meals = getCollection<MealEntry>(DB_KEYS.MEALS);
      return meals
        .filter(m => m.userId === userId)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  deleteMealEntry: (id: string) => {
      let meals = getCollection<MealEntry>(DB_KEYS.MEALS);
      meals = meals.filter(m => m.id !== id);
      saveCollection(DB_KEYS.MEALS, meals);
  },

  // --- Saved Meal Templates ---
  saveMealTemplate: (meal: SavedMeal) => {
      const meals = getCollection<SavedMeal>(DB_KEYS.SAVED_MEALS);
      const index = meals.findIndex(m => m.id === meal.id);
      if (index !== -1) {
          meals[index] = meal;
      } else {
          meals.push(meal);
      }
      saveCollection(DB_KEYS.SAVED_MEALS, meals);
  },

  getSavedMealTemplates: (userId: string): SavedMeal[] => {
      const meals = getCollection<SavedMeal>(DB_KEYS.SAVED_MEALS);
      return meals.filter(m => m.userId === userId);
  },

  deleteSavedMealTemplate: (id: string) => {
      let meals = getCollection<SavedMeal>(DB_KEYS.SAVED_MEALS);
      meals = meals.filter(m => m.id !== id);
      saveCollection(DB_KEYS.SAVED_MEALS, meals);
  },

  // --- Visits ---
  getVisits: (userId: string): Visit[] => {
      const visits = getCollection<Visit>(DB_KEYS.VISITS);
      return visits
        .filter(v => v.userId === userId)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addVisit: (visit: Visit) => {
      const visits = getCollection<Visit>(DB_KEYS.VISITS);
      visits.push(visit);
      saveCollection(DB_KEYS.VISITS, visits);
  },

  updateVisit: (visit: Visit) => {
      const visits = getCollection<Visit>(DB_KEYS.VISITS);
      const index = visits.findIndex(v => v.id === visit.id);
      if (index !== -1) {
          visits[index] = visit;
          saveCollection(DB_KEYS.VISITS, visits);
      }
  },

  deleteVisit: (id: string) => {
      let visits = getCollection<Visit>(DB_KEYS.VISITS);
      visits = visits.filter(v => v.id !== id);
      saveCollection(DB_KEYS.VISITS, visits);
  },

  updateVisitStatus: (id: string, status: 'COMPLETED' | 'CANCELLED') => {
      const visits = getCollection<Visit>(DB_KEYS.VISITS);
      const visit = visits.find(v => v.id === id);
      if (visit) {
          visit.status = status;
          saveCollection(DB_KEYS.VISITS, visits);
      }
  },

  toggleVisitTask: (visitId: string, taskId: string) => {
      const visits = getCollection<Visit>(DB_KEYS.VISITS);
      const visit = visits.find(v => v.id === visitId);
      if (visit && visit.tasks) {
          const task = visit.tasks.find(t => t.id === taskId);
          if (task) {
              task.isCompleted = !task.isCompleted;
              saveCollection(DB_KEYS.VISITS, visits);
          }
      }
  },
  
  applyVisitChanges: (visitId: string): boolean => {
      const visits = getCollection<Visit>(DB_KEYS.VISITS);
      const visitIndex = visits.findIndex(v => v.id === visitId);
      if (visitIndex === -1) return false;
      const visit = visits[visitIndex];
      
      const users = getCollection<User>(DB_KEYS.USERS);
      const userIndex = users.findIndex(u => u.id === visit.userId);
      if (userIndex === -1) return false;
      
      const user = users[userIndex];
      if (!user.medicalData) return false;

      // Apply changes
      if (visit.newLongActingDose) user.medicalData.longActingDose = visit.newLongActingDose;
      if (visit.newLongActingTime) user.medicalData.longActingTime = visit.newLongActingTime;
      if (visit.newIsf) user.medicalData.isf = visit.newIsf;
      if (visit.newIcrBreakfast) user.medicalData.icrBreakfast = visit.newIcrBreakfast;
      if (visit.newIcrLunch) user.medicalData.icrLunch = visit.newIcrLunch;
      if (visit.newIcrDinner) user.medicalData.icrDinner = visit.newIcrDinner;
      
      // Update Visit status
      visits[visitIndex].changesApplied = true;
      
      saveCollection(DB_KEYS.USERS, users);
      saveCollection(DB_KEYS.VISITS, visits);
      return true;
  },
  
  getNextVisit: (userId: string): Visit | undefined => {
      const visits = getCollection<Visit>(DB_KEYS.VISITS);
      const now = new Date();
      now.setHours(0,0,0,0);
      
      return visits
        .filter(v => v.userId === userId && v.status === 'UPCOMING' && new Date(v.date) >= now)
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  },

  // --- Labs ---
  getLabs: (userId: string): LabResult[] => {
      const labs = getCollection<LabResult>(DB_KEYS.LABS);
      return labs
        .filter(l => l.userId === userId)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addLab: (lab: LabResult) => {
      const labs = getCollection<LabResult>(DB_KEYS.LABS);
      labs.push(lab);
      saveCollection(DB_KEYS.LABS, labs);
  },

  deleteLab: (id: string) => {
      let labs = getCollection<LabResult>(DB_KEYS.LABS);
      labs = labs.filter(l => l.id !== id);
      saveCollection(DB_KEYS.LABS, labs);
  },

  // --- GAMIFICATION / REWARDS (NEW & UPDATED) ---
  getMissions: (): Mission[] => {
      return getCollection<Mission>(DB_KEYS.MISSIONS);
  },

  addMission: (mission: Mission) => {
      const list = getCollection<Mission>(DB_KEYS.MISSIONS);
      list.push(mission);
      saveCollection(DB_KEYS.MISSIONS, list);
  },

  updateMission: (mission: Mission) => {
      const list = getCollection<Mission>(DB_KEYS.MISSIONS);
      const index = list.findIndex(m => m.id === mission.id);
      if (index !== -1) {
          list[index] = mission;
          saveCollection(DB_KEYS.MISSIONS, list);
      }
  },

  deleteMission: (id: string) => {
      let list = getCollection<Mission>(DB_KEYS.MISSIONS);
      list = list.filter(m => m.id !== id);
      saveCollection(DB_KEYS.MISSIONS, list);
  },

  getRewards: (userId?: string): Reward[] => {
      return getCollection<Reward>(DB_KEYS.REWARDS);
  },

  addReward: (reward: Reward) => {
      const list = getCollection<Reward>(DB_KEYS.REWARDS);
      list.push(reward);
      saveCollection(DB_KEYS.REWARDS, list);
  },

  updateReward: (reward: Reward) => {
      const list = getCollection<Reward>(DB_KEYS.REWARDS);
      const index = list.findIndex(r => r.id === reward.id);
      if (index !== -1) {
          list[index] = reward;
          saveCollection(DB_KEYS.REWARDS, list);
      }
  },

  deleteReward: (id: string) => {
      let list = getCollection<Reward>(DB_KEYS.REWARDS);
      list = list.filter(r => r.id !== id);
      saveCollection(DB_KEYS.REWARDS, list);
  },

  addPoints: (userId: string, points: number) => {
      const users = getCollection<User>(DB_KEYS.USERS);
      const index = users.findIndex(u => u.id === userId);
      if (index !== -1) {
          users[index].points = (users[index].points || 0) + points;
          saveCollection(DB_KEYS.USERS, users);
      }
  },

  redeemReward: (userId: string, rewardId: string): boolean => {
      const users = getCollection<User>(DB_KEYS.USERS);
      const userIndex = users.findIndex(u => u.id === userId);
      const rewards = getCollection<Reward>(DB_KEYS.REWARDS);
      const reward = rewards.find(r => r.id === rewardId);

      if (userIndex !== -1 && reward) {
          const user = users[userIndex];
          if ((user.points || 0) >= reward.cost) {
              user.points = (user.points || 0) - reward.cost;
              saveCollection(DB_KEYS.USERS, users);
              return true;
          }
      }
      return false;
  }
};
