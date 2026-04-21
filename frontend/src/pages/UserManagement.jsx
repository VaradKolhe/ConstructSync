import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Shield, 
  CheckCircle, 
  XCircle,
  Loader2,
  HardHat,
  ChevronRight,
  UserCheck,
  UserMinus
} from 'lucide-react';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    role: 'SUPERVISOR'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data.data);
    } catch (err) {
      toast.error('Failed to retrieve personnel database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/auth/register', registerData);
      toast.success('Personnel Authorized: Credentials Dispatched');
      setShowRegisterModal(false);
      setRegisterData({ name: '', email: '', role: 'SUPERVISOR' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authorization Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserStatus = async (user) => {
    try {
      await api.put(`/auth/users/${user._id}`, { isActive: !user.isActive });
      toast.success(`Access ${!user.isActive ? 'Restored' : 'Revoked'} for ${user.name}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update access status');
    }
  };

  return (
    <div className="p-10 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">
            Personnel Directory
          </h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest flex items-center">
            <Shield className="h-4 w-4 mr-2 text-orange-600" />
            Authorization Control Terminal
          </p>
        </div>
        <button 
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center justify-center space-x-3 px-6 py-4 bg-orange-600 text-white text-xs font-black uppercase tracking-[0.2em] btn-industrial-shadow transition-transform hover:-translate-y-1 active:translate-y-0"
        >
          <UserPlus size={18} strokeWidth={3} />
          <span>Authorize New Staff</span>
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input 
            type="text" 
            placeholder="SEARCH BY NAME, EMAIL, OR ROLE..."
            className="w-full pl-12 pr-4 py-4 border-2 border-slate-900 bg-white text-xs font-black uppercase tracking-widest focus:outline-none focus:bg-slate-50"
          />
        </div>
        <button className="flex items-center justify-center space-x-2 px-6 py-4 border-2 border-slate-900 bg-white text-xs font-black uppercase tracking-widest hover:bg-slate-50">
          <Filter size={16} />
          <span>Protocol Filter</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border-2 border-slate-900 overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white border-b-2 border-slate-900">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Personnel Details</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Designation</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Onboarding</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-20 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-orange-600 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Secure Database...</p>
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase">{user.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center mt-0.5">
                          <Mail className="h-3 w-3 mr-1" /> {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black px-2 py-1 uppercase border-2 ${
                      user.role === 'ADMIN' ? 'bg-orange-600 text-white border-orange-600' :
                      user.role === 'HR' ? 'bg-blue-600 text-white border-blue-600' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {user.isActive ? (
                        <span className="flex items-center text-[9px] font-black text-emerald-600 uppercase">
                          <CheckCircle className="h-3 w-3 mr-1" /> Authorized
                        </span>
                      ) : (
                        <span className="flex items-center text-[9px] font-black text-red-600 uppercase">
                          <XCircle className="h-3 w-3 mr-1" /> Revoked
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="w-full max-w-[100px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${user.isFirstLogin ? 'w-1/3 bg-orange-400' : 'w-full bg-emerald-500'}`}></div>
                     </div>
                     <p className="text-[8px] font-black text-slate-400 uppercase mt-1">
                        {user.isFirstLogin ? 'PENDING' : 'COMPLETED'}
                     </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                        onClick={() => toggleUserStatus(user)}
                        title={user.isActive ? "Revoke Access" : "Grant Access"}
                        className={`p-2 border-2 ${user.isActive ? 'border-red-600 text-red-600' : 'border-emerald-600 text-emerald-600'} hover:bg-slate-900 hover:text-white transition-all`}
                       >
                         {user.isActive ? <UserMinus size={14} /> : <UserCheck size={14} />}
                       </button>
                       <button className="p-2 border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-all">
                         <MoreVertical size={14} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-20 text-center text-slate-400 uppercase text-[10px] font-black tracking-widest">
                  No personnel records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white border-4 border-slate-900 max-w-md w-full shadow-[12px_12px_0px_0px_rgba(234,88,12,1)] overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="bg-slate-900 p-6 text-white flex justify-between items-center border-b-4 border-orange-600">
               <div className="flex items-center space-x-3">
                 <HardHat className="text-orange-500" />
                 <h2 className="text-xl font-black uppercase tracking-tighter italic">Provision Staff</h2>
               </div>
               <button onClick={() => setShowRegisterModal(false)} className="hover:text-orange-500">
                 <XCircle size={24} />
               </button>
             </div>
             
             <form onSubmit={handleRegister} className="p-8 space-y-6">
               <div className="space-y-2">
                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Personnel Name</label>
                 <input 
                  required
                  type="text" 
                  className="input-industrial"
                  placeholder="E.G. JOHN DOE"
                  value={registerData.name}
                  onChange={e => setRegisterData({...registerData, name: e.target.value.toUpperCase()})}
                 />
               </div>
               
               <div className="space-y-2">
                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Professional Email Address</label>
                 <input 
                  required
                  type="email" 
                  className="input-industrial"
                  placeholder="NAME@CONSTRUCTSYNC.COM"
                  value={registerData.email}
                  onChange={e => setRegisterData({...registerData, email: e.target.value.toLowerCase()})}
                 />
               </div>
               
               <div className="space-y-2">
                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Assigned Security Clearance</label>
                 <select 
                  className="input-industrial appearance-none"
                  value={registerData.role}
                  onChange={e => setRegisterData({...registerData, role: e.target.value})}
                 >
                   <option value="SUPERVISOR">SUPERVISOR (SITE ACCESS)</option>
                   <option value="HR">HR MANAGER (LABOUR CONTROL)</option>
                   <option value="ADMIN">SYSTEM ADMIN (ROOT ACCESS)</option>
                 </select>
               </div>

               <div className="bg-slate-50 p-4 border-2 border-slate-100 mb-6">
                 <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed">
                   Notice: A temporary credential package will be dispatched to the provided email address. Personnel must complete secure onboarding upon first access.
                 </p>
               </div>

               <button 
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-3 py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] btn-industrial-shadow hover:bg-orange-600 transition-colors"
               >
                 {submitting ? <Loader2 className="animate-spin" /> : (
                   <>
                    <span>Execute Provisioning</span>
                    <ChevronRight size={18} strokeWidth={3} />
                   </>
                 )}
               </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
