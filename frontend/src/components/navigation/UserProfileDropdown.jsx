import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, LogOut, Settings, Bell } from 'lucide-react';

const UserProfileDropdown = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-1.5 bg-slate-100 border-2 border-slate-900 btn-industrial-shadow"
      >
        <div className="bg-orange-600 p-1">
          <User className="h-4 w-4 text-white" />
        </div>
        <div className="hidden md:block text-left pr-2">
          <p className="text-[10px] font-black uppercase tracking-tighter leading-none">{user.name}</p>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{user.role}</p>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] z-40 overflow-hidden">
            <div className="p-3 border-b-2 border-slate-100 bg-slate-50">
              <p className="text-[10px] font-black uppercase text-slate-900">{user.email}</p>
            </div>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-orange-50 transition-colors">
              <Settings className="h-4 w-4 text-slate-600" />
              <span className="text-[10px] font-black uppercase tracking-widest">Settings</span>
            </button>
            <button 
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-50 text-red-600 transition-colors border-t-2 border-slate-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfileDropdown;
