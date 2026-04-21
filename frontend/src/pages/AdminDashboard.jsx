import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Users, 
  HardHat, 
  Activity, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Loader2,
  RefreshCcw,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reporting/admin/dashboard');
      setStats(response.data.data);
    } catch (err) {
      toast.error('Failed to synchronize dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  const kpis = [
    { 
      label: 'Active Personnel', 
      value: stats?.totalLabour || 0, 
      icon: Users, 
      color: 'bg-blue-600',
      description: 'Total active workforce registered'
    },
    { 
      label: 'Operational Sites', 
      value: stats?.activeDeployments || 0, 
      icon: HardHat, 
      color: 'bg-orange-600',
      description: 'Sites with active deployments'
    },
    { 
      label: 'Attendance Rate', 
      value: `${stats?.attendanceRate || 0}%`, 
      icon: Activity, 
      color: 'bg-emerald-600',
      description: "Today's vs scheduled deployment"
    }
  ];

  return (
    <div className="p-10 space-y-10">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">
            Command Center
          </h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Real-time Systems Surveillance
          </p>
        </div>
        <button 
          onClick={fetchStats}
          className="flex items-center space-x-2 px-4 py-2 border-2 border-slate-900 bg-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 btn-industrial-shadow"
        >
          <RefreshCcw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Synchronize Data</span>
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white border-2 border-slate-900 p-8 relative overflow-hidden btn-industrial-shadow group">
            <div className={`absolute top-0 right-0 p-3 ${kpi.color} text-white`}>
              <kpi.icon size={20} strokeWidth={3} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{kpi.label}</p>
              <h3 className="text-4xl font-black text-slate-900 mb-4">{kpi.value}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-t border-slate-100 pt-4 flex items-center">
                {kpi.description}
              </p>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-0 bg-slate-900 transition-all duration-500 group-hover:w-full"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Access Logs */}
        <div className="bg-white border-2 border-slate-900 overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
          <div className="bg-slate-900 p-4 flex justify-between items-center">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center">
              <Clock className="h-4 w-4 mr-2 text-orange-500" />
              Recent Authorization Events
            </h3>
            <Activity className="h-4 w-4 text-slate-600" />
          </div>
          <div className="divide-y-2 divide-slate-100">
            {stats?.recentLogins?.length > 0 ? (
              stats.recentLogins.map((login, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-100 flex items-center justify-center font-black text-slate-500 border-2 border-slate-200">
                      {login.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase">{login.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{login.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black px-2 py-1 bg-slate-100 text-slate-600 uppercase border border-slate-200">
                      {login.role}
                    </span>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                      {new Date(login.lastLogin).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-400 uppercase text-[10px] font-black tracking-widest">
                No recent access events recorded
              </div>
            )}
          </div>
          <button className="w-full p-4 border-t-2 border-slate-900 bg-slate-50 text-[10px] font-black uppercase tracking-widest hover:bg-white flex items-center justify-center space-x-2">
            <span>View All Security Logs</span>
            <ArrowRight size={12} strokeWidth={3} />
          </button>
        </div>

        {/* System Health / Status */}
        <div className="space-y-8">
          <div className="bg-slate-900 p-8 text-white relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(234,88,12,1)]">
             <div className="relative z-10">
               <h3 className="text-xl font-black uppercase tracking-tight italic mb-2">Operational Integrity</h3>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">
                 System Security & Infrastructure Status
               </p>
               
               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black uppercase tracking-widest">Auth Service</span>
                   <span className="text-[9px] font-black px-2 py-1 bg-green-600 text-white uppercase">Operational</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black uppercase tracking-widest">Database Cluster</span>
                   <span className="text-[9px] font-black px-2 py-1 bg-green-600 text-white uppercase">Encrypted</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black uppercase tracking-widest">Network Gateway</span>
                   <span className="text-[9px] font-black px-2 py-1 bg-green-600 text-white uppercase">Protected</span>
                 </div>
               </div>
             </div>
             <div className="absolute bottom-0 right-0 p-4 opacity-10">
               <TrendingUp size={120} />
             </div>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 p-6 flex items-start space-x-4">
            <div className="bg-orange-600 p-2 text-white shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="text-[11px] font-black text-orange-900 uppercase tracking-widest mb-1">Notice: Security Compliance</h4>
              <p className="text-[10px] font-bold text-orange-700 uppercase leading-relaxed">
                All personnel actions are monitored and logged. Periodic security audits are performed automatically. Ensure all credentials follow the master security protocol.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
