import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Shield, 
  Search, 
  Filter, 
  Calendar, 
  Activity, 
  Clock, 
  User, 
  Database,
  ArrowLeft,
  ArrowRight,
  Loader2,
  RefreshCcw,
  AlertTriangle,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    actionType: '',
    module: '',
    search: '',
    startDate: '',
    endDate: '',
    limit: 20
  });

  const navigate = useNavigate();

  const fetchLogs = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const { actionType, module, search, startDate, endDate, limit } = filters;
      let url = `/reporting/admin/audit-logs?page=${pageNumber}&limit=${limit}`;
      if (actionType) url += `&actionType=${actionType}`;
      if (module) url += `&module=${module}`;
      if (search) url += `&search=${search}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const response = await api.get(url);
      setLogs(response.data.data.logs);
      setPagination({
        page: response.data.data.page,
        pages: response.data.data.pages,
        total: response.data.data.total
      });
    } catch (err) {
      toast.error('Failed to synchronize security logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [filters.actionType, filters.module, filters.limit]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchLogs(newPage);
    }
  };

  const getActionColor = (action) => {
    if (action.includes('REGISTER') || action.includes('CREATED')) return 'text-blue-500';
    if (action.includes('DELETE') || action.includes('REVOKE') || action.includes('LOCKED')) return 'text-red-500';
    if (action.includes('SUCCESS') || action.includes('VERIFIED')) return 'text-emerald-500';
    if (action.includes('UPDATE')) return 'text-orange-500';
    return 'text-slate-500';
  };

  return (
    <div className="p-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">
            Security Surveillance
          </h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest flex items-center">
            <Shield className="h-4 w-4 mr-2 text-orange-600" />
            System-Wide Audit Intelligence Terminal
          </p>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={() => fetchLogs(pagination.page)}
            className="flex items-center space-x-2 px-4 py-3 border-2 border-slate-900 bg-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 btn-industrial-shadow"
          >
            <RefreshCcw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* Control Terminal */}
      <div className="bg-slate-900 p-8 border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(234,88,12,1)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <div className="space-y-2 lg:col-span-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Keyword Surveillance</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
              <input 
                type="text"
                placeholder="SEARCH ACTIONS, MODULES, PERSONNEL..."
                className="w-full bg-slate-800 border-2 border-slate-700 text-white pl-10 p-3 text-[10px] font-bold focus:border-orange-500 outline-none uppercase placeholder:text-slate-600"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Filter</label>
            <select 
              className="w-full bg-slate-800 border-2 border-slate-700 text-white p-3 text-[10px] font-bold focus:border-orange-500 outline-none uppercase"
              value={filters.actionType}
              onChange={(e) => setFilters({...filters, actionType: e.target.value})}
            >
              <option value="">All Operations</option>
              <option value="LOGIN_SUCCESS">Login Success</option>
              <option value="LOGIN_FAILED">Login Failures</option>
              <option value="USER_REGISTERED">User Provisioning</option>
              <option value="USER_UPDATED">Record Modifications</option>
              <option value="ACCOUNT_LOCKED">Security Lockouts</option>
              <option value="ATTENDANCE_CHECK_IN">Personnel In</option>
              <option value="ATTENDANCE_CHECK_OUT">Personnel Out</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Module Sector</label>
            <select 
              className="w-full bg-slate-800 border-2 border-slate-700 text-white p-3 text-[10px] font-bold focus:border-orange-500 outline-none uppercase"
              value={filters.module}
              onChange={(e) => setFilters({...filters, module: e.target.value})}
            >
              <option value="">All Sectors</option>
              <option value="AUTH">Authentication</option>
              <option value="LABOUR">Labour Registry</option>
              <option value="DEPLOYMENT">Deployment</option>
              <option value="ATTENDANCE">Attendance</option>
              <option value="REPORTING">Reporting</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Start Boundary</label>
            <input 
              type="date"
              className="w-full bg-slate-800 border-2 border-slate-700 text-white p-3 text-[10px] font-bold focus:border-orange-500 outline-none"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End Boundary</label>
            <input 
              type="date"
              className="w-full bg-slate-800 border-2 border-slate-700 text-white p-3 text-[10px] font-bold focus:border-orange-500 outline-none"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            />
          </div>

          <div className="flex items-end">
            <button 
              onClick={() => fetchLogs(1)}
              className="w-full bg-orange-600 text-white p-3.5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-orange-600 transition-all border-2 border-orange-600"
            >
              Execute Query
            </button>
          </div>
        </div>
      </div>

      {/* Log Terminal */}
      <div className="bg-white border-2 border-slate-900 overflow-hidden shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
             <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Live System Log Feed</span>
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Total records synchronized: {pagination.total}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-100">
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Security Event</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Module</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Source IP</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Operational Intel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-32 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-orange-600 mx-auto mb-4" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Decrypting Data Stream...</p>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap">
                       <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900">{new Date(log.timestamp).toLocaleDateString()}</span>
                          <span className="text-[10px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <span className={`text-xs font-black uppercase tracking-tight ${getActionColor(log.action)}`}>
                         {log.action}
                       </span>
                    </td>
                    <td className="px-6 py-5">
                       <span className="text-[10px] font-black px-2 py-1 bg-slate-100 text-slate-600 border-2 border-slate-200">
                         {log.module}
                       </span>
                    </td>
                    <td className="px-6 py-5">
                       <span className="text-xs font-black text-slate-700">
                         {log.ipAddress || 'INTERNAL'}
                       </span>
                    </td>
                    <td className="px-6 py-5">
                       <div className="max-w-md truncate text-xs font-bold text-slate-600 bg-slate-50 p-2 border border-slate-100">
                          {JSON.stringify(log.details)}
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-32 text-center text-slate-300 uppercase text-xs font-black tracking-widest">
                    No security events recorded in this sector
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 border-t-2 border-slate-900 flex items-center justify-between">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
             Phase {pagination.page} of {pagination.pages}
           </p>
           <div className="flex space-x-2">
             <button 
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 border-2 border-slate-900 bg-white disabled:opacity-30 hover:bg-slate-900 hover:text-white transition-colors"
             >
               <ArrowLeft size={14} strokeWidth={3} />
             </button>
             <button 
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="p-2 border-2 border-slate-900 bg-white disabled:opacity-30 hover:bg-slate-900 hover:text-white transition-colors"
             >
               <ArrowRight size={14} strokeWidth={3} />
             </button>
           </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-orange-50 border-2 border-orange-200 p-6 flex items-start space-x-4">
        <div className="bg-orange-600 p-2 text-white shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h4 className="text-[11px] font-black text-orange-900 uppercase tracking-widest mb-1">Security Compliance: Data Integrity</h4>
          <p className="text-[10px] font-bold text-orange-700 uppercase leading-relaxed max-w-3xl">
            This audit terminal provides a tamper-proof record of all personnel actions. Every event is cryptographically linked to a session ID and source IP. Modification of these logs is strictly prohibited under the master security protocol.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
