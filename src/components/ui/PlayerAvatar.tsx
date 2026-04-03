import React from 'react';

function hashColor(name: string): string {
  const colors = [
    '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6BFF',
    '#FF9A3C', '#00C8D4', '#A855F7', '#EC4899', '#10B981',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xFFFFFF;
  }
  return colors[Math.abs(hash) % colors.length];
}

interface PlayerAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function PlayerAvatar({ name, avatarUrl, size = 'md', className = '' }: PlayerAvatarProps) {
  const color = hashColor(name);
  const initials = name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  if (avatarUrl) {
    return (
      <div
        className={`rounded-full overflow-hidden shrink-0 ${sizes[size]} ${className}`}
      >
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-black shrink-0 ${sizes[size]} ${className}`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}
