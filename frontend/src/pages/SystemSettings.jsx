import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Settings, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Clock, 
  Save, 
  Loader2, 
  AlertTriangle,
  Building2,
  Activity,
  History,
  ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

const SystemSettings = () => {
  const [settings, setSettings] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, sitesRes] = await Promise.all([
        api.get('/reporting/admin/settings'),
        api.get('/deployments/sites')
      ]);
      setSettings(settingsRes.data.data);
      setSites(sitesRes.data.data);
    } catch (err) {
      toast.error('Terminal Failure: Could not synchronize system parameters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateSetting = async (key, value, description) => {
    setSaving(true);
    try {
      await api.put('/reporting/admin/settings', { key, value, description });
      toast.success(`Protocol Updated: ${key}`);
      fetchData();
    } catch (err) {
      toast.error('Update Protocol Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSiteLock = async (site) => {
    try {
      await api.put(`/deployments/sites/${site._id}`, { ...site, isLocked: !site.isLocked });
      toast.success(`SITE SECURITY: ${site.name} ${!site.isLocked ? 'LOCKED' : 'RELEASED'}`);
      fetchData();
    } catch (err) {
      toast.error('Security Command Denied');
    }
  };

  const getSettingValue = (key, defaultValue) => {
    const s = settings.find(s => s.key === key);
    return s ? s.value : defaultValue;
  };

  return (
    <div className="p-10 space-y-10 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">
            System Control
          </h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest flex items-center">
            <Settings className="h-4 w-4 mr-2 text-orange-600" />
            System-Wide Configuration Terminal
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Global Parameters */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white border-4 border-slate-900 shadow-[10px_10px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
              <div className="bg-slate-900 p-6 flex items-center justify-between">
                 <h2 className="text-white text-xs font-black uppercase tracking-[0.3em] flex items-center">
                    <Activity className="h-4 w-4 mr-3 text-orange-500" />
                    Global Operational Protocols
                 </h2>
                 {saving && <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />}
              </div>
              
              <div className="p-8 space-y-8">
                 {/* Shift Duration */}
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b-2 border-slate-100">
                    <div className="space-y-1">
                       <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Standard Shift Boundary</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">Define standard working hours for overtime calculation</p>
                    </div>
                    <div className="flex items-center space-x-3">
                       <div className="relative">
                          <input 
                            type="number" 
                            className="input-industrial w-24 h-12 text-center text-lg font-black"
                            value={getSettingValue('SHIFT_HOURS', 8)}
                            onChange={(e) => handleUpdateSetting('SHIFT_HOURS', e.target.value, 'Standard daily shift duration in hours')}
                          />
                          <span className="absolute -bottom-4 left-0 w-full text-center text-[8px] font-black text-slate-400">HOURS</span>
                       </div>
                    </div>
                 </div>

                 {/* Grace Period */}
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b-2 border-slate-100">
                    <div className="space-y-1">
                       <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Authentication Grace Buffer</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">Allowable minutes for check-in after shift commencement</p>
                    </div>
                    <div className="flex items-center space-x-3">
                       <div className="relative">
                          <input 
                            type="number" 
                            className="input-industrial w-24 h-12 text-center text-lg font-black"
                            value={getSettingValue('GRACE_PERIOD', 15)}
                            onChange={(e) => handleUpdateSetting('GRACE_PERIOD', e.target.value, 'Check-in grace period in minutes')}
                          />
                          <span className="absolute -bottom-4 left-0 w-full text-center text-[8px] font-black text-slate-400">MINS</span>
                       </div>
                    </div>
                 </div>

                 {/* System Status Toggle */}
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                       <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Global Maintenance Mode</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">Restrict all non-admin access for system upgrades</p>
                    </div>
                    <button 
                      onClick={() => handleUpdateSetting('MAINTENANCE_MODE', !getSettingValue('MAINTENANCE_MODE', false), 'System-wide maintenance lockout')}
                      className={`w-16 h-10 border-4 border-slate-900 flex items-center px-1 transition-colors ${getSettingValue('MAINTENANCE_MODE', false) ? 'bg-red-600' : 'bg-slate-100'}`}
                    >
                       <div className={`h-5 w-5 bg-white border-2 border-slate-900 transition-transform ${getSettingValue('MAINTENANCE_MODE', false) ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                 </div>
              </div>
           </div>

           {/* Security Logs Link */}
           <div className="bg-slate-900 p-8 flex items-center justify-between group cursor-pointer hover:bg-orange-600 transition-colors shadow-[8px_8px_0px_0px_rgba(234,88,12,1)]"
                onClick={() => window.location.href = '/analytics'}>
              <div className="flex items-center space-x-4 text-white">
                 <History className="h-8 w-8" />
                 <div>
                    <p className="text-sm font-black uppercase italic tracking-widest">Master Audit Intelligence</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase group-hover:text-white transition-colors">Review all cryptographically logged system events</p>
                 </div>
              </div>
              <Save className="h-5 w-5 text-white opacity-20 group-hover:opacity-100 transition-opacity" />
           </div>
        </div>

        {/* Site Locks */}
        <div className="space-y-8">
           <div className="bg-white border-4 border-slate-900 shadow-[10px_10px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
              <div className="bg-slate-900 p-6">
                 <h2 className="text-white text-xs font-black uppercase tracking-[0.3em] flex items-center">
                    <ShieldAlert className="h-4 w-4 mr-3 text-red-500" />
                    Sector Security Protocols
                 </h2>
              </div>
              
              <div className="divide-y-2 divide-slate-100 max-h-[600px] overflow-y-auto">
                 {sites.filter(s => s.status === 'ACTIVE').map(site => (
                    <div key={site._id} className="p-6 space-y-4">
                       <div className="flex justify-between items-start">
                          <div>
                             <p className="text-[11px] font-black text-slate-900 uppercase leading-tight">{site.name}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{site.location}</p>
                          </div>
                          {site.isLocked ? (
                            <Lock className="h-4 w-4 text-red-600" />
                          ) : (
                            <Unlock className="h-4 w-4 text-emerald-600" />
                          )}
                       </div>

                       <button 
                        onClick={() => handleToggleSiteLock(site)}
                        className={`w-full py-3 text-[9px] font-black uppercase tracking-widest border-2 transition-all ${
                          site.isLocked 
                          ? 'bg-emerald-50 border-emerald-900 text-emerald-900 hover:bg-emerald-900 hover:text-white' 
                          : 'bg-red-50 border-red-900 text-red-900 hover:bg-red-900 hover:text-white shadow-[4px_4px_0px_0px_rgba(153,27,27,1)] active:shadow-none'
                        }`}
                       >
                         {site.isLocked ? 'REVOKE MASTER LOCK' : 'ENGAGE MASTER LOCK'}
                       </button>
                    </div>
                 ))}
                 {sites.filter(s => s.status === 'ACTIVE').length === 0 && (
                   <div className="p-10 text-center text-slate-400 uppercase text-[9px] font-black tracking-widest italic">
                      No active sectors detected
                   </div>
                 )}
              </div>
           </div>

           {/* Emergency Notice */}
           <div className="p-6 bg-orange-50 border-2 border-orange-200 space-y-4">
              <div className="flex items-start space-x-3">
                 <AlertTriangle size={20} className="text-orange-600 shrink-0" />
                 <h4 className="text-[11px] font-black text-orange-900 uppercase tracking-widest">Administrative Compliance</h4>
              </div>
              <p className="text-[9px] font-bold text-orange-700 uppercase leading-relaxed">
                 Master Lock protocols bypass local supervisor permissions. Engaging a lock immediately disables all check-in/out and deployment commands for the target sector.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;