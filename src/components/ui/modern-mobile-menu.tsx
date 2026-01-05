import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Home, Briefcase, Calendar, Shield, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconComponentType = React.ElementType<{ className?: string }>;

export interface InteractiveMenuItem {
  label: string;
  icon: IconComponentType;
  value: string;
}

export interface InteractiveMenuProps {
  items?: InteractiveMenuItem[];
  accentColor?: string;
  activeValue?: string;
  onItemClick?: (value: string) => void;
}

const defaultItems: InteractiveMenuItem[] = [
  { label: 'home', icon: Home, value: 'home' },
  { label: 'strategy', icon: Briefcase, value: 'strategy' },
  { label: 'period', icon: Calendar, value: 'period' },
  { label: 'security', icon: Shield, value: 'security' },
  { label: 'settings', icon: Settings, value: 'settings' },
];

const defaultAccentColor = 'hsl(var(--primary))';

const InteractiveMenu: React.FC<InteractiveMenuProps> = ({ 
  items, 
  accentColor,
  activeValue,
  onItemClick 
}) => {
  const finalItems = useMemo(() => {
    const isValid = items && Array.isArray(items) && items.length >= 2 && items.length <= 6;
    if (!isValid) {
      console.warn("InteractiveMenu: 'items' prop is invalid or missing. Using default items.", items);
      return defaultItems;
    }
    return items;
  }, [items]);

  const [activeIndex, setActiveIndex] = useState(() => {
    if (activeValue) {
      const idx = finalItems.findIndex(item => item.value === activeValue);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  useEffect(() => {
    if (activeValue) {
      const idx = finalItems.findIndex(item => item.value === activeValue);
      if (idx >= 0) setActiveIndex(idx);
    }
  }, [activeValue, finalItems]);

  useEffect(() => {
    if (activeIndex >= finalItems.length) {
      setActiveIndex(0);
    }
  }, [finalItems, activeIndex]);

  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const setLineWidth = () => {
      const activeItemElement = itemRefs.current[activeIndex];
      const activeTextElement = textRefs.current[activeIndex];

      if (activeItemElement && activeTextElement) {
        const textWidth = activeTextElement.offsetWidth;
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`);
      }
    };

    setLineWidth();

    window.addEventListener('resize', setLineWidth);
    return () => {
      window.removeEventListener('resize', setLineWidth);
    };
  }, [activeIndex, finalItems]);

  const handleItemClick = (index: number) => {
    setActiveIndex(index);
    onItemClick?.(finalItems[index].value);
  };

  const navStyle = useMemo(() => {
    const activeColor = accentColor || defaultAccentColor;
    return { '--component-active-color': activeColor } as React.CSSProperties;
  }, [accentColor]);

  return (
    <nav 
      className="flex items-center justify-around gap-1 p-2 rounded-2xl bg-card border border-border shadow-lg w-full max-w-md mx-auto"
      style={navStyle}
    >
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex;
        const IconComponent = item.icon;

        return (
          <button
            key={item.value}
            type="button"
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px]",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            onClick={() => handleItemClick(index)}
            ref={(el) => (itemRefs.current[index] = el)}
            style={{ '--lineWidth': '0px' } as React.CSSProperties}
          >
            <div className={cn(
              "transition-transform duration-300",
              isActive && "animate-bounce-icon"
            )}>
              <IconComponent className="h-5 w-5" />
            </div>
            
            <span
              className={cn(
                "text-[10px] font-medium transition-all duration-300 whitespace-nowrap",
                isActive ? "opacity-100" : "opacity-70"
              )}
              ref={(el) => (textRefs.current[index] = el)}
            >
              {item.label}
            </span>

            {isActive && (
              <span 
                className="absolute -bottom-0.5 h-0.5 bg-primary rounded-full transition-all duration-300"
                style={{ width: 'var(--lineWidth, 0px)' }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export { InteractiveMenu };
