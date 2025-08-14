/**
 * CHARLY 2.0 - Pinch-to-Zoom Provider
 * Apple-quality pinch-to-zoom for property cards and details
 * Task 21: Revolutionary Gesture-Based Navigation
 */

import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { RevolutionaryGestureEngine } from './RevolutionaryGestureEngine';

interface ZoomState {
  scale: number;
  translateX: number;
  translateY: number;
  isZooming: boolean;
  isZoomed: boolean;
  minScale: number;
  maxScale: number;
  centerPoint: { x: number; y: number };
}

interface PinchZoomContextType {
  zoomState: ZoomState;
  zoomIn: (centerPoint?: { x: number; y: number }) => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setZoomLimits: (min: number, max: number) => void;
  isZoomable: boolean;
  setIsZoomable: (zoomable: boolean) => void;
}

const PinchZoomContext = createContext<PinchZoomContextType | null>(null);

export const usePinchZoom = () => {
  const context = useContext(PinchZoomContext);
  if (!context) {
    throw new Error('usePinchZoom must be used within a PinchZoomProvider');
  }
  return context;
};

interface PinchZoomProviderProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  doubleTapZoomScale?: number;
  enableDoubleTapZoom?: boolean;
  enablePanWhenZoomed?: boolean;
  zoomSensitivity?: number;
  className?: string;
}

