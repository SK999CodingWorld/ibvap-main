import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectContextType {
  value: string;
  onValueChange: (val: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedLabel: string;
  setSelectedLabel: (label: string) => void;
}

const SelectContext = createContext<SelectContextType>({
  value: '',
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
  selectedLabel: '',
  setSelectedLabel: () => {},
});

export const Select: React.FC<{
  value?: string;
  defaultValue?: string;
  onValueChange?: (val: string) => void;
  children: React.ReactNode;
}> = ({ value, defaultValue = '', onValueChange, children }) => {
  const [internalVal, setInternalVal] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');

  const currentVal = value !== undefined ? value : internalVal;

  const handleValueChange = (val: string) => {
    if (onValueChange) onValueChange(val);
    setInternalVal(val);
    setOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        value: currentVal,
        onValueChange: handleValueChange,
        open,
        setOpen,
        selectedLabel,
        setSelectedLabel,
      }}
    >
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className, children }) => {
  const { open, setOpen } = useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500",
        className
      )}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
    </button>
  );
};

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder = 'Select...' }) => {
  const { value, selectedLabel } = useContext(SelectContext);
  return <span>{selectedLabel || value || placeholder}</span>;
};

export const SelectContent: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  const { open } = useContext(SelectContext);
  if (!open) return null;
  return (
    <div
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-700 bg-slate-900 p-1 text-slate-200 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
        className
      )}
    >
      {children}
    </div>
  );
};

export const SelectItem: React.FC<{
  value: string;
  className?: string;
  children: React.ReactNode;
}> = ({ value, className, children }) => {
  const { value: currentVal, onValueChange, setSelectedLabel } = useContext(SelectContext);
  const isSelected = currentVal === value;

  return (
    <div
      onClick={() => {
        if (typeof children === 'string') {
          setSelectedLabel(children);
        }
        onValueChange(value);
      }}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-slate-800 hover:text-white",
        isSelected && "bg-slate-800 text-cyan-400 font-medium",
        className
      )}
    >
      {children}
    </div>
  );
};

export default Select;
