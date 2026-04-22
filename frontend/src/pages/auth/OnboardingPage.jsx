import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ArrowRight, Loader2, HardHat, Mail, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const OnboardingPage = () => {
  const { user, requestOTP, verifyOTP, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Determine starting step based on user status
  useEffect(() => {
    if (user) {
      if (!user.isEmailVerified) {
        if (user.role === 'ADMIN' && user.email === 'admin@test.com') {
          setStep(1);
        } else {
          setStep(2);
        }
      } else {
        setStep(3);
      }
    }
  }, [user]);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const msg = await requestOTP(newEmail || undefined);
      toast.success(msg || 'Verification Code Dispatched');
      setStep(2);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOTP(otp, user.role === 'ADMIN' && user.email === 'admin@test.com' ? newEmail : undefined);
      toast.success('Identity Verified Successfully');
      setStep(3);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      await completeOnboarding(password);
      toast.success('Security Protocol Finalized: Access Granted');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-6 lg:p-12 industrial-grid bg-white">
      <div className="max-w-md w-full bg-white border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
        <div className="bg-slate-900 p-8 text-white relative">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-600 p-1.5">
                <HardHat className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-black uppercase tracking-tighter">SECURE ONBOARDING</h1>
            </div>
            <ShieldCheck className="h-6 w-6 text-orange-500" />
          </div>
          
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1 flex-grow ${step >= i ? 'bg-orange-600' : 'bg-slate-700'}`}></div>
            ))}
          </div>
          
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
            Phase 0{step} of 03: {
              step === 1 ? 'Contact Registration' : 
              step === 2 ? 'Identity Verification' : 
              'Security Credentials'
            }
          </p>
        </div>

        <div className="p-8">
          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-black tracking-[0.2em] text-slate-500 uppercase">Primary Admin Email</label>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 italic">Update placeholder admin@test.com to your professional email.</p>
                <input
                  type="email"
                  required
                  className="input-industrial"
                  placeholder="name@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 bg-orange-600 text-white font-black tracking-[0.2em] text-xs uppercase btn-industrial-shadow"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                  <>REQUEST VERIFICATION CODE <ArrowRight className="ml-2 h-4 w-4" strokeWidth={3} /></>
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-black tracking-[0.2em] text-slate-500 uppercase">Input Verification Code</label>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Code dispatched to: <span className="text-slate-900 underline underline-offset-2">{newEmail || user?.email}</span></p>
                <input
                  type="text"
                  maxLength="6"
                  required
                  className="w-full px-4 py-4 border-2 border-slate-900 focus:outline-none focus:border-orange-600 text-center text-3xl font-black tracking-[0.3em] bg-slate-50"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <div className="flex justify-between">
                <button 
                  type="button"
                  onClick={() => setStep(user.role === 'ADMIN' && user.email === 'admin@test.com' ? 1 : 2)}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900"
                >
                  Change Email
                </button>
                <button 
                  type="button"
                  onClick={handleRequestOTP}
                  className="text-[10px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700"
                >
                  Resend Code
                </button>
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full flex justify-center items-center py-4 bg-orange-600 text-white font-black tracking-[0.2em] text-xs uppercase btn-industrial-shadow disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                  <>EXECUTE VERIFICATION <ArrowRight className="ml-2 h-4 w-4" strokeWidth={3} /></>
                )}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleComplete} className="space-y-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black tracking-[0.2em] text-slate-500 uppercase mb-2">Set Master Password</label>
                  <input
                    type="password"
                    required
                    className="input-industrial"
                    placeholder="MIN 8 CHARS"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black tracking-[0.2em] text-slate-500 uppercase mb-2">Confirm Credentials</label>
                  <input
                    type="password"
                    required
                    className="input-industrial"
                    placeholder="REPEAT PASSWORD"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-2 border-slate-100 space-y-2">
                <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Protocol Compliance:</h4>
                <ul className="text-[9px] font-bold text-slate-500 space-y-1 uppercase">
                  <li className="flex items-center"><CheckCircle2 className={`h-3 w-3 mr-2 ${password.length >= 8 ? 'text-green-600' : 'text-slate-300'}`} /> Min 8 characters</li>
                  <li className="flex items-center"><CheckCircle2 className={`h-3 w-3 mr-2 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-slate-300'}`} /> Uppercase Required</li>
                  <li className="flex items-center"><CheckCircle2 className={`h-3 w-3 mr-2 ${/[@$!%*?&]/.test(password) ? 'text-green-600' : 'text-slate-300'}`} /> Symbol Required</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading || password !== confirmPassword || password.length < 8}
                className="w-full flex justify-center items-center py-4 bg-orange-600 text-white font-black tracking-[0.2em] text-xs uppercase btn-industrial-shadow disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "FINALIZE PROTOCOL"}
              </button>
            </form>
          )}
        </div>
        
        <div className="bg-slate-50 p-4 border-t-2 border-slate-900">
           <p className="text-[9px] font-bold text-center text-slate-400 uppercase tracking-[0.1em]">
             Authorized personnel only. Sessions are audited and logged.
           </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
