import React from 'react';
import { useListRecentItems } from '@workspace/api-client-react';
import { ItemGrid } from '@/components/ItemGrid';
import { Clock } from 'lucide-react';

export default function Recent() {
  const { data: items = [], isLoading } = useListRecentItems({ limit: 50 });

  return (
    <div className="flex flex-col h-full w-full relative z-10 overflow-hidden">
      <div className="px-8 py-6 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-20 flex items-center gap-3">
        <Clock className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold font-mono tracking-wider">RECENT ACTIVITY</h1>
          <p className="text-sm text-muted-foreground">Latest modified and uploaded files</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <ItemGrid items={items} parentId={null} isLoading={isLoading} />
      </div>
    </div>
  );
}