export const PinchZoomProvider: React.FC<PinchZoomProviderProps> = ({
  children,
  minScale = 0.8,
  maxScale = 3.0,
  doubleTapZoomScale = 2.0,
  enableDoubleTapZoom = true,
  enablePanWhenZoomed = true,
  zoomSensitivity = 1.0,
  className = ''
}) => {
  const [zoomState, setZoomState] = useState<ZoomState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    isZooming: false,
    isZoomed: false,
    minScale,
    maxScale,
    centerPoint: { x: 0, y: 0 }
  });

  const [isZoomable, setIsZoomable] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPinchScaleRef = useRef(1);
  const lastPinchCenterRef = useRef({ x: 0, y: 0 });

  // Motion values for smooth zooming
  const scaleMotion = useMotionValue(1);
  const translateXMotion = useMotionValue(0);
  const translateYMotion = useMotionValue(0);

  // Spring physics for Apple-quality animations
  const springConfig = { damping: 25, stiffness: 300, mass: 0.8 };
  const springScale = useSpring(scaleMotion, springConfig);
  const springTranslateX = useSpring(translateXMotion, springConfig);
  const springTranslateY = useSpring(translateYMotion, springConfig);

  // Transform values for visual feedback
  const opacity = useTransform(springScale, [minScale, 1, maxScale], [0.9, 1, 0.95]);
  const blur = useTransform(springScale, [1, maxScale], [0, 0.5]);

  // Update motion values when state changes
  useEffect(() => {
    scaleMotion.set(zoomState.scale);
    translateXMotion.set(zoomState.translateX);
    translateYMotion.set(zoomState.translateY);
  }, [zoomState.scale, zoomState.translateX, zoomState.translateY, scaleMotion, translateXMotion, translateYMotion]);

  // Constrain translation to keep content within bounds
  const constrainTranslation = useCallback((
    scale: number,
    translateX: number,
    translateY: number,
    containerWidth: number,
    containerHeight: number
  ) => {
    if (scale <= 1) {
      return { x: 0, y: 0 };
    }

    const scaledWidth = containerWidth * scale;
    const scaledHeight = containerHeight * scale;
    const maxX = (scaledWidth - containerWidth) / 2;
    const maxY = (scaledHeight - containerHeight) / 2;

    return {
      x: Math.max(-maxX, Math.min(maxX, translateX)),
      y: Math.max(-maxY, Math.min(maxY, translateY))
    };
  }, []);

  // Handle pinch gesture
  const handlePinchGesture = useCallback((scale: number) => {
    if (!isZoomable) return;

    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newScale = Math.max(minScale, Math.min(maxScale, scale * zoomSensitivity));
    
    // Calculate center point for scaling
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    
    // Update zoom state
    setZoomState(prev => {
      const constrainedTranslation = constrainTranslation(
        newScale,
        prev.translateX,
        prev.translateY,
        containerRect.width,
        containerRect.height
      );

      return {
        ...prev,
        scale: newScale,
        translateX: constrainedTranslation.x,
        translateY: constrainedTranslation.y,
        isZooming: true,
        isZoomed: newScale > 1,
        centerPoint: { x: centerX, y: centerY }
      };
    });

    lastPinchScaleRef.current = newScale;
    lastPinchCenterRef.current = { x: centerX, y: centerY };
  }, [isZoomable, minScale, maxScale, zoomSensitivity, constrainTranslation]);

  // Handle pan gesture when zoomed
  const handlePanGesture = useCallback((delta: { x: number; y: number }) => {
    if (!isZoomable || !enablePanWhenZoomed || zoomState.scale <= 1) return;

    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newTranslateX = zoomState.translateX + delta.x;
    const newTranslateY = zoomState.translateY + delta.y;

    const constrainedTranslation = constrainTranslation(
      zoomState.scale,
      newTranslateX,
      newTranslateY,
      containerRect.width,
      containerRect.height
    );

    setZoomState(prev => ({
      ...prev,
      translateX: constrainedTranslation.x,
      translateY: constrainedTranslation.y
    }));
  }, [isZoomable, enablePanWhenZoomed, zoomState.scale, zoomState.translateX, zoomState.translateY, constrainTranslation]);

  // Handle double tap zoom
  const handleDoubleTapZoom = useCallback((point: { x: number; y: number }) => {
    if (!isZoomable || !enableDoubleTapZoom) return;

    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const relativeX = point.x - containerRect.left;
    const relativeY = point.y - containerRect.top;

    if (zoomState.isZoomed) {
      // Zoom out
      setZoomState(prev => ({
        ...prev,
        scale: 1,
        translateX: 0,
        translateY: 0,
        isZoomed: false,
        centerPoint: { x: relativeX, y: relativeY }
      }));
    } else {
      // Zoom in
      const targetScale = doubleTapZoomScale;
      const scaleFactor = targetScale - 1;
      const translateX = (containerRect.width / 2 - relativeX) * scaleFactor;
      const translateY = (containerRect.height / 2 - relativeY) * scaleFactor;

      const constrainedTranslation = constrainTranslation(
        targetScale,
        translateX,
        translateY,
        containerRect.width,
        containerRect.height
      );

      setZoomState(prev => ({
        ...prev,
        scale: targetScale,
        translateX: constrainedTranslation.x,
        translateY: constrainedTranslation.y,
        isZoomed: true,
        centerPoint: { x: relativeX, y: relativeY }
      }));
    }
  }, [isZoomable, enableDoubleTapZoom, zoomState.isZoomed, doubleTapZoomScale, constrainTranslation]);

  // Programmatic zoom controls
  const zoomIn = useCallback((centerPoint?: { x: number; y: number }) => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const targetScale = Math.min(maxScale, zoomState.scale * 1.5);
    
    const center = centerPoint || { 
      x: containerRect.width / 2, 
      y: containerRect.height / 2 
    };

    const scaleFactor = targetScale / zoomState.scale;
    const translateX = zoomState.translateX + (containerRect.width / 2 - center.x) * (scaleFactor - 1);
    const translateY = zoomState.translateY + (containerRect.height / 2 - center.y) * (scaleFactor - 1);

    const constrainedTranslation = constrainTranslation(
      targetScale,
      translateX,
      translateY,
      containerRect.width,
      containerRect.height
    );

    setZoomState(prev => ({
      ...prev,
      scale: targetScale,
      translateX: constrainedTranslation.x,
      translateY: constrainedTranslation.y,
      isZoomed: targetScale > 1,
      centerPoint: center
    }));
  }, [maxScale, zoomState.scale, zoomState.translateX, zoomState.translateY, constrainTranslation]);

  const zoomOut = useCallback(() => {
    const targetScale = Math.max(minScale, zoomState.scale / 1.5);
    
    if (targetScale <= 1) {
      setZoomState(prev => ({
        ...prev,
        scale: 1,
        translateX: 0,
        translateY: 0,
        isZoomed: false
      }));
    } else {
      const scaleFactor = targetScale / zoomState.scale;
      const translateX = zoomState.translateX * scaleFactor;
      const translateY = zoomState.translateY * scaleFactor;

      setZoomState(prev => ({
        ...prev,
        scale: targetScale,
        translateX,
        translateY,
        isZoomed: targetScale > 1
      }));
    }
  }, [minScale, zoomState.scale, zoomState.translateX, zoomState.translateY]);

  const resetZoom = useCallback(() => {
    setZoomState(prev => ({
      ...prev,
      scale: 1,
      translateX: 0,
      translateY: 0,
      isZoomed: false,
      isZooming: false
    }));
  }, []);

  const setZoomLimits = useCallback((min: number, max: number) => {
    setZoomState(prev => ({
      ...prev,
      minScale: min,
      maxScale: max
    }));
  }, []);

  // Stop zooming state after animation
  useEffect(() => {
    if (zoomState.isZooming) {
      const timer = setTimeout(() => {
        setZoomState(prev => ({ ...prev, isZooming: false }));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [zoomState.isZooming]);

  // Context value
  const contextValue: PinchZoomContextType = {
    zoomState,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomLimits,
    isZoomable,
    setIsZoomable
  };

  return (
    <PinchZoomContext.Provider value={contextValue}>
      <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
        <RevolutionaryGestureEngine
          onPinch={handlePinchGesture}
          onPan={handlePanGesture}
          onDoubleTap={handleDoubleTapZoom}
          gestureThreshold={5}
          velocityThreshold={0.1}
          enableHaptics={true}
          className="h-full w-full"
        >
          {/* Zoomable content */}
          <motion.div
            className="origin-center"
            style={{
              scale: springScale,
              x: springTranslateX,
              y: springTranslateY,
              opacity,
              filter: `blur(${blur}px)`
            }}
          >
            {children}
          </motion.div>

          {/* Zoom controls overlay */}
          <AnimatePresence>
            {zoomState.isZoomed && (
              <motion.div
                className="absolute top-4 right-4 z-50 flex flex-col space-y-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <motion.button
                  onClick={zoomIn}
                  className="bg-black bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-80 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </motion.button>
                
                <motion.button
                  onClick={zoomOut}
                  className="bg-black bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-80 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </motion.button>
                
                <motion.button
                  onClick={resetZoom}
                  className="bg-black bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-80 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Zoom indicator */}
          <AnimatePresence>
            {zoomState.isZooming && (
              <motion.div
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <div className="bg-black bg-opacity-80 text-white px-4 py-2 rounded-full text-sm font-medium">
                  {Math.round(zoomState.scale * 100)}%
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Zoom gesture hint */}
          {!zoomState.isZoomed && isZoomable && (
            <motion.div
              className="absolute top-4 left-4 z-40 pointer-events-none"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.6, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="bg-blue-500 text-white p-2 rounded-lg text-xs">
                <div className="flex items-center space-x-1">
                  <span>🤏</span>
                  <span>Pinch to zoom</span>
                </div>
              </div>
            </motion.div>
          )}
        </RevolutionaryGestureEngine>
      </div>
    </PinchZoomContext.Provider>
  );
};

// Enhanced zoomable image component
export const ZoomableImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = '' }) => {
  return (
    <PinchZoomProvider className={className}>
      <img src={src} alt={alt} className="w-full h-full object-contain" />
    </PinchZoomProvider>
  );
};

// Enhanced zoomable card component
export const ZoomableCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <PinchZoomProvider className={className}>
      <div className="w-full h-full">
        {children}
      </div>
    </PinchZoomProvider>
  );
};

export default PinchZoomProvider;