

import React, { useState } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ChevronRight, User as UserIcon, Activity, Users, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';
import { dbService } from '../services/dbService';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Toggle between Login and Register
  const [isRegistering, setIsRegistering] = useState(false);

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>(UserRole.PARENT);
  const [regActivationCode, setRegActivationCode] = useState(''); // New for Doctors

  // General State
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    const result = login(email, password);
    
    if (result === true) {
       navigate('/');
    } else {
        if (typeof result === 'string') {
           setError(result);
        } else {
           setError("بيانات الدخول غير صحيحة");
        }
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccessMsg('');

      // Activation code is now optional but recommended for instant access
      
      const newUser = {
          id: Date.now().toString(),
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(regName)}&background=random`,
          isApproved: regRole === UserRole.PARENT ? true : false, // Doctors default to false unless auto-approved in dbService
          activationCode: regRole === UserRole.DOCTOR ? regActivationCode : undefined
      };

      const result = dbService.register(newUser);

      if (result === true) {
          if (regRole === UserRole.DOCTOR) {
              // Try to login immediately to check if auto-approved
              const loginResult = login(regEmail, regPassword);
              if (loginResult === true) {
                  navigate('/'); // Success! Code matched and approved
              } else {
                  // Pending
                  setSuccessMsg("تم استلام طلبك بنجاح. الحساب في انتظار مراجعة الإدارة (لم يتم إدخال كود تفعيل صالح).");
                  setIsRegistering(false); // Go back to login
                  setEmail(''); 
                  setPassword('');
                  setRegActivationCode('');
              }
          } else {
              // Auto login for parents
              login(regEmail, regPassword);
              navigate('/');
          }
      } else {
          setError(typeof result === 'string' ? result : "حدث خطأ أثناء التسجيل");
      }
  };

  const toggleMode = () => {
      setIsRegistering(!isRegistering);
      setError('');
      setSuccessMsg('');
      // Reset fields
      setEmail(''); setPassword('');
      setRegName(''); setRegEmail(''); setRegPassword(''); setRegActivationCode('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex overflow-hidden border-4 border-white/50 min-h-[600px]">
        
        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center transition-all duration-300">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    A
                </div>
                <h1 className="text-2xl font-bold text-slate-800 font-cairo">منصة اسيل</h1>
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {isRegistering ? 'إنشاء حساب جديد' : 'مرحباً بك مجدداً'}
            </h2>
            <p className="text-slate-500 mb-6">
                {isRegistering ? 'أدخل بياناتك للانضمام إلى المنصة' : 'قم بتسجيل الدخول للمتابعة'}
            </p>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-bold border border-red-100 flex items-center gap-2 animate-pulse">
                    <span className="block w-2 h-2 bg-red-600 rounded-full"></span>
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4 text-sm font-bold border border-green-200 leading-relaxed shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="block w-2 h-2 bg-green-600 rounded-full"></span>
                        تم التسجيل بنجاح!
                    </div>
                    {successMsg}
                </div>
            )}

            {!isRegistering ? (
                // LOGIN FORM
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
                        <div className="relative">
                            <Mail className="absolute right-3 top-3 text-slate-400" size={20} />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-cyan-500 focus:border-cyan-500 block p-3 pr-10" 
                                placeholder="name@example.com" 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-3 text-slate-400" size={20} />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-cyan-500 focus:border-cyan-500 block p-3 pr-10" 
                                placeholder="••••••••" 
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-300 font-bold rounded-xl text-lg px-5 py-3 text-center transition shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2"
                    >
                        تسجيل الدخول <ChevronRight size={20} />
                    </button>
                    
                    <div className="mt-4 text-center">
                        <p className="text-sm text-slate-500">ليس لديك حساب؟</p>
                        <button 
                            type="button" 
                            onClick={toggleMode}
                            className="text-cyan-600 font-bold hover:underline mt-1"
                        >
                            سجل حساب جديد الآن
                        </button>
                    </div>
                </form>
            ) : (
                // REGISTER FORM
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="flex gap-2 mb-2">
                        <button
                            type="button"
                            onClick={() => setRegRole(UserRole.PARENT)}
                            className={`flex-1 p-2 rounded-lg border font-bold text-sm flex items-center justify-center gap-2 transition ${regRole === UserRole.PARENT ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                        >
                            <Users size={16}/> ولي أمر
                        </button>
                        <button
                            type="button"
                            onClick={() => setRegRole(UserRole.DOCTOR)}
                            className={`flex-1 p-2 rounded-lg border font-bold text-sm flex items-center justify-center gap-2 transition ${regRole === UserRole.DOCTOR ? 'bg-cyan-100 border-cyan-300 text-cyan-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                        >
                            <Activity size={16}/> طبيب
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">الاسم الكامل</label>
                        <div className="relative">
                            <UserIcon className="absolute right-3 top-3 text-slate-400" size={20} />
                            <input 
                                type="text" 
                                required
                                value={regName}
                                onChange={(e) => setRegName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-cyan-500 focus:border-cyan-500 block p-3 pr-10" 
                                placeholder="الاسم" 
                            />
                        </div>
                    </div>

                    {regRole === UserRole.DOCTOR && (
                        <div className="animate-fadeIn p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                             <label className="block text-sm font-bold text-cyan-800 mb-1">كود التفعيل (للموافقة الفورية)</label>
                             <div className="relative">
                                <ShieldCheck className="absolute right-3 top-3 text-cyan-500" size={20} />
                                <input 
                                    type="text" 
                                    value={regActivationCode}
                                    onChange={(e) => setRegActivationCode(e.target.value)}
                                    className="w-full bg-white border border-cyan-200 text-slate-800 text-sm rounded-xl focus:ring-cyan-500 focus:border-cyan-500 block p-3 pr-10" 
                                    placeholder="أدخل كود التفعيل إن وجد" 
                                />
                            </div>
                            <p className="text-[10px] text-cyan-600 mt-1">
                                * إذا كان لديك كود تفعيل صحيح، ستدخل مباشرة. وإلا ستنتظر موافقة الأدمن.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                        <div className="relative">
                            <Mail className="absolute right-3 top-3 text-slate-400" size={20} />
                            <input 
                                type="email" 
                                required
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-cyan-500 focus:border-cyan-500 block p-3 pr-10" 
                                placeholder="example@mail.com" 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">كلمة المرور</label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-3 text-slate-400" size={20} />
                            <input 
                                type="password" 
                                required
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-cyan-500 focus:border-cyan-500 block p-3 pr-10" 
                                placeholder="••••••••" 
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-bold rounded-xl text-lg px-5 py-3 text-center transition shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                    >
                         إنشاء الحساب
                    </button>
                    
                    <div className="mt-4 text-center">
                        <button 
                            type="button" 
                            onClick={toggleMode}
                            className="text-slate-500 hover:text-slate-700 text-sm underline"
                        >
                            العودة لتسجيل الدخول
                        </button>
                    </div>
                </form>
            )}
        </div>

        {/* Right Side: Info / Image */}
        <div className="hidden md:flex md:w-1/2 bg-slate-50 p-12 flex-col justify-center relative overflow-hidden">
             {/* Abstract Shapes */}
             <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
             <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

             <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-700 mb-4">بيانات الدخول التجريبية</h3>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    
                    <div className="p-2 border-b border-slate-100 last:border-0">
                        <span className="block text-xs font-bold text-red-500 uppercase">الأدمن</span>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-mono text-slate-600">yashendy@gmail.com</span>
                            <span className="font-mono font-bold">123456</span>
                        </div>
                    </div>

                    <div className="p-2 border-b border-slate-100 last:border-0">
                        <span className="block text-xs font-bold text-indigo-500 uppercase">ولي الأمر</span>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-mono text-slate-600">parent@aseel.com</span>
                            <span className="font-mono font-bold">123456</span>
                        </div>
                    </div>

                    <div className="p-2 border-b border-slate-100 last:border-0">
                        <span className="block text-xs font-bold text-teal-500 uppercase">الطبيب (مفعل)</span>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-mono text-slate-600">doctor@aseel.com</span>
                            <span className="font-mono font-bold">123456</span>
                        </div>
                    </div>

                     <div className="p-2 border-b border-slate-100 last:border-0">
                        <span className="block text-xs font-bold text-yellow-600 uppercase">الطبيب (جديد/انتظار)</span>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-mono text-slate-600">sara@aseel.com</span>
                            <span className="font-mono font-bold">123456</span>
                        </div>
                    </div>

                </div>
                <p className="mt-6 text-sm text-slate-500 leading-relaxed">
                    منصة اسيل هي بيئة متكاملة لمتابعة صحة أطفال السكري، تربط بين البيت والعيادة لضمان حياة صحية آمنة.
                </p>
             </div>
        </div>
      </div>
    </div>
  );
};