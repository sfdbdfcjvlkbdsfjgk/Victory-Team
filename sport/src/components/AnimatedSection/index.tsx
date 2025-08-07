import React, { useState, useRef, useEffect } from 'react';
import './index.css';

interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' | 'bounceIn' | 'slideInUp' | 'zoomIn' | 'pulse';
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  animation = 'fadeInUp',
  delay = 0,
  duration = 0.6,
  className = '',
  threshold = 0.1,
  triggerOnce = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!hasTriggered || !triggerOnce) {
              setTimeout(() => {
                setIsVisible(true);
                if (triggerOnce) {
                  setHasTriggered(true);
                }
              }, delay * 1000);
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin: '50px'
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [delay, threshold, triggerOnce, hasTriggered]);

  return (
    <div
      ref={elementRef}
      className={`animated-section ${animation} ${isVisible ? 'animate' : ''} ${className}`}
      style={{
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedSection; 