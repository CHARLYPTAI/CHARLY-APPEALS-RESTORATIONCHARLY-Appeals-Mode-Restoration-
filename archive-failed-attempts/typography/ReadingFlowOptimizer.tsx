import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTypography } from './TypographyProvider';

interface ReadingFlowMetrics {
  readingTime: number;
  complexity: 'low' | 'medium' | 'high';
  optimalLineLength: number;
  recommendedPauses: number[];
  scanPattern: 'F' | 'Z' | 'layer-cake';
}

interface ReadingFlowOptimizerProps {
  children: React.ReactNode;
  content: string;
  contentType?: 'article' | 'list' | 'form' | 'data' | 'navigation';
  priority?: 'primary' | 'secondary' | 'tertiary';
  enableOptimizations?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const ReadingFlowOptimizer: React.FC<ReadingFlowOptimizerProps> = ({
  children,
  content,
  contentType = 'article',
  priority = 'primary',
  enableOptimizations = true,
  className = '',
  style = {},
}) => {
  const { getSpacing, isAccessibilityMode } = useTypography();
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-50px' });
  const [readingMetrics, setReadingMetrics] = useState<ReadingFlowMetrics | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const calculateReadingMetrics = useCallback((text: string): ReadingFlowMetrics => {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    const avgWordsPerMinute = isAccessibilityMode ? 150 : 200;
    
    const readingTime = Math.ceil(words / avgWordsPerMinute);
    
    let complexity: ReadingFlowMetrics['complexity'] = 'low';
    if (avgWordsPerSentence > 20 || words > 500) complexity = 'high';
    else if (avgWordsPerSentence > 15 || words > 200) complexity = 'medium';
    
    const optimalLineLength = contentType === 'article' ? 
      Math.min(75, Math.max(45, Math.floor(words / 10))) : 
      contentType === 'form' ? 40 : 60;
    
    const recommendedPauses = [];
    const pauseInterval = complexity === 'high' ? 150 : 
                         complexity === 'medium' ? 200 : 300;
    
    for (let i = pauseInterval; i < words; i += pauseInterval) {
      recommendedPauses.push(i);
    }
    
    const scanPattern = contentType === 'article' ? 'F' : 
                       contentType === 'list' ? 'Z' : 'layer-cake';
    
    return {
      readingTime,
      complexity,
      optimalLineLength,
      recommendedPauses,
      scanPattern,
    };
  }, [contentType, isAccessibilityMode]);

  useEffect(() => {
    if (content) {
      const metrics = calculateReadingMetrics(content);
      setReadingMetrics(metrics);
    }
  }, [content, calculateReadingMetrics]);

  useEffect(() => {
    if (!enableOptimizations || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsReading(true);
          
          const element = entry.target as HTMLElement;
          const rect = element.getBoundingClientRect();
          const progress = Math.max(0, Math.min(1, 
            (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
          ));
          setReadingProgress(progress);
        } else {
          setIsReading(false);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    observer.observe(containerRef.current);

    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, 
        (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
      ));
      setReadingProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enableOptimizations]);

  const getOptimalStyles = (): React.CSSProperties => {
    if (!readingMetrics) return {};

    const baseSpacing = getSpacing('md');
    const lineHeight = readingMetrics.complexity === 'high' ? 1.6 : 
                      readingMetrics.complexity === 'medium' ? 1.5 : 1.4;

    const marginBottom = contentType === 'article' ? baseSpacing * 1.5 : baseSpacing;
    const paragraphSpacing = readingMetrics.complexity === 'high' ? 
      baseSpacing * 1.8 : baseSpacing * 1.2;

    return {
      maxWidth: `${readingMetrics.optimalLineLength}ch`,
      lineHeight,
      marginBottom: `${marginBottom}px`,
      '--paragraph-spacing': `${paragraphSpacing}px`,
      '--reading-complexity': readingMetrics.complexity,
      '--scan-pattern': readingMetrics.scanPattern,
      wordSpacing: readingMetrics.complexity === 'high' ? '0.1em' : 'normal',
      textAlign: contentType === 'article' ? 'left' : 'inherit',
    };
  };

  const getScanPatternStyles = (): React.CSSProperties => {
    if (!readingMetrics) return {};

    switch (readingMetrics.scanPattern) {
      case 'F':
        return {
          paddingLeft: `${getSpacing('sm')}px`,
          borderLeft: `2px solid var(--color-primary-light)`,
        };
      case 'Z':
        return {
          display: 'flex',
          flexDirection: 'column',
          gap: `${getSpacing('xs')}px`,
        };
      case 'layer-cake':
        return {
          padding: `${getSpacing('sm')}px ${getSpacing('md')}px`,
          borderRadius: '8px',
          backgroundColor: 'var(--color-background-secondary)',
        };
      default:
        return {};
    }
  };

  const readingProgressStyles: React.CSSProperties = {
    '--reading-progress': readingProgress,
    '--reading-active': isReading ? 1 : 0,
    filter: isReading ? 'none' : 'opacity(0.8)',
    transform: isReading ? 'none' : 'translateY(2px)',
  };

  const combinedStyles: React.CSSProperties = {
    ...getOptimalStyles(),
    ...getScanPatternStyles(),
    ...readingProgressStyles,
    ...style,
  };

  return (
    <motion.div
      ref={containerRef}
      className={`reading-flow-optimizer ${contentType} ${priority} ${className}`}
      style={combinedStyles}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isInView ? 1 : 0,
        y: isInView ? 0 : 20,
      }}
      transition={{ 
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
        delay: priority === 'primary' ? 0 : 
               priority === 'secondary' ? 0.1 : 0.2,
      }}
    >
      {readingMetrics && enableOptimizations && (
        <div className="reading-progress-indicator" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${readingProgress * 100}%`,
          height: '2px',
          backgroundColor: 'var(--color-primary)',
          transition: 'width 0.3s ease',
          opacity: isReading ? 1 : 0,
        }} />
      )}
      
      {children}
      
      {readingMetrics && enableOptimizations && (
        <div className="reading-metadata" style={{
          marginTop: `${getSpacing('sm')}px`,
          fontSize: '0.75rem',
          color: 'var(--color-text-tertiary)',
          opacity: 0.6,
        }}>
          <span>{readingMetrics.readingTime} min read</span>
          <span style={{ margin: '0 8px' }}>•</span>
          <span>{readingMetrics.complexity} complexity</span>
        </div>
      )}
    </motion.div>
  );
};


export default ReadingFlowOptimizer;