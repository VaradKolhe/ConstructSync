import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Loader2, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Access Keys Do Not Match');
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      toast.success('Security Protocol Updated');
    } catch (err) {
      toast.error(err.message || 'Reset Protocol Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white industrial-grid p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-4">
          <div className="inline-block bg-slate-900 p-3 mb-2">
            <Lock className="text-orange-600 h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">Reset Password</h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest leading-relaxed">
            Establish New System Access Key
          </p>
        </div>

        {!success ? (
          <div className="bg-white border-4 border-slate-900 p-10 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">New Security Key</label>
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
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirm Security Key</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-industrial"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-white font-black tracking-[0.2em] text-xs uppercase flex items-center justify-center space-x-3 btn-industrial-shadow hover:bg-orange-600 transition-all"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <span>Update Access Key</span>}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white border-4 border-slate-900 p-10 shadow-[12px_12px_0px_0px_rgba(22,163,74,1)] text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase text-slate-900">Security Key Updated</h3>
              <p className="text-xs font-bold text-slate-500 uppercase leading-relaxed tracking-wider">
                Your new authorization credentials have been established successfully.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-slate-900 text-white font-black tracking-widest text-[10px] uppercase btn-industrial-shadow hover:bg-orange-600"
            >
              Proceed to Access Terminal
            </button>
          </div>
        )}

        <div className="p-4 bg-slate-50 border-2 border-slate-100 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">
            Master Protocol: Passwords must be 8+ chars with uppercase, lowercase, numbers & special symbols.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
