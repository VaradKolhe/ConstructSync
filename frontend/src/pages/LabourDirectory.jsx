import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Loader2, 
  Phone, 
  MapPin, 
  BadgeCheck,
  X,
  Calendar,
  Contact,
  Wrench,
  CreditCard,
  ChevronRight,
  HardHat,
  Activity,
  RefreshCcw,
  Eye,
  EyeOff,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import IndustrialSelect from '../components/common/IndustrialSelect';

const LabourDirectory = () => {
  const [labours, setLabours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLabour, setSelectedLabour] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showFullAadhaar, setShowFullAadhaar] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [skills, setSkills] = useState([]);
  const [editData, setEditData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [activeDeployment, setActiveDeployment] = useState(null);
  const [isFetchingDeployment, setIsFetchingDeployment] = useState(false);
  const navigate = useNavigate();

  const fetchDeployment = async (labourId) => {
    setIsFetchingDeployment(true);
    try {
      const response = await api.get(`/deployments/labour/${labourId}`);
      setActiveDeployment(response.data.data);
    } catch (err) {
      console.error('Failed to fetch deployment details');
      setActiveDeployment(null);
    } finally {
      setIsFetchingDeployment(false);
    }
  };

  useEffect(() => {
    if (selectedLabour && selectedLabour.status === 'ASSIGNED') {
      fetchDeployment(selectedLabour._id);
    } else {
      setActiveDeployment(null);
    }
  }, [selectedLabour]);

  const fetchLabours = async () => {
    setLoading(true);
    try {
      let url = `/labours?search=${search}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (skillFilter) url += `&skill=${skillFilter}`;
      
      const response = await api.get(url);
      setLabours(response.data.data.labours);
      if (selectedLabour) {
        const updated = response.data.data.labours.find(l => l._id === selectedLabour._id);
        if (updated) setSelectedLabour(updated);
      }
    } catch (err) {
      toast.error('Failed to retrieve personnel records');
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await api.get('/labours/reference-data?type=SKILL_TYPE');
      setSkills(response.data.data);
    } catch (err) {
      console.error('Failed to fetch skills');
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLabours();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, skillFilter]);

  const openProfile = (labour) => {
    setSelectedLabour(labour);
    setEditData({ ...labour });
    setShowProfile(true);
    setIsEditing(false);
    setShowHistory(false);
    setShowFullAadhaar(false);
  };

  useEffect(() => {
    if (isEditing && selectedLabour) {
      setEditData(JSON.parse(JSON.stringify(selectedLabour)));
    }
  }, [isEditing, selectedLabour]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editData.skills || editData.skills.length === 0) {
      toast.error('Skill Matrix Error: At least one specialization required');
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/labours/${selectedLabour._id}`, editData);
      toast.success('Personnel Record Updated & Audited');
      setIsEditing(false);
      fetchLabours();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update Protocol Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEditSkill = (skillName) => {
    const currentSkills = [...(editData.skills || [])];
    if (currentSkills.includes(skillName)) {
      setEditData({ ...editData, skills: currentSkills.filter(s => s !== skillName) });
    } else {
      setEditData({ ...editData, skills: [...currentSkills, skillName] });
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('WARNING: Are you sure you want to revoke access and deactivate this personnel record?')) return;
    try {
      await api.delete(`/labours/${selectedLabour._id}`);
      toast.success('Personnel Access Revoked');
      setShowProfile(false);
      fetchLabours();
    } catch (err) {
      toast.error('Deactivation Protocol Failed');
    }
  };

  const handleReactivate = async () => {
    try {
      await api.put(`/labours/${selectedLabour._id}`, { isActive: true });
      toast.success('Personnel Record Restored');
      fetchLabours();
      setShowProfile(false);
    } catch (err) {
      toast.error('Restoration Protocol Failed');
    }
  };

  return (
    <div className="p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">
            Workforce Inventory
          </h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest flex items-center">
            <Users className="h-4 w-4 mr-2 text-orange-600" />
            Centralized Personnel Database
          </p>
        </div>
        <button 
          onClick={() => navigate('/labour/register')}
          className="flex items-center justify-center space-x-3 px-6 py-4 bg-orange-600 text-white text-xs font-black uppercase tracking-[0.2em] btn-industrial-shadow transition-transform hover:-translate-y-1 active:translate-y-0"
        >
          <Plus size={18} strokeWidth={3} />
          <span>New Registration</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input 
            type="text" 
            placeholder="SEARCH BY NAME, ID, PHONE, OR AADHAAR..."
            className="w-full pl-12 pr-4 py-4 border-2 border-slate-900 bg-white text-xs font-black uppercase tracking-widest focus:outline-none focus:bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4 min-w-[500px]">
          <IndustrialSelect 
            className="w-48"
            placeholder="ALL STATUSES"
            options={[
              { value: 'AVAILABLE', label: 'AVAILABLE' },
              { value: 'ON-SITE', label: 'ON-SITE' },
              { value: 'ON-LEAVE', label: 'ON-LEAVE' }
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
          />

          <IndustrialSelect 
            className="flex-grow"
            placeholder="ALL SKILLS"
            options={skills.map(s => ({ value: s.name, label: s.name.toUpperCase() }))}
            value={skillFilter}
            onChange={(val) => setSkillFilter(val)}
          />

          <button 
            onClick={() => { setSearch(''); setStatusFilter(''); setSkillFilter(''); }}
            className="flex items-center justify-center space-x-2 px-6 h-12 border-2 border-slate-900 bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
          >
            <RefreshCcw size={16} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="bg-white border-2 border-slate-900 overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white border-b-2 border-slate-900">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Labour ID</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Full Name</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Specialization</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-right">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-20 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-orange-600 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Querying database...</p>
                </td>
              </tr>
            ) : labours.length > 0 ? (
              labours.map((labour) => (
                <tr 
                  key={labour._id} 
                  className={`hover:bg-slate-50 transition-colors cursor-pointer group ${!labour.isActive ? 'bg-slate-50 opacity-70' : ''}`}
                  onClick={() => openProfile(labour)}
                >
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 font-mono tracking-tighter">
                        {labour.labourId}
                      </span>
                      {!labour.isActive && (
                        <span className="text-[8px] font-black text-red-600 uppercase tracking-widest mt-1">DEREGISTERED</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-black text-slate-900 uppercase">
                    {labour.name}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1.5">
                      {labour.skills.slice(0, 2).map((skill, idx) => (
                        <span key={idx} className="text-[10px] font-black px-2 py-1 bg-slate-100 text-slate-600 uppercase border-2 border-slate-200">
                          {skill}
                        </span>
                      ))}
                      {labour.skills.length > 2 && (
                        <span className="text-[10px] font-black px-2 py-1 bg-slate-900 text-white uppercase">
                          +{labour.skills.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[10px] font-black px-3 py-1.5 uppercase flex items-center w-fit border-2 ${
                      !labour.isActive 
                        ? 'text-slate-400 bg-slate-100 border-slate-200'
                        : labour.status === 'AVAILABLE' 
                          ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                          : 'text-orange-600 bg-orange-50 border-orange-100'
                    }`}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        !labour.isActive
                          ? 'bg-slate-300'
                          : labour.status === 'AVAILABLE' ? 'bg-emerald-600 animate-pulse' : 'bg-orange-600'
                      }`}></span>
                      {labour.isActive ? labour.status : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2.5 bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all border-2 border-transparent group-hover:border-slate-900 shadow-sm">
                      <ChevronRight size={18} strokeWidth={3} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-20 text-center text-slate-400 uppercase text-[10px] font-black tracking-widest">
                  No records matching the current parameters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Profile Modal Card */}
      {showProfile && selectedLabour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white border-4 border-slate-900 max-w-2xl w-full shadow-[16px_16px_0px_0px_rgba(234,88,12,1)] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className={`p-8 text-white relative shrink-0 ${!selectedLabour.isActive ? 'bg-slate-700' : 'bg-slate-900'}`}>
              <button 
                onClick={() => setShowProfile(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-orange-500 transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-white p-1 border-2 border-orange-600 shrink-0">
                   <div className="w-full h-full bg-slate-100 flex items-center justify-center overflow-hidden grayscale">
                      {selectedLabour.profilePhoto ? (
                        <img src={selectedLabour.profilePhoto} alt={selectedLabour.name} className="w-full h-full object-cover" />
                      ) : (
                        <HardHat size={40} className="text-slate-300" />
                      )}
                   </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">
                    {!selectedLabour.isActive ? 'Deregistered Profile' : showHistory ? 'Audit Log Viewer' : isEditing ? 'Modification Terminal' : 'Official Profile Card'}
                  </span>
                  <h2 className="text-3xl font-black uppercase tracking-tight leading-none">{selectedLabour.name}</h2>
                  <p className="text-lg font-mono text-slate-400 font-bold tracking-tighter">{selectedLabour.labourId}</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              {selectedLabour.isActive && (
                <div className="flex mt-8 space-x-6 border-b border-slate-800">
                  <button 
                    onClick={() => { setIsEditing(false); setShowHistory(false); }}
                    className={`text-[10px] font-black uppercase tracking-widest pb-2 transition-all ${!isEditing && !showHistory ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Overview
                  </button>
                  <button 
                    onClick={() => { setIsEditing(true); setShowHistory(false); }}
                    className={`text-[10px] font-black uppercase tracking-widest pb-2 transition-all ${isEditing ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Modify Details
                  </button>
                  <button 
                    onClick={() => { setIsEditing(false); setShowHistory(true); }}
                    className={`text-[10px] font-black uppercase tracking-widest pb-2 transition-all ${showHistory ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Edit History
                  </button>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto bg-white grow">
              {showHistory ? (
                <div className="space-y-6">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-2" /> Change Log & Audit Trail
                  </h3>
                  <div className="space-y-4">
                    {selectedLabour.editHistory?.length > 0 ? (
                      [...selectedLabour.editHistory].reverse().map((log, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 border-2 border-slate-100 relative">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black text-slate-900 uppercase">Editor: {log.editorName}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                            Updated: {Object.keys(log.changes || {}).join(', ') || 'N/A'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        No modification history recorded
                      </div>
                    )}
                  </div>
                </div>
              ) : isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-8 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                      <input 
                        type="text" 
                        className="input-industrial h-10 py-0" 
                        value={editData.name} 
                        onChange={e => setEditData({...editData, name: e.target.value.toUpperCase()})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Phone Terminal</label>
                      <input 
                        type="text" 
                        className="input-industrial h-10 py-0" 
                        value={editData.phone} 
                        onChange={e => setEditData({...editData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-4 md:col-span-2">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1">Verified Skill Matrix</label>
                      <div className="flex flex-wrap gap-2">
                        {skills.map(s => {
                          const isSelected = (editData.skills || []).includes(s.name);
                          return (
                            <button
                              key={s._id}
                              type="button"
                              onClick={() => toggleEditSkill(s.name)}
                              className={`px-3 py-2 border-2 transition-all text-[9px] font-black uppercase tracking-widest ${
                                isSelected 
                                  ? 'bg-slate-900 border-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(234,88,12,1)]' 
                                  : 'bg-white border-slate-200 text-slate-400 hover:border-slate-900 hover:text-slate-900'
                              }`}
                            >
                              {s.name}
                            </button>
                          );
                        })}
                      </div>
                      {(editData.skills || []).length === 0 && (
                        <p className="text-[8px] font-black text-red-500 uppercase italic">Verification Error: Personnel must possess at least one skill.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Account Number</label>
                      <input 
                        type="text" 
                        className="input-industrial h-10 py-0" 
                        value={editData.bankDetails?.accountNumber} 
                        onChange={e => setEditData({...editData, bankDetails: {...editData.bankDetails, accountNumber: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">IFSC Code</label>
                      <input 
                        type="text" 
                        className="input-industrial h-10 py-0" 
                        value={editData.bankDetails?.ifscCode} 
                        onChange={e => setEditData({...editData, bankDetails: {...editData.bankDetails, ifscCode: e.target.value.toUpperCase()}})}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4 border-t-2 border-slate-50">
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="flex-grow flex items-center justify-center space-x-2 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest btn-industrial-shadow hover:bg-orange-600 transition-colors"
                    >
                      {submitting ? <Loader2 className="animate-spin" /> : (
                        <>
                          <BadgeCheck size={16} />
                          <span>Commit Changes to Audit</span>
                        </>
                      )}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-4 border-2 border-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"
                    >
                      Abort
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in duration-300">
                  <div className="space-y-6">
                    <section className="space-y-4">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 flex items-center">
                        <Contact className="h-4 w-4 mr-2" /> Contact Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Primary Phone</span>
                          <span className="text-xs font-bold text-slate-900">{selectedLabour.phone}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Emergency Contact</span>
                          <span className="text-xs font-bold text-slate-900">{selectedLabour.emergencyContact}</span>
                        </div>
                        <div className="pt-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Registered Address</p>
                          <p className="text-xs font-bold text-slate-900 leading-relaxed uppercase">{selectedLabour.address}</p>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 flex items-center">
                        <Wrench className="h-4 w-4 mr-2" /> Skill Specializations
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedLabour.skills.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6">
                    <section className="space-y-4">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" /> Identification & Finance
                      </h3>
                      <div className="bg-slate-50 border-2 border-slate-100 p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Aadhaar/ID</span>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-black text-slate-900 tracking-widest">
                              {showFullAadhaar 
                                ? selectedLabour.aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3') 
                                : `**** **** ${selectedLabour.aadhaarNumber.slice(-4)}`}
                            </span>
                            <button 
                              onClick={() => setShowFullAadhaar(!showFullAadhaar)}
                              className="p-1 text-slate-400 hover:text-orange-600 transition-colors"
                              title={showFullAadhaar ? "Hide Sensitive Data" : "Reveal Full ID"}
                            >
                              {showFullAadhaar ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Bank Account Terminal</p>
                          <p className="text-xs font-bold text-slate-900 uppercase">
                            {selectedLabour.bankDetails?.bankName} <br/>
                            A/C: {selectedLabour.bankDetails?.accountNumber}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 flex items-center">
                        <Activity className="h-4 w-4 mr-2" /> Deployment Lifecycle
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="p-4 border-2 border-slate-900 flex justify-between items-center">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Current Status</p>
                            <p className={`text-xs font-black uppercase ${!selectedLabour.isActive ? 'text-slate-400' : selectedLabour.status === 'AVAILABLE' ? 'text-emerald-600' : 'text-orange-600'}`}>
                              {selectedLabour.isActive ? selectedLabour.status : 'DEREGISTERED'}
                            </p>
                          </div>
                          <button 
                            onClick={() => { setShowHistory(true); setIsEditing(false); }}
                            className="px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest btn-industrial-shadow"
                          >
                            View History
                          </button>
                        </div>

                        {isFetchingDeployment ? (
                          <div className="p-4 bg-slate-50 border-2 border-slate-100 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400 mr-2" />
                            <span className="text-[9px] font-black text-slate-400 uppercase">Retrieving deployment data...</span>
                          </div>
                        ) : activeDeployment ? (
                          <div className="p-4 bg-orange-50 border-2 border-orange-200 space-y-3 relative overflow-hidden">
                            <div className="absolute -right-2 -top-2 opacity-10">
                              <HardHat size={60} className="text-orange-600" />
                            </div>
                            <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Active Deployment Details</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Deployed Site</p>
                                <p className="text-xs font-black text-slate-900 uppercase">{activeDeployment.siteName || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Operational Role</p>
                                <p className="text-xs font-black text-slate-900 uppercase">{activeDeployment.role || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Commencement</p>
                                <p className="text-xs font-black text-slate-900 uppercase">{new Date(activeDeployment.startDate).toLocaleDateString()}</p>
                              </div>
                              {activeDeployment.groupName && (
                                <div>
                                  <p className="text-[8px] font-black text-slate-400 uppercase">Assigned Group</p>
                                  <p className="text-xs font-black text-orange-700 uppercase">{activeDeployment.groupName}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : selectedLabour.status === 'ASSIGNED' && (
                          <div className="p-4 bg-slate-50 border-2 border-slate-100 italic text-[10px] text-slate-400 font-bold uppercase">
                            Operational data retrieval pending or unavailable
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 p-6 border-t-2 border-slate-900 flex justify-between items-center shrink-0">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Personnel Record Sealed & Audited • CID: {selectedLabour._id.slice(-8).toUpperCase()}
               </p>
               {selectedLabour.isActive ? (
                 <button 
                  onClick={handleDeactivate}
                  className="text-[10px] font-black text-red-600 uppercase tracking-widest border-b-2 border-red-600 hover:text-slate-900 hover:border-slate-900 transition-all"
                 >
                    Revoke Personnel Access
                 </button>
               ) : (
                 <button 
                  onClick={handleReactivate}
                  className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b-2 border-emerald-600 hover:text-slate-900 hover:border-slate-900 transition-all"
                 >
                    Restore Personnel Access
                 </button>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabourDirectory;