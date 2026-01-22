import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating, maxRating = 5, size = 'md', interactive = false, onChange }) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };
  
  const iconSize = sizeClasses[size] || sizeClasses.md;
  
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const fillPercentage = Math.max(0, Math.min(100, (rating - i) * 100));
        
        return (
          <div 
            key={i} 
            className="relative"
            onClick={() => interactive && onChange?.(starValue)}
          >
            {/* Background empty star */}
            <Star className={`${iconSize} text-zinc-700 ${interactive ? 'cursor-pointer' : ''}`} />
            
            {/* Foreground filled star with gradient mask */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercentage}%` }}
            >
              <Star 
                className={`${iconSize} text-amber-400 fill-amber-400 ${interactive ? 'cursor-pointer' : ''}`} 
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}