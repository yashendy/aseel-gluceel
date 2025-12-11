
import React from 'react';
import { useAuth } from '../App';
import { 
  LogOut, 
  User as UserIcon, 
  Activity, 
  Utensils, 
  Award, 
  ArrowRight,
  Gift,           
  FileText,       
  FlaskConical,   
  Stethoscope,    
  LayoutDashboard,
  Users,
  Trophy
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout, selectedChildId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check if we are in a sub-page of /child to show back button
  const isChildSubPage = location.pathname.startsWith('/child/') && location.pathname !== '/child';
  
  // Determine if we should show child navigation
  const showChildMenu = user?.role === 'CHILD' || location.pathname.startsWith('/child');

  const childNavItems = [
    { path: '/child', label: 'الرئيسية', icon: LayoutDashboard },
    { path: '/child/measurements', label: 'سجل القياسات', icon: Activity },
    { path: '/child/rewards', label: 'النقاط والمكافآت', icon: Gift },
    { path: '/child/meals', label: 'سجل الوجبات', icon: Utensils },
    { path: '/child/reports', label: 'التقارير الطبية', icon: FileText },
    { path: '/child/labs', label: 'التحاليل', icon: FlaskConical },
    { path: '/child/visits', label: 'الزيارات', icon: Stethoscope },
    { path: '/child/profile', label: 'الملف الشخصي', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar / Navbar */}
      <aside className="bg-gradient-to-b from-sky-600 to-indigo-700 text-white w-full md:w-64 flex-shrink-0 flex flex-col h-screen md:sticky md:top-0">
        <div className="p-6 flex items-center justify-center border-b border-white/20 shrink-0">
            <div className="flex flex-col items-center cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden mb-2 shadow-lg hover:scale-105 transition-transform">
                    {/* Logo Placeholder - Drop Icon */}
                    <svg viewBox="0 0 24 24" fill="#0ea5e9" className="w-10 h-10">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fillOpacity="0.1"/>
                        <path d="M12 22C16.4183 22 20 18.4183 20 14C20 9.58172 16.4183 6 12 6C7.58172 6 4 9.58172 4 14C4 18.4183 7.58172 22 12 22Z" />
                        <path d="M12 2L15 8H9L12 2Z" fill="#0ea5e9"/> 
                    </svg>
                </div>
                <h1 className="text-2xl font-bold font-cairo">منصة اسيل</h1>
            </div>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg mb-6">
                <img src={user?.avatar || 'https://picsum.photos/50/50'} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white" />
                <div className="overflow-hidden">
                    <p className="font-bold truncate">{user?.name}</p>
                    <p className="text-xs text-sky-200 truncate font-mono">{user?.role === 'CHILD' ? 'البطل' : user?.role}</p>
                </div>
            </div>

            {/* Parent Dashboard Links */}
            {user?.role === 'PARENT' && (
                <>
                   <button 
                     onClick={() => navigate('/parent')} 
                     className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${location.pathname === '/parent' ? 'bg-white text-indigo-700 font-bold shadow-md' : 'hover:bg-white/10'}`}
                   >
                      <Users size={20} /> لوحة ولي الأمر
                   </button>
                   <button 
                     onClick={() => navigate('/parent/rewards')} 
                     className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${location.pathname === '/parent/rewards' ? 'bg-white text-indigo-700 font-bold shadow-md' : 'hover:bg-white/10'}`}
                   >
                      <Trophy size={20} /> إدارة التحفيز
                   </button>
               </>
            )}

            {/* Doctor Dashboard Link */}
             {user?.role === 'DOCTOR' && (
               <button 
                 onClick={() => navigate('/doctor')} 
                 className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${location.pathname === '/doctor' ? 'bg-white text-indigo-700 font-bold shadow-md' : 'hover:bg-white/10'}`}
               >
                  <Activity size={20} /> لوحة الطبيب
               </button>
            )}

            {/* Separator */}
            {showChildMenu && (user?.role === 'PARENT' || user?.role === 'DOCTOR') && (
                <div className="my-2 border-t border-white/20 pt-2">
                    <p className="px-3 text-[10px] text-sky-200 font-bold mb-2 uppercase tracking-wider">ملف الطفل</p>
                </div>
            )}

            {/* Child Menu Items */}
            {showChildMenu && (
                <div className="space-y-1">
                    {childNavItems.map(item => (
                        <button 
                            key={item.path}
                            onClick={() => navigate(item.path)} 
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${location.pathname === item.path ? 'bg-white text-sky-700 font-bold shadow-md' : 'hover:bg-white/10 text-sky-50'}`}
                        >
                            <item.icon size={20} /> {item.label}
                        </button>
                    ))}
                </div>
            )}
            
            <div className="pt-8 mt-auto">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 hover:bg-red-500/20 text-red-100 rounded-lg transition border border-transparent hover:border-red-500/30">
                    <LogOut size={20} /> تسجيل الخروج
                </button>
            </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen bg-slate-50 relative w-full">
        <header className="bg-white shadow-sm p-4 sticky top-0 z-30 flex justify-between items-center h-16">
             <div className="flex items-center gap-3">
                 {/* Mobile Menu Button could go here */}
                 {isChildSubPage && (
                     <button 
                        onClick={() => navigate('/child')} 
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition"
                        title="العودة للقائمة الرئيسية"
                     >
                         <ArrowRight size={24} />
                     </button>
                 )}
                 <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate max-w-[200px] md:max-w-none">{title}</h2>
             </div>

             {/* Points Badge (Visible if user is child or viewing a child) */}
             {(user?.role === 'CHILD' || selectedChildId) && (
                 <div 
                    onClick={() => navigate('/child/rewards')}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full border border-yellow-200 shadow-sm cursor-pointer hover:scale-105 transition"
                 >
                     <Award className="text-yellow-600" size={18} />
                     <span className="font-bold text-sm">
                         {user?.role === 'CHILD' ? user.points : 'النقاط'}
                     </span>
                 </div>
             )}
        </header>
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            {children}
        </div>
      </main>
    </div>
  );
};
