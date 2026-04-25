import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar, 
  MapPin, 
  Users, 
  Loader2, 
  TrendingUp, 
  AlertCircle,
  RefreshCcw,
  Search,
  Wrench,
  ChevronDown,
  LayoutGrid
} from 'lucide-react';
import toast from 'react-hot-toast';
import IndustrialSelect from '../components/common/IndustrialSelect';

const Reporting = () => {
  const [sites, setSites] = useState([]);
  const [skills, setSkills] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  const [reportType, setReportType] = useState('attendance'); // 'attendance' or 'payroll'
  
  const [filters, setFilters] = useState({
    siteId: '',
    skillType: '',
    labourSearch: '',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sitesRes, skillsRes] = await Promise.all([
        api.get('/deployments/sites'),
        api.get('/labours/reference-data?type=SKILL_TYPE')
      ]);
      setSites(sitesRes.data.data);
      setSkills(skillsRes.data.data);
    } catch (err) {
      toast.error('Initialization failure: Could not sync site or skill parameters');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const { siteId, skillType, labourSearch, startDate, endDate } = filters;
      let endpoint = reportType === 'attendance' ? '/reporting/attendance' : '/reporting/payroll';
      let url = `${endpoint}?startDate=${startDate}&endDate=${endDate}`;
      if (siteId) url += `&siteId=${siteId}`;
      if (skillType) url += `&skillType=${skillType}`;
      if (labourSearch) url += `&search=${labourSearch}`;

      const response = await api.get(url);
      setReportData(response.data.data);
      toast.success(`${reportType.toUpperCase()} aggregation complete`);
    } catch (err) {
      toast.error('Report Generation Error: Pipeline failed to aggregate data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      const { siteId, skillType, labourSearch, startDate, endDate } = filters;
      let url = `/reporting/export/${format}?startDate=${startDate}&endDate=${endDate}&type=${reportType}`;
      if (siteId) url += `&siteId=${siteId}`;
      if (skillType) url += `&skillType=${skillType}`;
      if (labourSearch) url += `&search=${labourSearch}`;

      const response = await api.get(url, { responseType: 'blob' });
      
      const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', `CONSTRUCTSYNC_${reportType.toUpperCase()}_${format.toUpperCase()}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      toast.success(`${format.toUpperCase()} Protocol: Export dispatched`);
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            toast.error(`Export Protocol: ${errorData.message || 'Pipeline fault'}`);
          } catch (e) {
            toast.error('Export Failure: Document generation server offline');
          }
        };
        reader.readAsText(err.response.data);
      } else {
        toast.error('Export Failure: Document generation server offline');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-10 space-y-10 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">
            Reporting Terminal
          </h1>
          <div className="flex items-center space-x-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-orange-600" />
              Strategic Analytics
            </p>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="flex bg-slate-200 p-1 rounded-sm">
              <button 
                onClick={() => { setReportType('attendance'); setReportData([]); }}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'attendance' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Attendance
              </button>
              <button 
                onClick={() => { setReportType('payroll'); setReportData([]); }}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'payroll' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Payroll
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => handleExport('pdf')}
            disabled={isExporting || reportData.length === 0}
            className="flex items-center space-x-2 px-6 py-4 border-2 border-slate-900 bg-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 btn-industrial-shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <FileText size={16} strokeWidth={3} />
            <span>Export PDF</span>
          </button>
          <button 
            onClick={() => handleExport('excel')}
            disabled={isExporting || reportData.length === 0}
            className="flex items-center space-x-2 px-6 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 btn-industrial-shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Download size={16} strokeWidth={3} />
            <span>Download Excel</span>
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white border-4 border-slate-900 p-8 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <LayoutGrid size={120} />
        </div>
        
        <div className="flex items-center space-x-2 mb-6 border-b-2 border-slate-100 pb-4">
          <Filter className="h-5 w-5 text-orange-600" />
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-900">Advanced Filter Configuration</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
              <Users className="h-3 w-3 mr-1" /> Personnel Search
            </label>
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
               <input 
                type="text" 
                placeholder="ID OR NAME..."
                className="input-industrial h-12 pl-12 text-[10px] uppercase font-black"
                value={filters.labourSearch}
                onChange={(e) => setFilters({...filters, labourSearch: e.target.value})}
               />
            </div>
            <p className="text-[7px] font-bold text-slate-400 uppercase">Search by CID or Full Name</p>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
              <MapPin className="h-3 w-3 mr-1" /> Project Sector
            </label>
            <IndustrialSelect 
              placeholder="ALL ACTIVE SITES"
              options={sites.map(s => ({ value: s._id, label: s.name.toUpperCase() }))}
              value={filters.siteId}
              onChange={(val) => setFilters({...filters, siteId: val})}
            />
            <p className="text-[7px] font-bold text-slate-400 uppercase">Filter by Construction Site</p>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
              <Wrench className="h-3 w-3 mr-1" /> Specialization
            </label>
            <IndustrialSelect 
              placeholder="ALL SKILL GROUPS"
              options={skills.map(s => ({ value: s.name, label: s.name.toUpperCase() }))}
              value={filters.skillType}
              onChange={(val) => setFilters({...filters, skillType: val})}
            />
            <p className="text-[7px] font-bold text-slate-400 uppercase">Filter by Trade/Skill</p>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
              <Calendar className="h-3 w-3 mr-1" /> Date From
            </label>
            <div className="relative">
               <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
               <input 
                type="date" 
                className="input-industrial h-12 pl-12 text-[10px]"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
               />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
              <Calendar className="h-3 w-3 mr-1" /> Date To
            </label>
            <div className="relative">
               <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
               <input 
                type="date" 
                className="input-industrial h-12 pl-12 text-[10px]"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
               />
            </div>
          </div>

          <div className="flex items-end">
            <button 
              onClick={generateReport}
              disabled={loading}
              className="w-full h-12 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2 btn-industrial-shadow"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  <RefreshCcw size={16} />
                  <span>Execute Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Terminal Output */}
      <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Aggregated Personnel Data Feed</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {reportData.length} Records Decoded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Labour ID</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Personnel Name</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Sector</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">P / H / L / A</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total Hours</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Avg / Day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && reportData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-32 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-orange-600 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Synchronizing Manpower Matrix...</p>
                  </td>
                </tr>
              ) : reportData.length > 0 ? (
                reportData.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                       <span className="text-xs font-black text-slate-900 font-mono tracking-tighter">{row.labourId}</span>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-xs font-black text-slate-900 uppercase">{row.name}</p>
                       <div className="flex gap-1 mt-1">
                          {row.skills?.slice(0, 2).map((s, i) => (
                            <span key={i} className="text-[8px] font-bold px-1 py-0.5 bg-slate-100 text-slate-500 uppercase">{s}</span>
                          ))}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{row.siteName}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex items-center justify-center space-x-2">
                          <span className="text-[11px] font-black text-emerald-600">{row.totalPresent}</span>
                          <span className="text-[11px] font-black text-blue-600">{row.totalHalfDay}</span>
                          <span className="text-[11px] font-black text-orange-600">{row.totalLeave}</span>
                          <span className="text-[11px] font-black text-red-600">{row.totalAbsent}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="text-sm font-black text-slate-900">{row.totalWorkingHours.toFixed(1)}</span>
                       <span className="text-[9px] font-bold text-slate-400 ml-1">HRS</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="text-xs font-bold text-slate-700 italic">{(row.averageDailyHours || 0).toFixed(1)}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-32 text-center text-slate-300 uppercase text-[10px] font-black tracking-widest">
                    Fetch completed: No records detected in this boundary
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advisory Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-slate-900 p-8 text-white relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(234,88,12,1)]">
            <AlertCircle className="h-10 w-10 text-orange-600 mb-4" />
            <h3 className="text-xl font-black uppercase italic mb-4">Aggregation Protocol</h3>
            <p className="text-[10px] leading-relaxed text-slate-400 font-bold uppercase tracking-widest">
               Total working hours are calculated based on finalized check-out timestamps. Data synchronization may have a 5-minute latency due to cache buffering protocols. 
            </p>
         </div>
         
         <div className="border-4 border-slate-900 p-8 flex flex-col justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-4">System Glossary</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-emerald-600 uppercase">P — Present</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">Full shift (8+ hrs)</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-blue-600 uppercase">H — Half Day</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">Partial shift (4-6 hrs)</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-orange-600 uppercase">L — Leave</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">Authorized absence</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-red-600 uppercase">A — Absent</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">Unauthorized void</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Reporting;