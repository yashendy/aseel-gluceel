
import React, { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole } from './types';
import { dbService } from './services/dbService';
import { Layout } from './components/Layout';
import { ComingSoon } from './components/ComingSoon';

// Pages
import { Login } from './pages/Login';
import { ChildDashboard } from './pages/ChildDashboard'; // Now the Menu
import { GlucoseTracker } from './pages/GlucoseTracker'; // The actual tracker
import { ChildProfile } from './pages/ChildProfile'; // New Profile Page
import { Reports } from './pages/Reports'; // New Reports Page
import { LabResults } from './pages/LabResults'; // New Lab Page
import { Visits } from './pages/Visits'; // New Visits Page
import { MealTracker } from './pages/MealTracker'; // NEW MEAL TRACKER
import { Rewards } from './pages/Rewards'; // NEW REWARDS PAGE (Child View)
import { ParentDashboard } from './pages/ParentDashboard';
import { ParentRewardsManager } from './pages/ParentRewardsManager'; // NEW PARENT MANAGER
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminDoctors } from './pages/AdminDoctors';
import { AdminFamilies } from './pages/AdminFamilies';

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => boolean | string;
  logout: () => void;
  selectedChildId: string | null; // For parents/doctors viewing a specific child
  setSelectedChildId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('aseel_current_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (email: string, password?: string): boolean | string => {
    const foundUser = dbService.login(email, password);
    
    if (foundUser) {
        // Check for Doctor approval
        if (foundUser.role === UserRole.DOCTOR && !foundUser.isApproved) {
            return "الحساب في انتظار موافقة الإدارة";
        }

      setUser(foundUser);
      localStorage.setItem('aseel_current_user', JSON.stringify(foundUser));
      
      // Auto-select self if child
      if (foundUser.role === UserRole.CHILD) {
          setSelectedChildId(foundUser.id);
      } else {
          setSelectedChildId(null);
      }
      return true;
    }
    return false; // Invalid credentials
  };

  const logout = () => {
    setUser(null);
    setSelectedChildId(null);
    localStorage.removeItem('aseel_current_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, selectedChildId, setSelectedChildId }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Protected Route ---
const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Redirect to home/default if unauthorized
  }

  return <>{children}</>;
};

// --- Main App Logic ---
const AppRoutes = () => {
  const { user } = useAuth();

  // Redirect root to appropriate dashboard based on role
  const DefaultRedirect = () => {
    if (!user) return <Navigate to="/login" />;
    switch (user.role) {
      case UserRole.ADMIN: return <Navigate to="/admin" />;
      case UserRole.DOCTOR: return <Navigate to="/doctor" />;
      case UserRole.PARENT: return <Navigate to="/parent" />;
      case UserRole.CHILD: return <Navigate to="/child" />;
      default: return <Navigate to="/login" />;
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
          <Layout title="إدارة الأطعمة">
            <AdminDashboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/doctors" element={
        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
          <Layout title="إدارة الأطباء">
            <AdminDoctors />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/families" element={
        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
          <Layout title="سجلات العائلات">
            <AdminFamilies />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/doctor" element={
        <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
          <Layout title="بوابة الطبيب">
            <DoctorDashboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/parent" element={
        <ProtectedRoute allowedRoles={[UserRole.PARENT]}>
          <Layout title="بوابة ولي الأمر">
            <ParentDashboard />
          </Layout>
        </ProtectedRoute>
      } />

      {/* NEW PARENT REWARDS MANAGER */}
      <Route path="/parent/rewards" element={
        <ProtectedRoute allowedRoles={[UserRole.PARENT]}>
          <Layout title="إدارة التحفيز والمكافآت">
            <ParentRewardsManager />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Child Dashboard Routes */}
      <Route path="/child" element={
        <ProtectedRoute allowedRoles={[UserRole.CHILD, UserRole.PARENT, UserRole.DOCTOR]}>
          <Layout title="السجل الصحي">
            <ChildDashboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/child/measurements" element={
        <ProtectedRoute allowedRoles={[UserRole.CHILD, UserRole.PARENT, UserRole.DOCTOR]}>
          <Layout title="سجل القياسات">
            <GlucoseTracker />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/child/meals" element={
        <ProtectedRoute allowedRoles={[UserRole.CHILD, UserRole.PARENT, UserRole.DOCTOR]}>
          <Layout title="سجل الوجبات">
            <MealTracker />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/child/reports" element={
        <ProtectedRoute allowedRoles={[UserRole.CHILD, UserRole.PARENT, UserRole.DOCTOR]}>
          <Layout title="التقارير الطبية">
            <Reports />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/child/labs" element={
        <ProtectedRoute allowedRoles={[UserRole.CHILD, UserRole.PARENT, UserRole.DOCTOR]}>
          <Layout title="نتائج التحاليل">
             <LabResults />
          </Layout>
        </ProtectedRoute>
      } />
      
       <Route path="/child/profile" element={
        <ProtectedRoute allowedRoles={[UserRole.CHILD, UserRole.PARENT, UserRole.DOCTOR]}>
          <Layout title="البيانات الشخصية">
             <ChildProfile />
          </Layout>
        </ProtectedRoute>
      } />

       <Route path="/child/visits" element={
        <ProtectedRoute allowedRoles={[UserRole.CHILD, UserRole.PARENT, UserRole.DOCTOR]}>
          <Layout title="الزيارات الطبية">
             <Visits />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/child/rewards" element={
        <ProtectedRoute allowedRoles={[UserRole.CHILD, UserRole.PARENT, UserRole.DOCTOR]}>
          <Layout title="النقاط والمكافآت">
             <Rewards />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  );
};

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}
