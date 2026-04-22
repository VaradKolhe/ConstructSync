import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowLeft, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
      toast.success('Recovery Protocol Initiated');
    } catch (err) {
      toast.error(err.message || 'Recovery Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white industrial-grid p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-4">
          <div className="inline-block bg-slate-900 p-3 mb-2">
            <ShieldCheck className="text-orange-600 h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">Forgot Password</h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest leading-relaxed">
            Initialize Security Key Recovery Protocol
          </p>
        </div>

        {!submitted ? (
          <div className="bg-white border-4 border-slate-900 p-10 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Work Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    className="input-industrial pl-12"
                    placeholder="ENTER AUTHORIZED EMAIL"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-orange-600 text-white font-black tracking-[0.2em] text-xs uppercase flex items-center justify-center space-x-3 btn-industrial-shadow hover:bg-slate-900 transition-all"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <span>Dispatch Recovery Email</span>}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center space-x-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft size={14} strokeWidth={3} />
                <span>Return to Access Terminal</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white border-4 border-slate-900 p-10 shadow-[12px_12px_0px_0px_rgba(22,163,74,1)] text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase text-slate-900">Transmission Successful</h3>
              <p className="text-xs font-bold text-slate-500 uppercase leading-relaxed tracking-wider">
                A secure recovery link has been dispatched to <span className="text-slate-900">{email}</span>. Please verify your inbox and execute reset within 10 minutes.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-slate-900 text-white font-black tracking-widest text-[10px] uppercase btn-industrial-shadow hover:bg-orange-600"
            >
              Return to Login
            </button>
          </div>
        )}

        <div className="p-4 bg-slate-50 border-2 border-slate-100">
          <p className="text-[9px] font-bold text-slate-400 uppercase text-center leading-relaxed">
            Notice: If the provided email exists in our records, a secure reset token will be generated. All recovery attempts are logged for audit.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
