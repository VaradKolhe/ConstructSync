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
  UserMinus,
  PowerOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    role: 'SUPERVISOR'
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data.data);
      setFilteredUsers(response.data.data);
    } catch (err) {
      toast.error('Failed to retrieve personnel database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = [...users];

    // Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
      );
    }

    // Status Filter
    if (statusFilter !== 'ALL') {
      const isActive = statusFilter === 'AUTHORIZED';
      result = result.filter(u => u.isActive === isActive);
    }

    // Role Filter
    if (roleFilter !== 'ALL') {
      result = result.filter(u => u.role === roleFilter);
    }

    setFilteredUsers(result);
  }, [searchQuery, statusFilter, roleFilter, users]);

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

  const handleKillSession = async (user) => {
    if (!window.confirm(`SECURITY ALERT: Remotely terminate all active sessions for ${user.name}?`)) return;
    try {
      await api.post(`/auth/users/${user._id}/kill-session`);
      toast.success('Personnel Forcefully Logged Out');
    } catch (err) {
      toast.error('Session Termination Protocol Failed');
    }
  };

  const openUserDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  return (
    <div className="p-10 space-y-12">
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
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input 
            type="text" 
            placeholder="SEARCH BY NAME, EMAIL, OR ROLE..."
            className="w-full pl-12 pr-4 py-4 border-2 border-slate-900 bg-white text-xs font-black uppercase tracking-widest focus:outline-none focus:bg-slate-50 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select 
            className="px-6 py-4 border-2 border-slate-900 bg-white text-xs font-black uppercase tracking-widest focus:outline-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">ALL STATUS</option>
            <option value="AUTHORIZED">AUTHORIZED</option>
            <option value="REVOKED">REVOKED</option>
          </select>
          <select 
            className="px-6 py-4 border-2 border-slate-900 bg-white text-xs font-black uppercase tracking-widest focus:outline-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">ALL ROLES</option>
            <option value="ADMIN">ADMIN</option>
            <option value="HR">HR</option>
            <option value="SUPERVISOR">SUPERVISOR</option>
          </select>
        </div>
      </div>

      {/* Modern Tabular Layout (Button-style Rows) */}
      <div className="space-y-6">
        <div className="hidden md:grid grid-cols-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
           <div className="col-span-2">Personnel Identity</div>
           <div>Security Level</div>
           <div>Authorization</div>
           <div className="text-right">Operations</div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center bg-white border-2 border-slate-900 btn-industrial-shadow">
              <Loader2 className="h-10 w-10 animate-spin text-orange-600 mx-auto mb-4" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Secure Database...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div 
                key={user._id}
                onClick={() => openUserDetail(user)}
                className="group relative bg-white border-2 border-slate-900 p-6 md:p-8 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:-translate-x-1 active:translate-y-0 active:translate-x-0 btn-industrial-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-6">
                  {/* Personnel Details */}
                  <div className="col-span-2 flex items-center space-x-6">
                    <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center font-black text-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(234,88,12,1)] group-hover:bg-orange-600 transition-colors">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-900 uppercase italic tracking-tight">{user.name}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter flex items-center mt-1">
                        <Mail className="h-3.5 w-3.5 mr-2 text-orange-500" /> {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Designation */}
                  <div>
                    <span className={`text-xs font-black px-4 py-2 uppercase border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      user.role === 'ADMIN' ? 'bg-orange-600 text-white border-slate-900' :
                      user.role === 'HR' ? 'bg-blue-600 text-white border-slate-900' :
                      'bg-slate-100 text-slate-900 border-slate-900'
                    }`}>
                      {user.role}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center">
                        {user.isActive ? (
                          <span className="flex items-center text-xs font-black text-emerald-600 uppercase">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                            Authorized
                          </span>
                        ) : (
                          <span className="flex items-center text-xs font-black text-red-600 uppercase">
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full mr-2"></div>
                            Revoked
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         Onboarding: {user.isFirstLogin ? 'Pending' : 'Verified'}
                      </div>
                    </div>
                  </div>

                  {/* Operations */}
                  <div className="text-right flex justify-end space-x-3" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => toggleUserStatus(user)}
                      className={`p-3 border-2 border-slate-900 transition-all shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 ${
                        user.isActive ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                      }`}
                      title={user.isActive ? "Revoke Access" : "Grant Access"}
                    >
                      {user.isActive ? <UserMinus size={16} strokeWidth={3} /> : <UserCheck size={16} strokeWidth={3} />}
                    </button>
                    <button 
                      onClick={() => handleKillSession(user)}
                      className="p-3 border-2 border-slate-900 bg-white text-orange-600 hover:bg-slate-900 hover:text-white transition-all shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
                      title="Remote Session Termination (Force Logout)"
                    >
                      <PowerOff size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center bg-slate-50 border-2 border-dashed border-slate-300">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No Personnel Records Match Parameters</p>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-sm">
           <div className="bg-white border-4 border-slate-900 max-w-2xl w-full shadow-[16px_16px_0px_0px_rgba(234,88,12,1)] overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-slate-900 p-10 text-white relative border-b-8 border-orange-600">
                 <button 
                  onClick={() => setShowDetailModal(false)}
                  className="absolute top-8 right-8 p-2 text-slate-400 hover:text-orange-500 transition-colors border-2 border-slate-700 hover:border-orange-500"
                 >
                   <XCircle size={28} />
                 </button>
                 
                 <div className="flex items-center space-x-8">
                    <div className="w-24 h-24 bg-white border-4 border-orange-600 flex items-center justify-center text-slate-900 font-black text-5xl italic shadow-[8px_8px_0px_0px_rgba(234,88,12,1)]">
                       {selectedUser.name.charAt(0)}
                    </div>
                    <div className="space-y-2">
                       <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em]">Official Personnel File</span>
                       <h2 className="text-4xl font-black uppercase tracking-tight italic">{selectedUser.name}</h2>
                       <div className="flex items-center space-x-4">
                          <span className="text-[10px] font-black bg-white text-slate-900 px-2 py-1 uppercase tracking-widest">{selectedUser.role}</span>
                          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">ID: {selectedUser._id.toUpperCase()}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-10 grid grid-cols-2 gap-10">
                 <div className="space-y-8">
                    <section className="space-y-4">
                       <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b-2 border-slate-100 pb-2">Authentication Intel</h3>
                       <div className="space-y-4">
                          <div className="p-4 bg-slate-50 border-2 border-slate-100">
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Registered Work Email</p>
                             <p className="text-xs font-bold text-slate-900 uppercase">{selectedUser.email}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-slate-50 border-2 border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Email Verified</p>
                                <p className={`text-[10px] font-black uppercase ${selectedUser.isEmailVerified ? 'text-emerald-600' : 'text-orange-600'}`}>
                                   {selectedUser.isEmailVerified ? 'Confirmed' : 'Pending'}
                                </p>
                             </div>
                             <div className="p-4 bg-slate-50 border-2 border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">First Access</p>
                                <p className={`text-[10px] font-black uppercase ${!selectedUser.isFirstLogin ? 'text-emerald-600' : 'text-orange-600'}`}>
                                   {!selectedUser.isFirstLogin ? 'Completed' : 'Awaiting'}
                                </p>
                             </div>
                          </div>
                       </div>
                    </section>

                    <section className="space-y-4">
                       <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b-2 border-slate-100 pb-2">Authorization History</h3>
                       <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                          {selectedUser.authLogs?.length > 0 ? (
                            [...selectedUser.authLogs].reverse().map((log, i) => (
                              <div key={i} className="flex justify-between items-center text-[9px] font-bold border-b border-slate-50 pb-2 uppercase">
                                 <span className={log.event.includes('FAILED') ? 'text-red-500' : 'text-slate-600'}>{log.event}</span>
                                 <span className="text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-[9px] font-black text-slate-300 uppercase italic">No system logs available</p>
                          )}
                       </div>
                    </section>
                 </div>

                 <div className="space-y-8">
                    <section className="space-y-4">
                       <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b-2 border-slate-100 pb-2">System Metadata</h3>
                       <div className="space-y-4">
                          <div className="p-4 bg-slate-50 border-2 border-slate-100">
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Account Provisioned On</p>
                             <p className="text-xs font-bold text-slate-900 uppercase">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="p-4 bg-slate-50 border-2 border-slate-100">
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Last System Access</p>
                             <p className="text-xs font-bold text-slate-900 uppercase">
                                {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'NEVER'}
                             </p>
                          </div>
                          <div className="p-4 border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] bg-white">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Security Protocol</span>
                                <div className={`w-2 h-2 rounded-full ${selectedUser.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                             </div>
                             <p className={`text-sm font-black uppercase ${selectedUser.isActive ? 'text-emerald-600' : 'text-red-600'}`}>
                                {selectedUser.isActive ? 'Clearance Active' : 'Access Revoked'}
                             </p>
                          </div>
                       </div>
                    </section>
                 </div>
              </div>

              <div className="bg-slate-50 p-8 border-t-2 border-slate-900 flex justify-between items-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-xs">
                    Personnel files are strictly confidential and encrypted. Unauthorized distribution is a security violation.
                 </p>
                 <div className="flex space-x-4">
                    <button className="px-6 py-3 border-2 border-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                       Export Audit Report
                    </button>
                    <button 
                      onClick={() => toggleUserStatus(selectedUser)}
                      className={`px-6 py-3 border-2 border-slate-900 text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedUser.isActive ? 'bg-red-600 text-white hover:bg-red-700 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]'
                      }`}
                    >
                       {selectedUser.isActive ? 'Revoke All Access' : 'Authorize Account'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

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
