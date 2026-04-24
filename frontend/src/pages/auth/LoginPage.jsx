import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, ArrowRight, Loader2, HardHat, ShieldCheck, Info, Activity, Globe, Database } from 'lucide-react';
import heroImage from '../../assets/image.png';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const fullText = "Unmatched Precision.";
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setTypewriterText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await login(email, password, rememberMe);
      toast.success(`Access Authorized: Welcome ${user.name}`);
      if (user.isFirstLogin || !user.isEmailVerified) {
        navigate('/onboarding');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Authentication Failed';
      const status = err.response?.status;
      
      if (status === 403) {
        toast.error(`Access Denied: ${errorMessage}`, {
          icon: '🚫',
          duration: 5000
        });
      } else if (status === 401) {
        toast.error('Invalid Credentials: Check email and security key.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white font-sans text-slate-900 overflow-hidden industrial-grid relative">
      {/* Dynamic Background Elements */}
      <div className="absolute top-20 left-20 opacity-[0.03] pointer-events-none animate-spin-slow">
        <Activity size={400} />
      </div>
      <div className="absolute bottom-20 right-20 opacity-[0.03] pointer-events-none animate-pulse">
        <Globe size={300} />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none">
        <Database size={600} />
      </div>

      {/* Top Header */}
      <header className="flex justify-between items-center px-10 py-5 border-b-2 border-slate-900 bg-white/80 backdrop-blur-md shrink-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-900 p-1.5 transform hover:rotate-12 transition-transform duration-300">
            <HardHat className="text-orange-500 h-6 w-6" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase italic">
            CONSTRUCT<span className="text-orange-600">SYNC</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex flex-col items-end mr-4">
             <span className="text-[8px] font-black text-emerald-600 uppercase">System Status: Optimal</span>
             <span className="text-[8px] font-black text-slate-400 uppercase">Uptime: 99.98%</span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">
            <ShieldCheck className="h-4 w-4 text-orange-600" />
            <span>Authorization Terminal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-grow flex-col lg:flex-row overflow-hidden relative z-20">
        
        {/* Left Side - Hero Image Section */}
        <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r-2 border-slate-900 group">
          <img 
            src={heroImage} 
            alt="Construction Site" 
            className="absolute inset-0 w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[3000ms] ease-out"
          />
          <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
          
          {/* Animated Scanline */}
          <div className="absolute inset-0 bg-scanline pointer-events-none opacity-20"></div>

          <div className="relative z-10 flex flex-col justify-end p-20 h-full max-w-2xl text-white">
            <div className="w-16 h-1 bg-orange-500 mb-6 animate-width"></div>
            <h2 className="text-4xl font-black leading-tight mb-4 uppercase tracking-tight italic">
              Building the Future <br />With <span className="text-orange-500 underline decoration-4 underline-offset-8 min-h-[1.2em] inline-block">{typewriterText}<span className="animate-pulse">_</span></span>
            </h2>
            <p className="text-lg font-medium leading-relaxed text-slate-200 border-l-2 border-orange-500 pl-6 backdrop-blur-[2px]">
              The enterprise standard for mission-critical construction management, labour logistics, and operational safety.
            </p>
          </div>
        </section>

        {/* Right Side - Login Form Section */}
        <section className="flex-grow flex items-center justify-center p-8 lg:p-24 overflow-y-auto bg-white/40 backdrop-blur-sm relative">
          <div className="w-full max-w-md space-y-10 relative z-10 animate-fade-in-up">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                <h3 className="text-xs font-black tracking-[0.3em] text-slate-500 uppercase">
                  Security Clearance Required
                </h3>
              </div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">System Access</h1>
              <p className="text-sm font-medium text-slate-500">
                Please enter your credentials to access the project dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                <div className="group">
                  <label className="block text-[11px] font-black tracking-[0.2em] text-slate-500 uppercase mb-2 group-focus-within:text-orange-600 transition-colors">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    required
                    className="input-industrial focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 transition-all"
                    placeholder="e.g. user@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative group">
                  <label className="block text-[11px] font-black tracking-[0.2em] text-slate-500 uppercase mb-2 group-focus-within:text-orange-600 transition-colors">
                    Security Key / Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="input-industrial pr-12 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 transition-all"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      className="peer appearance-none w-5 h-5 border-2 border-slate-900 checked:bg-orange-600 checked:border-orange-600 transition-all cursor-pointer" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <svg className="absolute w-3.5 h-3.5 text-white left-0.5 pointer-events-none hidden peer-checked:block animate-in zoom-in duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-[11px] font-black tracking-widest text-slate-500 uppercase group-hover:text-slate-900 transition-colors">Remember Me</span>
                </label>
                <button 
                  type="button" 
                  onClick={() => navigate('/forgot-password')}
                  className="text-[11px] font-black tracking-widest text-orange-600 hover:text-slate-900 uppercase underline decoration-2 underline-offset-4 transition-colors"
                >
                  Forgot Password
                </button>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-orange-600 hover:bg-slate-900 text-white font-black tracking-[0.2em] text-sm uppercase flex items-center justify-center space-x-4 transition-all btn-industrial-shadow active:translate-y-1 active:shadow-none"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <>
                      <span>Authorize Access</span>
                      <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Warning Box */}
            <div className="p-6 bg-slate-900 text-white border-l-8 border-orange-600 flex space-x-5 shadow-2xl animate-pulse-subtle">
              <div className="bg-orange-600 h-6 w-6 flex items-center justify-center shrink-0">
                <Info className="h-4 w-4 text-white" />
              </div>
              <p className="text-[10px] font-bold leading-relaxed uppercase tracking-[0.1em]">
                Notice: Secure government-grade system. All session data is encrypted, logged, and audited for security compliance.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-10 py-6 border-t-2 border-slate-900 bg-white/80 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 shrink-0 z-30">
        <div className="flex items-center space-x-4">
          <p className="text-[10px] font-black tracking-widest text-slate-900 uppercase">
            © 2026 CONSTRUCTSYNC INFRASTRUCTURE
          </p>
          <span className="text-slate-200">|</span>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Build v2.4.0-Stable</p>
        </div>
        <div className="flex space-x-10">
          {['Network Status', 'Privacy Protocol', 'Service Terms'].map((link) => (
            <button key={link} className="text-[10px] font-black tracking-widest text-slate-400 hover:text-slate-900 uppercase transition-colors relative group">
              {link}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-600 transition-all group-hover:w-full"></span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
