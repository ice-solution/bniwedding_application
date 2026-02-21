import * as React from 'react';
import { cn } from '@/lib/utils';

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(
  undefined
);

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ value, defaultValue, onValueChange, children }: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  const [isOpen, setIsOpen] = React.useState(false);
  const currentValue = value !== undefined ? value : internalValue;
  const selectId = React.useId();

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  // 點擊外部關閉選單
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const selectElement = document.querySelector(`[data-select-id="${selectId}"]`);
      if (selectElement && !selectElement.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, selectId]);

  return (
    <SelectContext.Provider value={{ 
      value: currentValue, 
      onValueChange: handleValueChange,
      isOpen,
      setIsOpen,
    }}>
      <div className="relative" data-select-id={selectId}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  placeholder?: string;
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, placeholder, children, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error('SelectTrigger must be used within Select');

    return (
      <button
        type="button"
        ref={ref}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        onClick={(e) => {
          e.stopPropagation();
          context.setIsOpen(!context.isOpen);
        }}
        {...props}
      >
        {children}
        <svg
          className="h-4 w-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

export interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectValue must be used within Select');
  
  const selectedValue = context.value;
  
  if (selectedValue) {
    return <span>{selectedValue}</span>;
  }
  return <span>{placeholder}</span>;
}

export interface SelectContentProps {
  children?: React.ReactNode;
}

export function SelectContent({ children }: SelectContentProps) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectContent must be used within Select');

  if (!context.isOpen) return null;

  return (
    <div
      className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

export interface SelectItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function SelectItem({ value, className, children, ...props }: SelectItemProps) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used within Select');

  return (
    <button
      type="button"
      role="option"
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        context.value === value && 'bg-accent text-accent-foreground',
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        context.onValueChange(value);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
