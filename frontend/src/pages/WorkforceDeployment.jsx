import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { 
  Users, 
  MapPin, 
  Search, 
  Filter, 
  HardHat, 
  Plus, 
  ArrowRightLeft, 
  Calendar,
  Loader2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronRight,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import IndustrialSelect from '../components/common/IndustrialSelect';

const WorkforceDeployment = () => {
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSiteId = queryParams.get('siteId') || '';

  const [labours, setLabours] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState(initialSiteId);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRedeploying, setIsRedeploying] = useState(false);
  const [isCreatingGroup, setIsRedeployingGroup] = useState(false); // Reuse for group modal
  const [assigningLabour, setAssigningLabour] = useState(null);
  
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  const [deploymentData, setDeploymentData] = useState({
    siteId: '',
    startDate: new Date().toISOString().split('T')[0],
    contractEndDate: '',
    role: 'GENERAL_WORKER',
    reason: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch sites first
      const sitesRes = await api.get('/deployments/sites');
      let siteList = sitesRes.data.data;
      setSites(siteList);
      
      let labourUrl = `/labours?search=${search}`;
      
      // Supervisor Constraint: Only see their sites' personnel
      if (user?.role === 'SUPERVISOR') {
        const mySites = siteList.filter(s => s.supervisorId === user.id);
        const mySiteIds = mySites.map(s => s._id);
        
        if (mySiteIds.length > 0) {
          // If no specific site selected, show all their sites' personnel
          if (!selectedSiteId || !mySiteIds.includes(selectedSiteId)) {
             labourUrl += `&siteIds=${mySiteIds.join(',')}`;
          } else {
             labourUrl += `&siteId=${selectedSiteId}`;
          }
        } else {
          setLabours([]);
          setLoading(false);
          return;
        }
      } else if (selectedSiteId) {
        // Admin/HR filter by selected site
        labourUrl += `&siteId=${selectedSiteId}`;
      }

      const labourRes = await api.get(labourUrl);
      setLabours(labourRes.data.data.labours);
    } catch (err) {
      toast.error('Logistics error: Could not synchronize personnel or site data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleOpenAssign = (labour, redeploy = false) => {
    setAssigningLabour(labour);
    if (redeploy) {
      setIsRedeploying(true);
      setDeploymentData({ ...deploymentData, siteId: '' });
    } else {
      setIsAssigning(true);
    }
  };

  const handleDeploymentSubmit = async (e) => {
    e.preventDefault();
    if (!deploymentData.siteId) {
      toast.error('Target site sector required');
      return;
    }
    
    setLoading(true);
    try {
      const endpoint = isRedeploying ? '/deployments/redeploy' : '/deployments/assign';
      await api.post(endpoint, {
        labourId: assigningLabour._id,
        newSiteId: deploymentData.siteId, // For redeploy
        ...deploymentData
      });
      toast.success(isRedeploying ? 'Redeployment Successful' : 'Deployment Authorized');
      setIsAssigning(false);
      setIsRedeploying(false);
      setAssigningLabour(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authorization failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (selectedMembers.length === 0) return toast.error('Select at least one member');
    
    try {
      await api.post('/deployments/groups', {
        name: groupName,
        members: selectedMembers
      });
      toast.success(`Labour Group '${groupName}' Formed`);
      setGroupName('');
      setSelectedMembers([]);
      setIsRedeployingGroup(false);
    } catch (err) {
      toast.error('Failed to form group');
    }
  };

  const toggleMember = (id) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">
            Workforce Deployment
          </h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest flex items-center">
            <ArrowRightLeft className="h-4 w-4 mr-2 text-orange-600" />
            {user?.role === 'SUPERVISOR' ? 'Site Resource Management' : 'Tactical Resource Allocation Terminal'}
          </p>
        </div>
        {user?.role === 'SUPERVISOR' && (
          <button 
            onClick={() => setIsRedeployingGroup(true)}
            className="flex items-center justify-center space-x-3 px-6 py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] btn-industrial-shadow"
          >
            <Users size={18} strokeWidth={3} />
            <span>Form Labour Group</span>
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Search & Labour List */}
        <div className="lg:w-2/3 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input 
              type="text" 
              placeholder={user?.role === 'SUPERVISOR' ? "SEARCH PERSONNEL ON YOUR SITE..." : "SEARCH PERSONNEL FOR DEPLOYMENT..."}
              className="w-full pl-12 pr-4 py-4 border-2 border-slate-900 bg-white text-xs font-black uppercase tracking-widest focus:outline-none focus:bg-slate-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="bg-white border-2 border-slate-900 overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
            <div className="bg-slate-900 p-4">
               <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                 {user?.role === 'SUPERVISOR' ? 'Deployed Personnel Matrix' : 'Personnel Availability Matrix'}
               </h3>
            </div>
            <div className="divide-y-2 divide-slate-100">
              {loading && labours.length === 0 ? (
                <div className="p-20 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto" />
                </div>
              ) : labours.length > 0 ? (
                labours.map((labour) => (
                  <div key={labour._id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center space-x-6">
                       <div className={`w-12 h-12 flex items-center justify-center border-2 ${labour.status === 'AVAILABLE' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                          <Users size={24} />
                       </div>
                       <div>
                         <h4 className="text-sm font-black text-slate-900 uppercase">{labour.name}</h4>
                         <div className="flex items-center space-x-3 mt-1">
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{labour.labourId}</span>
                           <span className={`text-[8px] font-black px-1.5 py-0.5 uppercase ${labour.status === 'AVAILABLE' ? 'bg-emerald-500 text-white' : 'bg-orange-100 text-orange-600'}`}>
                             {labour.status}
                           </span>
                         </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {user?.role === 'SUPERVISOR' ? (
                        <span className="text-[10px] font-black text-slate-400 uppercase italic">On-Site Managed</span>
                      ) : (
                        <>
                          {labour.status === 'AVAILABLE' ? (
                            <button 
                              onClick={() => handleOpenAssign(labour)}
                              className="flex items-center space-x-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-orange-600 btn-industrial-shadow transition-all"
                            >
                              <span>Deploy</span>
                              <ChevronRight size={14} strokeWidth={3} />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleOpenAssign(labour, true)}
                              className="flex items-center space-x-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                            >
                              <span>Redeploy</span>
                              <ArrowRightLeft size={14} strokeWidth={3} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center text-slate-400 uppercase text-[10px] font-black tracking-widest">
                  No personnel detected in this sector
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Information */}
        <div className="lg:w-1/3 space-y-8">
           <div className="bg-slate-900 p-8 text-white shadow-[8px_8px_0px_0px_rgba(234,88,12,1)]">
              <h3 className="text-xl font-black uppercase italic mb-4">Strategic Overview</h3>
              <div className="space-y-6 pt-4 border-t border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Site Personnel</span>
                  <span className="text-2xl font-black text-white">{labours.length}</span>
                </div>
                {user?.role !== 'SUPERVISOR' && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Deployment</span>
                    <span className="text-2xl font-black text-orange-500">
                      {labours.filter(l => l.status === 'AVAILABLE').length}
                    </span>
                  </div>
                )}
              </div>
           </div>

           <div className="bg-orange-50 border-2 border-orange-200 p-6">
              <div className="flex items-center space-x-3 mb-3">
                <ShieldAlert className="text-orange-600 h-5 w-5" />
                <h4 className="text-[11px] font-black text-orange-900 uppercase tracking-widest">Deployment Policy</h4>
              </div>
              <p className="text-[9px] font-bold text-orange-700 uppercase leading-relaxed">
                {user?.role === 'SUPERVISOR' 
                  ? 'As a site supervisor, you are responsible for tactical grouping of personnel. Cross-site transfers remain restricted to HR clearance.'
                  : 'Personnel cannot be deployed to multiple sites simultaneously. Redeployment automatically concludes the previous site assignment.'}
              </p>
           </div>
        </div>
      </div>

      {/* Assignment/Redeployment Modal */}
      {(isAssigning || isRedeploying) && assigningLabour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white border-4 border-slate-900 max-w-lg w-full shadow-[16px_16px_0px_0px_rgba(234,88,12,1)] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 p-8 text-white relative">
              <button onClick={() => {setIsAssigning(false); setIsRedeploying(false);}} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-orange-500 transition-colors">
                <X size={24} />
              </button>
              <h2 className="text-3xl font-black uppercase tracking-tight italic">
                {isRedeploying ? 'Authorize Redeployment' : 'Authorize Deployment'}
              </h2>
              <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Target: {assigningLabour.name}</p>
            </div>
            
            <form onSubmit={handleDeploymentSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Construction Site</label>
                <IndustrialSelect 
                  required
                  placeholder="SELECT DESTINATION SITE..."
                  options={sites.filter(s => s.status === 'ACTIVE' || s.status === 'PLANNED').map(site => ({
                    value: site._id,
                    label: `${site.name} — ${site.location}`
                  }))}
                  value={deploymentData.siteId}
                  onChange={(val) => setDeploymentData({...deploymentData, siteId: val})}
                />
              </div>

              {isRedeploying && (
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Redeployment Reason</label>
                  <input 
                    type="text" 
                    required 
                    className="input-industrial h-12" 
                    placeholder="E.G. PROJECT PHASE COMPLETION"
                    value={deploymentData.reason}
                    onChange={(e) => setDeploymentData({...deploymentData, reason: e.target.value.toUpperCase()})}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Assignment Role</label>
                  <IndustrialSelect 
                    placeholder="SELECT ROLE..."
                    options={[
                      { value: 'GENERAL_WORKER', label: 'GENERAL WORKER' },
                      { value: 'SPECIALIST', label: 'SPECIALIST' },
                      { value: 'FOREMAN', label: 'FOREMAN' },
                      { value: 'ASSISTANT', label: 'ASSISTANT' }
                    ]}
                    value={deploymentData.role}
                    onChange={(val) => setDeploymentData({...deploymentData, role: val})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Kickoff Date</label>
                  <input 
                    type="date" 
                    required 
                    className="input-industrial" 
                    value={deploymentData.startDate}
                    onChange={(e) => setDeploymentData({...deploymentData, startDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-6 border-t-2 border-slate-50 flex gap-4">
                 <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-grow py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] btn-industrial-shadow hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
                 >
                   {loading ? <Loader2 className="animate-spin" /> : (
                     <>
                        <CheckCircle2 size={16} />
                        <span>Authorize assignment</span>
                     </>
                   )}
                 </button>
                 <button 
                  type="button" 
                  onClick={() => {setIsAssigning(false); setIsRedeploying(false);}}
                  className="px-8 py-4 border-2 border-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                 >
                   Abort
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Formation Modal (Supervisor Only) */}
      {isCreatingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white border-4 border-slate-900 max-w-2xl w-full shadow-[16px_16px_0px_0px_rgba(234,88,12,1)] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 p-8 text-white relative">
              <button onClick={() => setIsRedeployingGroup(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-orange-500 transition-colors">
                <X size={24} />
              </button>
              <h2 className="text-3xl font-black uppercase tracking-tight italic">Form Labour Group</h2>
              <p className="text-orange-50 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Tactical Squad Assembly</p>
            </div>
            
            <form onSubmit={handleCreateGroup} className="p-8 space-y-6">
               <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Squad Designation</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="E.G. FOUNDATION CREW B"
                    className="input-industrial h-12" 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value.toUpperCase())}
                  />
               </div>

               <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Select Personnel ({selectedMembers.length})</label>
                  <div className="max-h-60 overflow-y-auto border-2 border-slate-100 divide-y divide-slate-50">
                    {labours.map(l => (
                      <div 
                        key={l._id} 
                        onClick={() => toggleMember(l._id)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${selectedMembers.includes(l._id) ? 'bg-orange-50' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${selectedMembers.includes(l._id) ? 'bg-orange-600' : 'bg-slate-200'}`}></div>
                          <span className="text-[10px] font-black uppercase text-slate-900">{l.name}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{l.skills[0]}</span>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="pt-6 border-t-2 border-slate-50 flex gap-4">
                 <button 
                  type="submit" 
                  className="flex-grow py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] btn-industrial-shadow hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
                 >
                   <CheckCircle2 size={16} />
                   <span>Register Squad</span>
                 </button>
                 <button 
                  type="button" 
                  onClick={() => setIsRedeployingGroup(false)}
                  className="px-8 py-4 border-2 border-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                 >
                   Abort
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkforceDeployment;