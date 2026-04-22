import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  User, 
  Mail, 
  Shield, 
  Lock, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put('/auth/update-profile', formData);
      toast.success('Profile Synchronization Complete');
      setUser(response.data.data);
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Profile Update Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm">
      <div className="bg-white border-4 border-slate-900 max-w-md w-full shadow-[16px_16px_0px_0px_rgba(234,88,12,1)] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center border-b-4 border-orange-600">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-600 p-1.5">
              <User className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tighter italic">Personnel Profile</h2>
          </div>
          <button onClick={onClose} className="hover:text-orange-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="flex justify-center mb-8">
              <div className="relative group">
                {/* Visual Initials Avatar */}
                <div className="w-24 h-24 bg-slate-900 border-4 border-slate-900 flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(234,88,12,1)] relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-transparent opacity-50"></div>
                   <span className="text-5xl font-black text-white italic relative z-10 select-none">
                      {user.name?.charAt(0).toUpperCase()}
                   </span>
                   {/* Decorative industrial elements */}
                   <div className="absolute top-0 left-0 w-2 h-2 bg-orange-600"></div>
                   <div className="absolute bottom-0 right-0 w-2 h-2 bg-orange-600"></div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Personnel Name</label>
                <div className="relative">
                   <input 
                    type="text" 
                    readOnly={!isEditing}
                    className={`input-industrial ${!isEditing ? 'bg-slate-50 border-slate-200 text-slate-500 italic font-medium' : 'bg-white font-black'}`}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                   />
                   {!isEditing && <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Authorized Email</label>
                <div className="relative">
                   <input 
                    type="email" 
                    readOnly={!isEditing}
                    className={`input-industrial ${!isEditing ? 'bg-slate-50 border-slate-200 text-slate-500 italic font-medium' : 'bg-white font-black'}`}
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                   />
                   {!isEditing && <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6 grid grid-cols-2 gap-4">
                 <div className="p-3 bg-slate-50 border-2 border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Clearance Level</p>
                    <div className="flex items-center space-x-2">
                       <Shield size={12} className="text-orange-600" />
                       <span className="text-[10px] font-black uppercase text-slate-900">{user.role}</span>
                    </div>
                 </div>
                 <div className="p-3 bg-slate-50 border-2 border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Account Status</p>
                    <div className="flex items-center space-x-2">
                       <CheckCircle2 size={12} className="text-emerald-600" />
                       <span className="text-[10px] font-black uppercase text-slate-900">Active</span>
                    </div>
                 </div>
              </div>
            </div>

            <div className="pt-8 flex gap-4">
              {!isEditing ? (
                <button 
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] btn-industrial-shadow hover:bg-orange-600 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-grow py-4 bg-orange-600 text-white text-xs font-black uppercase tracking-[0.2em] btn-industrial-shadow"
                  >
                    {loading ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : 'Save Changes'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-4 border-2 border-slate-900 text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        <div className="bg-slate-50 p-4 border-t-2 border-slate-900">
           <p className="text-[9px] font-bold text-center text-slate-400 uppercase tracking-[0.1em] flex items-center justify-center">
             <AlertCircle size={10} className="mr-2" /> 
             Security changes are logged for system audit.
           </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
