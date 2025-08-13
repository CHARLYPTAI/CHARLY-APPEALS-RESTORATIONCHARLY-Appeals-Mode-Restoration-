// charly_ui/src/components/v2/CollapsibleSection.tsx

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  animationDuration?: number;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  trigger,
  children,
  defaultOpen = false,
  onOpenChange,
  animationDuration = 300,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    const newOpen = !isOpen;
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    if (isOpen) {
      content.style.height = '0px';
      content.style.opacity = '0';
      content.offsetHeight; // trigger reflow
      content.style.transition = `height ${animationDuration}ms ease, opacity ${animationDuration}ms ease`;
      content.style.height = `${content.scrollHeight}px`;
      content.style.opacity = '1';
      setTimeout(() => {
        content.style.height = 'auto';
        content.style.transition = '';
      }, animationDuration);
    } else {
      content.style.height = `${content.scrollHeight}px`;
      content.style.opacity = '1';
      content.offsetHeight;
      content.style.transition = `height ${animationDuration}ms ease, opacity ${animationDuration}ms ease`;
      content.style.height = '0px';
      content.style.opacity = '0';
    }
  }, [isOpen, animationDuration]);

  return (
    <div className={cn('space-y-0', className)}>
      {React.isValidElement(trigger)
        ? React.cloneElement(trigger as React.ReactElement<any>, { onClick: toggle })
        : trigger}
      <div
        ref={contentRef}
        className="overflow-hidden"
        style={{ height: defaultOpen ? 'auto' : '0px', opacity: defaultOpen ? 1 : 0 }}
      >
        <div className="pt-2">{children}</div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
