import React, { useState, useEffect, useRef, UIEvent } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  height: number; // Viewport height
  className?: string;
}

export function VirtualList<T>({ items, itemHeight, renderItem, height, className = '' }: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
  const endIndex = Math.min(items.length - 1, Math.floor((scrollTop + height) / itemHeight) + 2);

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // If item list is short, render standard to preserve layouts or search accessibility
  if (items.length <= 200) {
    return (
      <div className={className}>
        {items.map((item, index) => renderItem(item, index))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto ${className}`}
      style={{ height: `${height}px` }}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)`, position: 'absolute', left: 0, right: 0, top: 0 }}>
          {visibleItems.map((item, idx) => renderItem(item, startIndex + idx))}
        </div>
      </div>
    </div>
  );
}
