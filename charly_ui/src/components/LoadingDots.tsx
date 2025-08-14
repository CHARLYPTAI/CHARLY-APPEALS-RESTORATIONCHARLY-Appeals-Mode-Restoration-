// 🍎 Loading Dots - Apple Elegance
// Three dots, perfect timing, infinite delight

import React from 'react';
import { NEUTRAL_COLORS } from '../design/colors';

interface LoadingDotsProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({ 
  color = NEUTRAL_COLORS.GRAY_600,
  size = 'md' 
}) => {
  const dotSize = getDotSize(size);
  
  return (
    <div style={styles.container}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            ...styles.dot,
            backgroundColor: color,
            width: dotSize,
            height: dotSize,
            animationDelay: `${i * 160}ms`, // 400ms cycle / 3 dots
          }}
        />
      ))}
    </div>
  );
};

const getDotSize = (size: LoadingDotsProps['size']) => {
  switch (size) {
    case 'sm': return '3px';
    case 'md': return '4px';
    case 'lg': return '6px';
    default: return '4px';
  }
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  
  dot: {
    borderRadius: '50%',
    animation: 'loadingDots 1.4s infinite',
  },
} as const;