import React from 'react';

const Footer = () => {
  return (
    <footer className="px-10 py-6 border-t-2 border-slate-900 bg-white flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 shrink-0 z-20">
      <div className="flex items-center space-x-4">
        <p className="text-[10px] font-black tracking-widest text-slate-900 uppercase">
          © 2026 CONSTRUCTSYNC INFRASTRUCTURE
        </p>
        <span className="text-slate-200">|</span>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Build v2.4.0-Stable</p>
      </div>
      <div className="flex space-x-10">
        {['Network Status', 'Privacy Protocol', 'Service Terms'].map((link) => (
          <button key={link} className="text-[10px] font-black tracking-widest text-slate-400 hover:text-slate-900 uppercase transition-colors relative group">
            {link}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-600 transition-all group-hover:w-full"></span>
          </button>
        ))}
      </div>
    </footer>
  );
};

export default Footer;
