import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  MapPin, 
  Plus, 
  Loader2, 
  Trash2, 
  Edit3, 
  ShieldAlert,
  Building2,
  HardHat,
  X,
  CheckCircle2,
  UserCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import IndustrialSelect from '../components/common/IndustrialSelect';

const SiteManagement = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    supervisorId: '',
    status: 'PLANNED',
    isLocked: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sitesRes, usersRes] = await Promise.all([
        api.get('/deployments/sites'),
        api.get('/auth/users')
      ]);
      setSites(sitesRes.data.data);
      setSupervisors(usersRes.data.data.filter(u => u.role === 'SUPERVISOR'));
    } catch (err) {
      toast.error('Failed to retrieve infrastructure or personnel data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (site = null) => {
    if (site) {
      setEditingSite(site);
      setFormData({
        name: site.name,
        location: site.location,
        supervisorId: site.supervisorId || '',
        status: site.status || 'ACTIVE',
        isLocked: site.isLocked || false
      });
    } else {
      setEditingSite(null);
      setFormData({
        name: '',
        location: '',
        supervisorId: '',
        status: 'PLANNED',
        isLocked: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingSite) {
        await api.put(`/deployments/sites/${editingSite._id}`, formData);
        toast.success('Site Specifications Updated');
      } else {
        await api.post('/deployments/sites', formData);
        toast.success('New Construction Site Provisioned');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('CRITICAL: This will decommission the site record. Confirm?')) return;
    
    try {
      // Check if there are active deployments first to provide a better error message
      const deployRes = await api.get(`/deployments/site/${id}`);
      if (deployRes.data.data && deployRes.data.data.length > 0) {
        toast.error('CANNOT DELETE: Site has active personnel deployments. Redeploy all labour before decommissioning.');
        return;
      }

      await api.delete(`/deployments/sites/${id}`);
      toast.success('Site Decommissioned');
      fetchData();
    } catch (err) {
      const message = err.response?.data?.message || 'Deletion Protocol Aborted';
      toast.error(message);
    }
  };

  return (
    <div className="p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">
            Site Management
          </h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-orange-600" />
            Active Project Surveillance & Logistics
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center space-x-3 px-6 py-4 bg-orange-600 text-white text-xs font-black uppercase tracking-[0.2em] btn-industrial-shadow transition-transform hover:-translate-y-1 active:translate-y-0"
        >
          <Plus size={18} strokeWidth={3} />
          <span>Provision New Site</span>
        </button>
      </div>

      {/* Site Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Synchronizing Site Inventory...</p>
        </div>
      ) : sites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sites.map((site) => {
            const supervisor = supervisors.find(s => s._id === site.supervisorId);
            return (
              <div key={site._id} className="bg-white border-2 border-slate-900 overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] group">
                <div className="bg-slate-900 p-6 flex justify-between items-start text-white relative">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight truncate max-w-[200px]">{site.name}</h3>
                    <div className="flex items-center text-slate-400 text-[9px] font-bold uppercase mt-1 tracking-widest">
                      <MapPin size={10} className="mr-1" /> {site.location}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`text-[8px] font-black px-2 py-1 uppercase border ${
                      site.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      site.status === 'PLANNED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      site.status === 'COMPLETED' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                      'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {site.status || 'ACTIVE'}
                    </span>
                    <button onClick={() => handleOpenModal(site)} className="p-2 bg-slate-800 hover:bg-orange-600 transition-colors text-white">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete(site._id)} className="p-2 bg-slate-800 hover:bg-red-600 transition-colors text-white">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="absolute bottom-0 right-0 p-2 opacity-10 pointer-events-none">
                    <Building2 size={60} />
                  </div>
                </div>
                
                {site.isLocked && (
                  <div className="bg-red-600 text-white px-6 py-2 flex items-center justify-center space-x-2 animate-pulse">
                    <ShieldAlert size={12} />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">Master Lock Engaged — Ops Suspended</span>
                  </div>
                )}
                
                <div className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Site Supervisor</span>
                      <div className="flex items-center space-x-2 bg-slate-50 p-3 border-2 border-slate-100">
                        <UserCircle2 size={16} className="text-orange-600" />
                        <span className="text-[10px] font-black text-slate-900 uppercase">{supervisor?.name || 'UNASSIGNED'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col gap-2">
                     <button 
                      onClick={() => navigate(`/deployments?siteId=${site._id}`)}
                      className="w-full py-3 bg-slate-50 text-slate-900 text-[10px] font-black uppercase tracking-widest border-2 border-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-center space-x-2"
                     >
                       <HardHat size={14} />
                       <span>View Site Deployments</span>
                     </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 p-20 text-center">
          <ShieldAlert className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active site sectors detected in the database.</p>
          <button onClick={() => handleOpenModal()} className="mt-6 text-[10px] font-black text-orange-600 uppercase underline">Initialize First Site</button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white border-4 border-slate-900 max-w-lg w-full shadow-[16px_16px_0px_0px_rgba(234,88,12,1)] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 p-8 text-white relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-orange-500 transition-colors">
                <X size={24} />
              </button>
              <h2 className="text-3xl font-black uppercase tracking-tight italic">
                {editingSite ? 'Modify Sector' : 'Initialize Site'}
              </h2>
              <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Logistics Control Terminal</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Site Designation</label>
                  <input 
                    type="text" 
                    required 
                    className="input-industrial h-12" 
                    placeholder="E.G. DOWNTOWN TOWER PHASE 1"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">GPS/Location</label>
                  <input 
                    type="text" 
                    required 
                    className="input-industrial h-12" 
                    placeholder="E.G. SECTOR 45, NAVI MUMBAI"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Linked Site Supervisor</label>
                  <IndustrialSelect 
                    required 
                    placeholder="SELECT AUTHORIZED SUPERVISOR..."
                    options={supervisors.map(s => ({ value: s._id, label: `${s.name} (${s.email})` }))}
                    value={formData.supervisorId}
                    onChange={(val) => setFormData({...formData, supervisorId: val})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Site Lifecycle Status</label>
                  <IndustrialSelect 
                    required 
                    options={[
                      { value: 'PLANNED', label: 'PLANNED' },
                      { value: 'ACTIVE', label: 'ACTIVE' },
                      { value: 'COMPLETED', label: 'COMPLETED' },
                      { value: 'DECOMMISSIONED', label: 'DECOMMISSIONED' }
                    ]}
                    value={formData.status}
                    onChange={(val) => setFormData({...formData, status: val})}
                  />
                </div>

                {/* Master Lock Toggle */}
                <div className="pt-4 flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-900 uppercase">Security Protocol: Master Lock</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Pause all attendance and deployment activities</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, isLocked: !formData.isLocked})}
                    className={`w-14 h-8 flex items-center px-1 transition-colors duration-200 border-2 border-slate-900 ${formData.isLocked ? 'bg-orange-600' : 'bg-slate-200'}`}
                  >
                    <div className={`w-5 h-5 bg-white border-2 border-slate-900 transition-transform duration-200 ${formData.isLocked ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                {formData.isLocked && (
                  <div className="p-3 bg-red-50 border border-red-200 flex items-center space-x-2">
                    <ShieldAlert size={14} className="text-red-600" />
                    <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">Master Lock Engaged: Site Access Revoked</span>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t-2 border-slate-50 flex gap-4">
                 <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-grow py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] btn-industrial-shadow hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
                 >
                   {isSubmitting ? <Loader2 className="animate-spin" /> : (
                     <>
                        <CheckCircle2 size={16} />
                        <span>Authorize Protocol</span>
                     </>
                   )}
                 </button>
                 <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
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

export default SiteManagement;