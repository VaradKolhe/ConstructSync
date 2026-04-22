import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  UserPlus, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Loader2, 
  HardHat, 
  ShieldCheck,
  Wrench,
  CreditCard,
  MapPin,
  Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';

const LabourRegistration = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'MALE',
    phone: '',
    emergencyContact: '',
    address: '',
    skills: '',
    aadhaarNumber: '',
    bankDetails: {
      accountHolder: '',
      accountNumber: '',
      bankName: '',
      ifscCode: ''
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value.toUpperCase() }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s !== '');
      await api.post('/labours', { ...formData, skills: skillsArray });
      toast.success('Personnel Successfully Registered & IDs Generated');
      navigate('/labour');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration Protocol Failed');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Identity', icon: HardHat },
    { id: 2, title: 'Contact', icon: Smartphone },
    { id: 3, title: 'Skills', icon: Wrench },
    { id: 4, title: 'Finance', icon: CreditCard }
  ];

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/labour')}
          className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={3} />
          <span>Abort & Return</span>
        </button>
        <div className="flex items-center space-x-2 text-[10px] font-black tracking-[0.3em] text-orange-600 uppercase">
          <ShieldCheck className="h-4 w-4" />
          <span>Secure Registration Terminal</span>
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight italic">Provision Personnel</h1>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Execute New Labour Entry Protocol</p>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center justify-between relative px-4">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
        {steps.map((s) => (
          <div key={s.id} className="relative z-10 flex flex-col items-center space-y-2">
            <div className={`w-12 h-12 flex items-center justify-center border-4 transition-all duration-300 ${
              step >= s.id ? 'bg-slate-900 border-orange-600 text-white shadow-[4px_4px_0px_0px_rgba(234,88,12,1)]' : 'bg-white border-slate-100 text-slate-300'
            }`}>
              <s.icon size={20} strokeWidth={step >= s.id ? 3 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${step >= s.id ? 'text-slate-900' : 'text-slate-300'}`}>
              {s.title}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
        <div className="bg-slate-900 p-4 text-white">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center">
             <span className="w-2 h-2 bg-orange-600 mr-3"></span>
             Phase 0{step} of 04: {steps[step-1].title} Verification
           </p>
        </div>

        <div className="p-10">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name (Government ID)</label>
                <input required type="text" name="name" className="input-industrial" value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Aadhaar / National ID</label>
                <input required type="text" name="aadhaarNumber" className="input-industrial font-mono" placeholder="6475 XXXX XXXX" value={formData.aadhaarNumber} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Date of Birth</label>
                <input required type="date" name="dateOfBirth" className="input-industrial" value={formData.dateOfBirth} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Gender Classification</label>
                <select name="gender" className="input-industrial appearance-none" value={formData.gender} onChange={handleInputChange}>
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                  <option value="OTHER">OTHER / NON-BINARY</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Primary Contact Number</label>
                <input required type="tel" name="phone" className="input-industrial" placeholder="+91 00000 00000" value={formData.phone} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Emergency SOS Contact</label>
                <input required type="tel" name="emergencyContact" className="input-industrial" placeholder="CONTACT FOR EMERGENCIES" value={formData.emergencyContact} onChange={handleInputChange} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Permanent Residential Address</label>
                <textarea required name="address" rows="3" className="input-industrial resize-none" placeholder="FULL STREET ADDRESS, CITY, STATE, PINCODE" value={formData.address} onChange={handleInputChange}></textarea>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Skill Matrix (Required - Comma Separated)</label>
                <input required type="text" name="skills" className="input-industrial" placeholder="MASONRY, PLUMBING, WELDING..." value={formData.skills} onChange={handleInputChange} />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Input technical specializations for deployment filtering.</p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
                {['MASONRY', 'WELDING', 'ELECTRICAL', 'PLUMBING', 'CARPENTRY', 'RIGGING'].map(s => (
                  <button 
                    key={s} 
                    type="button"
                    onClick={() => {
                      const current = formData.skills ? formData.skills.split(',').map(x => x.trim()) : [];
                      if (!current.includes(s)) {
                        setFormData(prev => ({ ...prev, skills: current.concat(s).join(', ') }));
                      }
                    }}
                    className="p-3 border-2 border-slate-100 text-[10px] font-black text-slate-500 hover:border-slate-900 hover:text-slate-900 transition-all uppercase"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Holder Name</label>
                <input required type="text" name="bankDetails.accountHolder" className="input-industrial" value={formData.bankDetails.accountHolder} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Bank Identifier (Name)</label>
                <input required type="text" name="bankDetails.bankName" className="input-industrial" placeholder="E.G. HDFC BANK" value={formData.bankDetails.bankName} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Number</label>
                <input required type="text" name="bankDetails.accountNumber" className="input-industrial font-mono" value={formData.bankDetails.accountNumber} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">IFSC Routing Code</label>
                <input required type="text" name="bankDetails.ifscCode" className="input-industrial font-mono" placeholder="ABCD0123456" value={formData.bankDetails.ifscCode} onChange={handleInputChange} />
              </div>
            </div>
          )}

          <div className="mt-12 flex justify-between border-t-2 border-slate-100 pt-8">
            {step > 1 ? (
              <button 
                type="button" 
                onClick={() => setStep(prev => prev - 1)}
                className="flex items-center space-x-2 px-6 py-4 border-2 border-slate-900 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft size={16} strokeWidth={3} />
                <span>Previous Phase</span>
              </button>
            ) : <div></div>}

            {step < 4 ? (
              <button 
                type="button" 
                onClick={() => setStep(prev => prev + 1)}
                className="flex items-center space-x-2 px-8 py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest btn-industrial-shadow"
              >
                <span>Next Phase</span>
                <ArrowRight size={16} strokeWidth={3} />
              </button>
            ) : (
              <button 
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-8 py-4 bg-orange-600 text-white text-xs font-black uppercase tracking-widest btn-industrial-shadow"
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>
                    <span>Execute Registration</span>
                    <Check size={16} strokeWidth={3} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="p-6 bg-slate-900 text-white border-l-8 border-orange-600 flex space-x-5 shadow-2xl">
        <div className="bg-orange-600 h-6 w-6 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <p className="text-[10px] font-bold leading-relaxed uppercase tracking-[0.1em]">
          Operational Warning: All personnel data entries are recorded, timestamped, and audited. Ensure all government ID details are verified against physical documentation.
        </p>
      </div>
    </div>
  );
};

export default LabourRegistration;
