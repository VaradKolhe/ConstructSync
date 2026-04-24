import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Clock, 
  MapPin, 
  Users, 
  Loader2, 
  CheckCircle2, 
  Calendar,
  AlertCircle,
  HardHat,
  ChevronRight,
  ShieldCheck,
  Search,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const AttendanceTerminal = () => {
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [deployments, setDeployments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchSites = async () => {
    try {
      const response = await api.get('/deployments/sites');
      let siteList = response.data.data;
      
      // Filter if SUPERVISOR
      if (user?.role === 'SUPERVISOR') {
        siteList = siteList.filter(s => s.supervisorId === user.id);
      }
      
      setSites(siteList);
      if (siteList.length > 0) {
        setSelectedSiteId(siteList[0]._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      toast.error('Sector failure: Could not retrieve site sectors');
      setLoading(false);
    }
  };

  const fetchAttendanceAndDeployments = async () => {
    if (!selectedSiteId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [deployRes, attendanceRes, groupsRes] = await Promise.all([
        api.get(`/deployments/site/${selectedSiteId}`),
        api.get(`/attendances/site/${selectedSiteId}?date=${currentDate}`),
        api.get('/deployments/groups')
      ]);
      
      setDeployments(deployRes.data.data || []);
      setGroups(groupsRes.data.data || []);
      
      const records = {};
      (attendanceRes.data.data || []).forEach(record => {
        records[record.labourId] = record;
      });
      setAttendanceRecords(records);
    } catch (err) {
      console.error("Attendance Terminal Error:", err);
      toast.error('Synchronization failure: Terminal offline or data corrupted');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    fetchAttendanceAndDeployments();
  }, [selectedSiteId]);

  const handleCheckIn = async (labourId) => {
    try {
      await api.post('/attendances/check-in', {
        labourId,
        siteId: selectedSiteId,
        date: currentDate,
        status: 'PRESENT'
      });
      toast.success('PERSONNEL CLOCKED IN');
      fetchAttendanceAndDeployments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in Authorization Denied');
    }
  };

  const handleBulkCheckIn = async (group) => {
    const siteMemberIds = deployments.map(d => d.labourId?._id || d.labourId);
    const validMemberIds = group.members.filter(id => siteMemberIds.includes(id));
    
    if (validMemberIds.length === 0) {
      toast.error('No members of this group are currently deployed to this site');
      return;
    }

    try {
      await api.post('/attendances/bulk-check-in', {
        labourIds: validMemberIds,
        siteId: selectedSiteId,
        date: currentDate,
        status: 'PRESENT'
      });
      toast.success(`BULK PROTOCOL: ${group.name} CLOCKED IN`);
      fetchAttendanceAndDeployments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk Check-in Protocol Failed');
    }
  };

  const handleCheckOut = async (attendanceId) => {
    try {
      await api.put(`/attendances/check-out/${attendanceId}`);
      toast.success('PERSONNEL CLOCKED OUT');
      fetchAttendanceAndDeployments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out Protocol Failed');
    }
  };

  const handleBulkCheckOut = async (group) => {
    const siteMemberIds = deployments.map(d => d.labourId?._id || d.labourId);
    const attendanceIds = group.members
      .filter(id => siteMemberIds.includes(id))
      .map(id => attendanceRecords[id]?._id)
      .filter(id => id && !attendanceRecords[Object.keys(attendanceRecords).find(k => attendanceRecords[k]._id === id)]?.checkOutTime);

    if (attendanceIds.length === 0) {
      toast.error('No active attendance records found for this squad on this sector');
      return;
    }

    try {
      await api.put('/attendances/bulk-check-out', { attendanceIds });
      toast.success(`BULK PROTOCOL: ${group.name} CLOCKED OUT`);
      fetchAttendanceAndDeployments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk Check-out Protocol Failed');
    }
  };

  const filteredDeployments = deployments.filter(d => {
    const labour = d.labourId || {};
    const searchLower = search.toLowerCase();
    const name = typeof labour === 'object' ? (labour.name || '') : '';
    const lId = typeof labour === 'object' ? (labour.labourId || '') : (labour.toString() || '');
    
    return name.toLowerCase().includes(searchLower) ||
           lId.toString().toLowerCase().includes(searchLower);
  });

  const activeSite = sites.find(s => s._id === selectedSiteId);
  const isSiteLocked = activeSite?.isLocked;

  return (
    <div className="p-10 space-y-8 bg-slate-50 min-h-screen relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 opacity-[0.02] pointer-events-none rotate-12 translate-x-1/4 -translate-y-1/4">
        <HardHat size={600} />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
             <div className="w-3 h-3 bg-orange-600 rounded-full animate-pulse"></div>
             <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">
               Attendance Terminal
             </h1>
          </div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest flex items-center">
            <Clock className="h-4 w-4 mr-2 text-orange-600 animate-spin-slow" />
            Field Personnel Work Log — {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div className="flex flex-col space-y-2 min-w-[300px]">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex justify-between">
            <span>Active Sector Terminal</span>
            {isSiteLocked && <span className="text-red-600 font-black">SECURITY LOCKOUT</span>}
          </label>
          <div className="relative group">
            <select 
              className={`input-industrial h-14 pl-12 ${isSiteLocked ? 'border-red-600 bg-red-50 text-red-900 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]' : 'bg-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all'}`}
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
            >
              <option value="" hidden>SELECT SECTOR TERMINAL...</option>
              {sites.map(site => (
                <option key={site._id} value={site._id}>
                  {site.name} — {site.location} {site.isLocked ? '(LOCKED)' : ''}
                </option>
              ))}
            </select>
            <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${isSiteLocked ? 'text-red-600' : 'text-slate-400'}`} />
          </div>
        </div>
      </div>

      {isSiteLocked && (
        <div className="bg-red-600 text-white p-5 flex items-center justify-center space-x-4 animate-pulse shadow-[8px_8px_0px_0px_rgba(153,27,27,1)] relative z-10">
           <ShieldCheck className="h-6 w-6" />
           <span className="text-sm font-black uppercase tracking-[0.3em]">Security Protocol: Sector Terminal Locked by Master Admin — Operations Suspended</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-slate-900 p-6 text-white border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(234,88,12,1)]">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Assigned</p>
              <p className="text-4xl font-black italic">{deployments.length}</p>
           </div>
           <div className="bg-white border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_rgba(16,185,129,1)]">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-ping"></span>
                On-Site (Active)
              </p>
              <p className="text-4xl font-black text-slate-900 italic">{Object.values(attendanceRecords).filter(r => r.status === 'PRESENT' && !r.checkOutTime).length}</p>
           </div>
           <div className="bg-white border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_rgba(59,130,246,1)]">
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Completed Shift</p>
              <p className="text-4xl font-black text-slate-900 italic">{Object.values(attendanceRecords).filter(r => r.checkOutTime).length}</p>
           </div>
           <div className="bg-white border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_rgba(249,115,22,1)]">
              <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">Pending Check-in</p>
              <p className="text-4xl font-black text-slate-900 italic">{deployments.length - Object.keys(attendanceRecords).length}</p>
           </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-orange-600 transition-colors" />
              <input 
                type="text" 
                placeholder="SEARCH DEPLOYED PERSONNEL..."
                className="w-full pl-12 pr-4 py-5 border-2 border-slate-900 bg-white text-xs font-black uppercase tracking-widest focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(234,88,12,1)] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>

           <div className="bg-white border-2 border-slate-900 overflow-hidden shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]">
              <div className="bg-slate-900 px-6 py-3 flex justify-between items-center">
                 <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Live Sector Feed</span>
                 </div>
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                   {filteredDeployments.length} Personnel Found
                 </span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-900">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Personnel</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Logistics Command</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="3" className="py-24 text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Sector Data...</p>
                      </td>
                    </tr>
                  ) : filteredDeployments.length > 0 ? (
                    filteredDeployments.map((deployment) => {
                      const labour = deployment.labourId || {};
                      const lId = typeof labour === 'object' ? labour._id : labour;
                      const attendance = attendanceRecords[lId];
                      
                      return (
                        <tr key={deployment._id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-6">
                            <div className="flex items-center space-x-4">
                               <div className={`w-12 h-12 flex items-center justify-center border-2 transition-all group-hover:rotate-6 ${attendance ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                                  <HardHat size={24} />
                               </div>
                               <div>
                                 <p className="text-sm font-black text-slate-900 uppercase leading-none mb-1">
                                   {typeof labour === 'object' ? labour.name : `ID: ${labour}`}
                                 </p>
                                 <div className="flex items-center space-x-2">
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                     {typeof labour === 'object' ? labour.labourId : 'MISSING_DATA'}
                                   </p>
                                   <span className="text-[9px] text-slate-300">•</span>
                                   <p className="text-[9px] font-black text-orange-600 uppercase tracking-tighter">{deployment.role}</p>
                                 </div>
                               </div>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-center">
                            {!attendance ? (
                              <span className="text-[9px] font-black px-3 py-1.5 bg-slate-100 text-slate-400 uppercase border-2 border-slate-200 tracking-widest">Awaiting Log</span>
                            ) : attendance.checkOutTime ? (
                              <span className="text-[9px] font-black px-3 py-1.5 bg-blue-50 text-blue-600 uppercase border-2 border-blue-100 italic tracking-widest">Shift Complete</span>
                            ) : (
                              <div className="flex flex-col items-center">
                                <span className="text-[9px] font-black px-3 py-1.5 bg-emerald-50 text-emerald-600 uppercase border-2 border-emerald-100 animate-pulse tracking-widest">On-Duty Logged</span>
                                <span className="text-[9px] font-bold text-slate-400 mt-2 uppercase flex items-center">
                                  <Clock size={10} className="mr-1" />
                                  IN: {new Date(attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-6 text-right">
                             {!attendance ? (
                               <button 
                                onClick={() => handleCheckIn(lId)}
                                disabled={isSiteLocked}
                                className="px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-[4px_4px_0px_0px_rgba(234,88,12,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                               >
                                 Clock In
                               </button>
                             ) : !attendance.checkOutTime ? (
                               <button 
                                onClick={() => handleCheckOut(attendance._id)}
                                disabled={isSiteLocked}
                                className="px-8 py-4 bg-white border-2 border-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                               >
                                 Clock Out
                               </button>
                             ) : (
                               <div className="flex flex-col items-end opacity-40">
                                  <CheckCircle2 size={24} className="text-blue-600 mb-1" />
                                  <span className="text-[8px] font-black uppercase text-slate-400">Validated</span>
                               </div>
                             )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-32 text-center">
                        <div className="bg-slate-50 border-4 border-dashed border-slate-200 p-12 inline-block">
                           <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
                           <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">No Deployments Detected</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase max-w-xs mx-auto">
                             There are no active personnel deployments for this site sector. Check the <span className="text-orange-600 underline">Workforce Deployment</span> terminal to assign personnel.
                           </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-900 p-8 text-white shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] border-2 border-slate-900">
              <ShieldCheck className="h-10 w-10 text-orange-600 mb-4" />
              <h3 className="text-xl font-black uppercase italic mb-4">Terminal Integrity</h3>
              <p className="text-[10px] leading-relaxed text-slate-400 font-bold uppercase tracking-widest mb-6 border-b border-slate-800 pb-6">
                 Supervisors are authorized to log attendance for the current cycle only. Manual overrides or historical edits require Master Admin clearance.
              </p>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-[10px] font-black uppercase">
                    <span className="text-slate-500">Terminal Status</span>
                    <span className="text-emerald-500 flex items-center">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                      Live
                    </span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-black uppercase">
                    <span className="text-slate-500">Node Sync</span>
                    <span className="text-blue-500">Encrypted</span>
                 </div>
              </div>
           </div>

           <div className="p-6 bg-orange-50 border-2 border-orange-200 flex items-start space-x-4">
              <AlertCircle className="h-6 w-6 text-orange-600 shrink-0" />
              <div className="space-y-1">
                <h4 className="text-[11px] font-black text-orange-900 uppercase tracking-widest">System Warning</h4>
                <p className="text-[9px] font-bold text-orange-700 uppercase leading-relaxed">
                   Clock-out protocol calculates total active hours automatically. Ensure personnel are physically verified before command execution.
                </p>
              </div>
           </div>

           <div className="bg-white border-2 border-slate-900 overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
              <div className="bg-slate-900 p-4">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center">
                  <Users className="h-4 w-4 mr-2 text-orange-500" />
                  Site Squads (Bulk Actions)
                </h3>
              </div>
              <div className="divide-y-2 divide-slate-100">
                {groups.length > 0 ? (
                  groups.map((group) => {
                    const siteMemberIds = deployments.map(d => d.labourId?._id || d.labourId);
                    const membersOnSite = group.members.filter(id => siteMemberIds.includes(id));
                    
                    if (membersOnSite.length === 0) return null;

                    const checkedInCount = membersOnSite.filter(id => attendanceRecords[id] && !attendanceRecords[id].checkOutTime).length;
                    const checkedOutCount = membersOnSite.filter(id => attendanceRecords[id]?.checkOutTime).length;
                    const pendingCount = membersOnSite.length - (checkedInCount + checkedOutCount);

                    return (
                      <div key={group._id} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[11px] font-black text-slate-900 uppercase">{group.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                              {membersOnSite.length} Deployed
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => handleBulkCheckIn(group)}
                            disabled={pendingCount === 0 || isSiteLocked}
                            className="py-3 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest disabled:opacity-30 btn-industrial-shadow"
                          >
                            In ({pendingCount})
                          </button>
                          <button 
                            onClick={() => handleBulkCheckOut(group)}
                            disabled={checkedInCount === 0 || isSiteLocked}
                            className="py-3 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest disabled:opacity-30 btn-industrial-shadow"
                          >
                            Out ({checkedInCount})
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-10 text-center text-slate-400 uppercase text-[9px] font-black tracking-widest">
                    No squads detected
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTerminal;
