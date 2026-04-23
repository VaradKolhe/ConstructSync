import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const IndustrialSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  required = false,
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`input-industrial h-12 flex items-center justify-between cursor-pointer select-none border-2 ${
          isOpen ? 'border-orange-500 ring-2 ring-orange-500/10' : 'border-slate-900'
        } transition-all duration-200`}
      >
        <span className={`text-[10px] font-black uppercase tracking-widest truncate ${!selectedOption ? 'text-slate-400' : 'text-slate-900'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-slate-900 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((option) => (
              <div 
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-100 ${
                  value === option.value 
                    ? 'bg-slate-900 text-white' 
                    : 'hover:bg-orange-600 hover:text-white text-slate-900'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">{option.label}</span>
                {value === option.value && <Check size={14} className="text-orange-500" />}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Hidden input for form validation if needed */}
      {required && (
        <input 
          tabIndex={-1}
          autoComplete="off"
          style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
          value={value}
          required
          onChange={() => {}}
        />
      )}
    </div>
  );
};

export default IndustrialSelect;
