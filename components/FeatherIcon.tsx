import React from 'react';

const MorphicIcon: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => {
  return (
    <div className={className}>
        <svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg' className="w-full h-full" aria-hidden="true">
            <circle cx='50' cy='50' r='50' fill='black'/>
            <circle cx='35' cy='50' r='8' fill='white'/>
            <circle cx='65' cy='50' r='8' fill='white'/>
        </svg>
    </div>
  );
};

export default MorphicIcon;
