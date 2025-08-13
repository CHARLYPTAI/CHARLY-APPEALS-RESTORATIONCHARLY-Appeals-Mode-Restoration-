// charly_ui/src/components/v2/ProgressiveDisclosure.tsx

import React, { useState } from 'react';
import { DisclosureTrigger } from './DisclosureTrigger';
import { CollapsibleSection } from './CollapsibleSection';

interface ProgressiveDisclosureProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  title,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <CollapsibleSection
      defaultOpen={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <DisclosureTrigger
          isOpen={isOpen}
          onToggle={() => setIsOpen(!isOpen)}
          label={title}
          icon={<span>📂</span>}
          variant="prominent"
        />
      }
    >
      {children}
    </CollapsibleSection>
  );
};

export default ProgressiveDisclosure;
