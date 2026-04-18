import React, { useEffect, useRef, useState } from 'react';

type Variant = 'fade-up' | 'fade-scale' | 'fade';

interface RevealProps {
  children: React.ReactNode;
  variant?: Variant;
  delay?: number; // ms
  className?: string;
  once?: boolean;
}

/**
 * Wraps content and animates it into view when it enters the viewport.
 * Respects prefers-reduced-motion (renders content immediately, no transform).
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  variant = 'fade-up',
  delay = 0,
  className = '',
  once = true,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={`reveal reveal-${variant} ${visible ? 'reveal-in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
};

export default Reveal;
