import React from 'react';
import { cn } from '../../utils/cn';

const Avatar = React.forwardRef(({
  src,
  alt,
  size = 'md',
  className = '',
  status,
  ...props
}, ref) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
    '2xl': 'h-20 w-20',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative inline-block" ref={ref} {...props}>
      <div
        className={cn(
          'relative inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-600 overflow-hidden',
          sizes[size],
          className
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={cn(
            'h-full w-full flex items-center justify-center text-sm font-medium',
            src ? 'hidden' : 'flex'
          )}
        >
          {getInitials(alt)}
        </div>
      </div>
      {status && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 block rounded-full ring-2 ring-white',
            statusColors[status],
            size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'
          )}
        />
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

export default Avatar; 