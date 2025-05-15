"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

const AccordionContext = React.createContext<{
  value: string | null;
  toggle: (value: string) => void;
  isOpen: (value: string) => boolean;
}>({
  value: null,
  toggle: () => {},
  isOpen: () => false,
});

const Accordion = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    type?: "single" | "multiple"
    collapsible?: boolean
    value?: string | null
    onValueChange?: (value: string | null) => void
  }
>(({ className, children, collapsible = false, value: controlledValue, onValueChange, ...props }, ref) => {
  const [value, setValue] = React.useState<string | null>(controlledValue || null);

  React.useEffect(() => {
    if (controlledValue !== undefined) {
      setValue(controlledValue);
    }
  }, [controlledValue]);

  const toggle = React.useCallback((itemValue: string) => {
    setValue((prevValue) => {
      const newValue = prevValue === itemValue && collapsible ? null : itemValue;
      onValueChange?.(newValue);
      return newValue;
    });
  }, [collapsible, onValueChange]);

  const isOpen = React.useCallback((itemValue: string) => {
    return value === itemValue;
  }, [value]);

  return (
    <AccordionContext.Provider value={{ value, toggle, isOpen }}>
      <div
        ref={ref}
        className={className}
        {...props}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
});
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => {
  const { isOpen } = React.useContext(AccordionContext);
  const open = isOpen(value);

  return (
    <div
      ref={ref}
      data-state={open ? "open" : "closed"}
      className={className ? `border-b ${className}` : "border-b"}
      {...props}
    >
      {children}
    </div>
  );
});
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { toggle } = React.useContext(AccordionContext);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(e);
    if (!e.defaultPrevented) {
      const itemValue = e.currentTarget.closest('[value]')?.getAttribute('value') || "";
      toggle(itemValue);
    }
  };

  return (
    <button
      ref={ref}
      className={`flex w-full items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180 ${className || ""}`}
      onClick={handleClick}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </button>
  );
});
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { value } = React.useContext(AccordionContext);
  const itemValue = props['aria-labelledby']?.replace('-trigger', '') || "";
  const open = value === itemValue;

  return (
    <div
      ref={ref}
      data-state={open ? "open" : "closed"}
      className={`overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down ${className || ""}`}
      {...props}
    >
      <div className="pb-4 pt-0">{children}</div>
    </div>
  );
});
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } 