import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, ShieldCheck, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const OnboardingPage = () => {
  const { user, verifyOTP, completeOnboarding } = useAuth();
  const [step, setStep] = useState(user?.isEmailVerified ? 2 : 1);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyOTP(otp);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    setError('');
    try {
      await completeOnboarding(password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-orange-600 p-8 text-white">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Secure Onboarding</h1>
            <ShieldCheck className="h-8 w-8 opacity-50" />
          </div>
          <p className="text-orange-100 text-sm">Step {step} of 2: {step === 1 ? 'Verify Identity' : 'Set Security Credentials'}</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter Verification Code</label>
                <p className="text-xs text-gray-500 mb-4">A 6-digit code has been sent to your work email: <span className="font-semibold text-gray-700">{user?.email}</span></p>
                <input
                  type="text"
                  maxLength="6"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center text-2xl font-bold tracking-widest"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full flex justify-center items-center py-3 px-4 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                  <>Verify Code <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleComplete} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Secure Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Min 8 chars, 1 Upper, 1 Special"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Security Requirements:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li className="flex items-center"><CheckCircle2 className={`h-3 w-3 mr-2 ${password.length >= 8 ? 'text-green-500' : 'text-blue-300'}`} /> Minimum 8 characters</li>
                  <li className="flex items-center"><CheckCircle2 className={`h-3 w-3 mr-2 ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-blue-300'}`} /> At least one uppercase letter</li>
                  <li className="flex items-center"><CheckCircle2 className={`h-3 w-3 mr-2 ${/[@$!%*?&]/.test(password) ? 'text-green-500' : 'text-blue-300'}`} /> One special character (@$!%*?&)</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading || password !== confirmPassword || password.length < 8}
                className="w-full flex justify-center items-center py-3 px-4 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "COMPLETE SETUP"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
