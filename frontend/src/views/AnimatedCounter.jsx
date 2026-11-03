import React, { useEffect, useState, useRef } from 'react';

/**
 * Ultra-smooth easing function (easeOutExpo)
 */
function easeOutExpo(x) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

/**
 * AnimatedCounter component for rolling numbers and currency values
 */
export default function AnimatedCounter({ 
  value, 
  duration = 1200, 
  prefix = '', 
  suffix = '', 
  decimals = 0,
  isCurrency = false,
  className = ''
}) {
  // Parse target numerical value
  const parseNumeric = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    // Extract number from formatted string like "₹ 7423.88 Cr" or "89,245"
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const targetNum = parseNumeric(value);
  const [displayNum, setDisplayNum] = useState(0);
  const prevNumRef = useRef(0);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const startVal = prevNumRef.current;
    const endVal = targetNum;

    if (startVal === endVal && displayNum === endVal) {
      return;
    }

    const startTimestamp = performance.now();

    const animate = (currentTimestamp) => {
      const elapsed = currentTimestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      
      const current = startVal + (endVal - startVal) * easedProgress;
      setDisplayNum(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayNum(endVal);
        prevNumRef.current = endVal;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetNum, duration]);

  // Format display based on format rules
  const formatOutput = () => {
    if (typeof value === 'string' && (value.includes('Cr') || value.includes('Lakh') || value.includes('L') || value.includes('k'))) {
      // Re-apply original unit suffix from value
      const hasCr = value.includes('Cr');
      const hasLakh = value.includes('Lakh') || value.includes(' L');
      const hasK = value.includes('k') || value.includes('K');
      const hasRupee = value.includes('₹');

      let numStr = displayNum.toLocaleString('en-IN', {
        minimumFractionDigits: decimals || 2,
        maximumFractionDigits: decimals || 2
      });

      let formatted = `${hasRupee ? '₹ ' : ''}${numStr}`;
      if (hasCr) formatted += ' Cr';
      else if (hasLakh) formatted += ' Lakh';
      else if (hasK) formatted += 'k';
      return formatted;
    }

    // Standard number format
    const formattedNum = decimals > 0
      ? displayNum.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : Math.round(displayNum).toLocaleString('en-IN');

    return `${prefix}${formattedNum}${suffix}`;
  };

  return (
    <span className={`inline-block tabular-nums transition-all ${className}`}>
      {formatOutput()}
    </span>
  );
}
