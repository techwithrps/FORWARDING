import React from 'react';
import { cn } from '@/lib/utils';

/**
 * HelloEffect
 * 
 * Signature Apple-inspired cursive handwriting animation component.
 * Writes each page's signature name stroke-by-stroke with iridescent
 * royal blue-indigo-purple gradient styling and speed scaling.
 * 
 * @param {string} word - Page or greeting text to write (e.g. "goods receipt", "container booking", "gr searching")
 * @param {number} speed - Multiplier for animation speed (e.g. speed={2} writes at 2x speed)
 * @param {string} className - Additional CSS classes
 * @param {boolean} useGradient - Whether to use the signature iridescent blue-indigo-purple gradient (default true)
 * @param {function} onAnimationComplete - Callback when the handwriting animation finishes
 */
export function HelloEffect({
  word = 'hello',
  speed = 2,
  className,
  useGradient = true,
  onAnimationComplete,
  ...props
}) {
  const displayWord = String(word || 'hello').trim().toLowerCase();
  const safeSpeed = Math.max(0.1, Number(speed) || 1);
  const duration = (1.4 / safeSpeed).toFixed(2);

  return (
    <div
      className={cn('relative inline-flex items-center justify-center py-1 select-none w-full', className)}
      {...props}
    >
      <span
        key={displayWord}
        onAnimationEnd={onAnimationComplete}
        className={cn(
          'font-apple-script text-5xl sm:text-6xl md:text-7xl font-bold lowercase tracking-wide drop-shadow-xs inline-block text-center leading-none',
          useGradient ? 'hello-effect-gradient hello-effect-text' : 'text-foreground'
        )}
        style={{
          '--hello-duration': `${duration}s`,
        }}
      >
        {displayWord}
      </span>
    </div>
  );
}

export default HelloEffect;
