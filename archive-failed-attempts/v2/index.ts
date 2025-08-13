/**
 * 🍎 CHARLY 2.0 - COMPONENT LIBRARY INDEX
 * 
 * Apple-quality component system implementing invisible excellence
 * through sophisticated simplicity and progressive disclosure.
 */

// Core Components
export { Button, FloatingActionButton, buttonVariants } from './Button';
export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  MetricCard,
  FeatureCard
} from './Card';

// Intelligent Interface
export { IntelligentCanvas } from './IntelligentCanvas';

// Progressive Disclosure
export { 
  DisclosureTrigger,
  CollapsibleSection, 
  Accordion,
  ExpandableCard,
  StepDisclosure 
} from './ProgressiveDisclosure';

// Workflow Intelligence Components
export { OpportunityRankingEngine } from './OpportunityRankingEngine';
export { WorkflowNavigation, type WorkflowMode } from './WorkflowNavigation';
export { ClientReportingEngine } from './ClientReportingEngine';
export { MetricsPanel } from './MetricsPanel';

// Design System Tokens
export { designTokens, generateCSSCustomProperties } from '../../design-system/tokens';

// Types
export type { ButtonProps } from './Button';
export type { CardProps } from './Card';
export type { IntelligentCanvasProps, CanvasMode, CanvasContext } from './IntelligentCanvas';