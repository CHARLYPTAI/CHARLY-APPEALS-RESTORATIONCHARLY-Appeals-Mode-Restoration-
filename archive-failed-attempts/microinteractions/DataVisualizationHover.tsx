import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { SPRING_PRESETS } from './SpringPhysicsEngine';
import { useColorPalette } from '../color/ColorPaletteManager';
import { useHapticFeedback } from '../mobile/HapticFeedbackEngine';

interface DataPoint {
  x: number;
  y: number;
  label: string;
  value: number | string;
  color?: string;
  metadata?: Record<string, any>;
}

interface TooltipData {
  point: DataPoint;
  position: { x: number; y: number };
  visible: boolean;
}

interface DataVisualizationHoverProps {
  children: React.ReactNode;
  data?: DataPoint[];
  tooltipContent?: (point: DataPoint) => React.ReactNode;
  hoverEffect?: 'glow' | 'scale' | 'highlight' | 'shadow' | 'pulse';
  tooltipPosition?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
  showCrosshairs?: boolean;
  animationDuration?: number;
  className?: string;
  onHover?: (point: DataPoint | null) => void;
  onSelect?: (point: DataPoint) => void;
}

const Tooltip: React.FC<{
  data: TooltipData;
  content?: (point: DataPoint) => React.ReactNode;
  position?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
}> = ({ data, content, position = 'auto' }) => {
  const { currentPalette } = useColorPalette();
  const springConfig = SPRING_PRESETS.snappy;
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [actualPosition, setActualPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');

  useEffect(() => {
    if (!data.visible || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const container = tooltip.parentElement?.getBoundingClientRect();
    
    if (!container) return;

    let x = data.position.x;
    let y = data.position.y;
    let finalPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

    if (position === 'auto') {
      // Smart positioning based on available space
      const spaceTop = data.position.y - rect.height - 10;
      const spaceBottom = container.height - data.position.y - rect.height - 10;
      const spaceLeft = data.position.x - rect.width - 10;
      const spaceRight = container.width - data.position.x - rect.width - 10;

      if (spaceTop >= 0) {
        finalPosition = 'top';
        y = data.position.y - rect.height - 10;
      } else if (spaceBottom >= 0) {
        finalPosition = 'bottom';
        y = data.position.y + 10;
      } else if (spaceRight >= 0) {
        finalPosition = 'right';
        x = data.position.x + 10;
        y = data.position.y - rect.height / 2;
      } else {
        finalPosition = 'left';
        x = data.position.x - rect.width - 10;
        y = data.position.y - rect.height / 2;
      }
    } else {
      switch (position) {
        case 'top':
          y = data.position.y - rect.height - 10;
          break;
        case 'bottom':
          y = data.position.y + 10;
          break;
        case 'left':
          x = data.position.x - rect.width - 10;
          y = data.position.y - rect.height / 2;
          break;
        case 'right':
          x = data.position.x + 10;
          y = data.position.y - rect.height / 2;
          break;
      }
      finalPosition = position;
    }

    // Ensure tooltip stays within bounds
    x = Math.max(10, Math.min(x, container.width - rect.width - 10));
    y = Math.max(10, Math.min(y, container.height - rect.height - 10));

    setTooltipPosition({ x, y });
    setActualPosition(finalPosition);
  }, [data.position, data.visible, position]);

  const getPointerPosition = () => {
    const offset = 8;
    switch (actualPosition) {
      case 'top':
        return { bottom: -offset, left: '50%', transform: 'translateX(-50%)' };
      case 'bottom':
        return { top: -offset, left: '50%', transform: 'translateX(-50%)' };
      case 'left':
        return { right: -offset, top: '50%', transform: 'translateY(-50%)' };
      case 'right':
        return { left: -offset, top: '50%', transform: 'translateY(-50%)' };
    }
  };

  const getPointerRotation = () => {
    switch (actualPosition) {
      case 'top': return 180;
      case 'bottom': return 0;
      case 'left': return 90;
      case 'right': return -90;
    }
  };

  const DefaultTooltipContent = () => (
    <div className="space-y-2">
      <div className="font-semibold text-sm" style={{ color: currentPalette.text }}>
        {data.point.label}
      </div>
      <div className="text-lg font-bold" style={{ color: data.point.color || currentPalette.primary }}>
        {data.point.value}
      </div>
      {data.point.metadata && (
        <div className="space-y-1 text-xs" style={{ color: currentPalette.textSecondary }}>
          {Object.entries(data.point.metadata).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4">
              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {data.visible && (
        <motion.div
          ref={tooltipRef}
          className="absolute pointer-events-none z-50"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={springConfig}
        >
          <motion.div
            className="relative px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm"
            style={{
              backgroundColor: currentPalette.surface + 'F0',
              borderColor: currentPalette.border,
              boxShadow: `0 10px 25px -5px ${currentPalette.shadow}40, 0 4px 6px -2px ${currentPalette.shadow}20`
            }}
            whileHover={{ scale: 1.05 }}
            transition={springConfig}
          >
            {/* Tooltip pointer */}
            <div
              className="absolute w-0 h-0 pointer-events-none"
              style={{
                ...getPointerPosition(),
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid ${currentPalette.surface}F0`,
                transform: `${getPointerPosition().transform || ''} rotate(${getPointerRotation()}deg)`
              }}
            />

            {/* Tooltip content */}
            <div className="min-w-0 max-w-xs">
              {content ? content(data.point) : <DefaultTooltipContent />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Crosshairs: React.FC<{
  position: { x: number; y: number };
  visible: boolean;
  containerRect: DOMRect;
}> = ({ position, visible, containerRect }) => {
  const { currentPalette } = useColorPalette();
  const springConfig = SPRING_PRESETS.gentle;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={springConfig}
        >
          {/* Vertical line */}
          <motion.div
            className="absolute top-0 w-px"
            style={{
              left: position.x,
              height: containerRect.height,
              backgroundColor: currentPalette.primary,
              opacity: 0.3
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={springConfig}
          />
          
          {/* Horizontal line */}
          <motion.div
            className="absolute left-0 h-px"
            style={{
              top: position.y,
              width: containerRect.width,
              backgroundColor: currentPalette.primary,
              opacity: 0.3
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={springConfig}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const HoverEffect: React.FC<{
  position: { x: number; y: number };
  visible: boolean;
  effect: 'glow' | 'scale' | 'highlight' | 'shadow' | 'pulse';
  color?: string;
  size?: number;
}> = ({ position, visible, effect, color, size = 8 }) => {
  const { currentPalette } = useColorPalette();
  const springConfig = SPRING_PRESETS.responsive;
  const effectColor = color || currentPalette.primary;

  const effects = {
    glow: (
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          left: position.x - size,
          top: position.y - size,
          width: size * 2,
          height: size * 2,
          backgroundColor: effectColor,
          filter: 'blur(4px)',
          opacity: 0.4
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: visible ? 1 : 0, opacity: visible ? 0.4 : 0 }}
        transition={springConfig}
      />
    ),
    scale: (
      <motion.div
        className="absolute rounded-full pointer-events-none border-2"
        style={{
          left: position.x - size,
          top: position.y - size,
          width: size * 2,
          height: size * 2,
          borderColor: effectColor,
          backgroundColor: effectColor + '20'
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: visible ? 1 : 0, opacity: visible ? 1 : 0 }}
        transition={springConfig}
      />
    ),
    highlight: (
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          left: position.x - size * 1.5,
          top: position.y - size * 1.5,
          width: size * 3,
          height: size * 3,
          backgroundColor: effectColor + '10',
          border: `2px solid ${effectColor}40`
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: visible ? 1 : 0, opacity: visible ? 1 : 0 }}
        transition={springConfig}
      />
    ),
    shadow: (
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          left: position.x - size,
          top: position.y - size,
          width: size * 2,
          height: size * 2,
          backgroundColor: effectColor,
          boxShadow: `0 0 20px ${effectColor}60`,
          opacity: 0.8
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: visible ? 1 : 0, opacity: visible ? 0.8 : 0 }}
        transition={springConfig}
      />
    ),
    pulse: (
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          left: position.x - size,
          top: position.y - size,
          width: size * 2,
          height: size * 2,
          backgroundColor: effectColor,
          opacity: 0.6
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: visible ? [1, 1.2, 1] : 0,
          opacity: visible ? [0.6, 0.2, 0.6] : 0
        }}
        transition={{
          ...springConfig,
          repeat: visible ? Infinity : 0,
          repeatType: 'reverse',
          duration: 1
        }}
      />
    )
  };

  return (
    <AnimatePresence>
      {visible && effects[effect]}
    </AnimatePresence>
  );
};

export const DataVisualizationHover: React.FC<DataVisualizationHoverProps> = ({
  children,
  data = [],
  tooltipContent,
  hoverEffect = 'glow',
  tooltipPosition = 'auto',
  showCrosshairs = false,
  animationDuration = 200,
  className = '',
  onHover,
  onSelect
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [tooltipData, setTooltipData] = useState<TooltipData>({
    point: {} as DataPoint,
    position: { x: 0, y: 0 },
    visible: false
  });
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHapticFeedback();
  const springConfig = SPRING_PRESETS.responsive;

  // Update container rect on resize
  useEffect(() => {
    const updateRect = () => {
      if (containerRef.current) {
        setContainerRect(containerRef.current.getBoundingClientRect());
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setMousePosition({ x, y });

    // Find the closest data point
    if (data.length > 0) {
      let closestPoint: DataPoint | null = null;
      let minDistance = Infinity;

      data.forEach(point => {
        const distance = Math.sqrt(
          Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
        );

        if (distance < minDistance && distance < 30) { // 30px threshold
          minDistance = distance;
          closestPoint = point;
        }
      });

      if (closestPoint !== hoveredPoint) {
        setHoveredPoint(closestPoint);
        
        if (closestPoint) {
          triggerHaptic('light');
          setTooltipData({
            point: closestPoint,
            position: { x: closestPoint.x, y: closestPoint.y },
            visible: true
          });
        } else {
          setTooltipData(prev => ({ ...prev, visible: false }));
        }

        onHover?.(closestPoint);
      }
    }
  }, [data, hoveredPoint, onHover, triggerHaptic]);

  const handleMouseLeave = useCallback(() => {
    setHoveredPoint(null);
    setTooltipData(prev => ({ ...prev, visible: false }));
    onHover?.(null);
  }, [onHover]);

  const handleClick = useCallback((event: React.MouseEvent) => {
    if (hoveredPoint) {
      triggerHaptic('medium');
      onSelect?.(hoveredPoint);
    }
  }, [hoveredPoint, onSelect, triggerHaptic]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (hoveredPoint) {
        event.preventDefault();
        triggerHaptic('medium');
        onSelect?.(hoveredPoint);
      }
    }
  }, [hoveredPoint, onSelect, triggerHaptic]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Data visualization with interactive hover effects"
    >
      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Crosshairs */}
      {showCrosshairs && containerRect && (
        <Crosshairs
          position={mousePosition}
          visible={Boolean(hoveredPoint)}
          containerRect={containerRect}
        />
      )}

      {/* Hover effect */}
      {hoveredPoint && (
        <HoverEffect
          position={{ x: hoveredPoint.x, y: hoveredPoint.y }}
          visible={Boolean(hoveredPoint)}
          effect={hoverEffect}
          color={hoveredPoint.color}
        />
      )}

      {/* Tooltip */}
      <Tooltip
        data={tooltipData}
        content={tooltipContent}
        position={tooltipPosition}
      />
    </div>
  );
};

// Specialized components for different chart types
export const ChartHover: React.FC<DataVisualizationHoverProps & {
  chartType?: 'line' | 'bar' | 'scatter' | 'area';
}> = ({ chartType = 'line', ...props }) => {
  const effectMap = {
    line: 'glow',
    bar: 'highlight',
    scatter: 'scale',
    area: 'pulse'
  } as const;

  return (
    <DataVisualizationHover
      {...props}
      hoverEffect={effectMap[chartType]}
      showCrosshairs={chartType === 'line' || chartType === 'area'}
    />
  );
};

export const GraphHover: React.FC<DataVisualizationHoverProps & {
  nodeRadius?: number;
  edgeHover?: boolean;
}> = ({ nodeRadius = 8, edgeHover = false, ...props }) => (
  <DataVisualizationHover
    {...props}
    hoverEffect="shadow"
    showCrosshairs={false}
  />
);

export const MapHover: React.FC<DataVisualizationHoverProps & {
  zoomOnHover?: boolean;
}> = ({ zoomOnHover = false, ...props }) => (
  <DataVisualizationHover
    {...props}
    hoverEffect="highlight"
    tooltipPosition="top"
    showCrosshairs={false}
  />
);

export default DataVisualizationHover;