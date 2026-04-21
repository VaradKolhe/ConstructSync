import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, ArrowRight, Info, Loader2 } from 'lucide-react';
import heroImage from '../../assets/image.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.isFirstLogin || !user.isEmailVerified) {
        navigate('/onboarding');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white font-sans text-slate-900 overflow-hidden industrial-grid">
      {/* Login Header (Standalone for branding) */}
      <header className="flex justify-between items-center px-10 py-5 border-b-2 border-slate-900 bg-white shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <span className="text-2xl font-black tracking-tighter uppercase italic">
            CONSTRUCT<span className="text-orange-600">SYNC</span>
          </span>
        </div>
        <button className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          Authorization Terminal
        </button>
      </header>

      {/* Main Content */}
      <main className="flex flex-grow flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side - Hero Image Section */}
        <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r-2 border-slate-900">
          <img 
            src={heroImage} 
            alt="Construction Site" 
            className="absolute inset-0 w-full h-full object-cover grayscale-[0.3]"
          />
          <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
          
          <div className="relative z-10 flex flex-col justify-end p-20 h-full max-w-2xl text-white">
            <div className="w-16 h-1 bg-orange-500 mb-6"></div>
            <h2 className="text-4xl font-black leading-tight mb-4 uppercase tracking-tight">
              Building the Future <br />With <span className="text-orange-500">Unmatched Precision.</span>
            </h2>
            <p className="text-lg font-medium leading-relaxed text-slate-200 border-l-2 border-orange-500 pl-6">
              The enterprise standard for mission-critical construction management and operational safety.
            </p>
          </div>
        </section>

        {/* Right Side - Login Form Section */}
        <section className="flex-grow flex items-center justify-center p-8 lg:p-24 overflow-y-auto bg-white/80 backdrop-blur-sm relative">
          <div className="w-full max-w-md space-y-10 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                <h3 className="text-xs font-black tracking-[0.3em] text-slate-500 uppercase">
                  Authentication Required
                </h3>
              </div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">System Access</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 text-xs font-bold flex items-center space-x-3">
                  <Info className="h-5 w-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black tracking-[0.2em] text-slate-500 uppercase mb-2">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    required
                    className="input-industrial"
                    placeholder="e.g. admin@test.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <label className="block text-[11px] font-black tracking-[0.2em] text-slate-500 uppercase mb-2">
                    Security Key / Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="input-industrial pr-12"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-orange-600 hover:bg-slate-900 text-white font-black tracking-[0.2em] text-sm uppercase flex items-center justify-center space-x-4 transition-all btn-industrial-shadow"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <>
                      <span>Authorize Access</span>
                      <ArrowRight size={20} strokeWidth={3} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="p-6 bg-slate-900 text-white border-l-8 border-orange-600 flex space-x-5 shadow-2xl">
              <p className="text-[10px] font-bold leading-relaxed uppercase tracking-[0.1em]">
                Notice: Secure government-grade system. All session data is encrypted, logged, and audited.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-10 py-6 border-t-2 border-slate-900 bg-white flex justify-between items-center shrink-0 z-20">
        <p className="text-[10px] font-black tracking-widest text-slate-900 uppercase">
          © 2026 CONSTRUCTSYNC INFRASTRUCTURE
        </p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">v2.4.0-Stable</p>
      </footer>
    </div>
  );
};

export default LoginPage;
