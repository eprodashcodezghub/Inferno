import React from 'react';
import { useGetItemPath } from '@workspace/api-client-react';
import { Link } from 'wouter';

export function PathBar({ currentFolderId }: { currentFolderId?: number | null }) {
  const { data: pathSegments = [], isLoading } = useGetItemPath(currentFolderId as number, {
    query: { 
      enabled: !!currentFolderId && currentFolderId > 0,
    }
  });

  const validSegments = pathSegments.filter(s => s.type !== 'root');

  return (
    <div className="flex items-center font-mono text-sm px-6 py-3 bg-card border-b border-border shadow-sm overflow-x-auto whitespace-nowrap scrollbar-none select-none">
      <Link href="/" className="text-primary font-bold glow-text-primary uppercase tracking-widest hover:brightness-125 transition-all">
        inferno
      </Link>
      <span className="text-muted-foreground mx-2 font-bold opacity-50">--</span>
      
      {validSegments.length === 0 && (
        <span className="text-muted-foreground mx-1 font-bold opacity-50">|</span>
      )}

      {validSegments.map((seg, idx) => (
        <React.Fragment key={seg.id || `seg-${idx}`}>
          <span className="text-muted-foreground mx-2 font-bold opacity-50">|</span>
          <Link 
            href={seg.id ? `/folder/${seg.id}` : '/'} 
            className="text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            {seg.name}
          </Link>
        </React.Fragment>
      ))}
      
      {isLoading && (
        <span className="ml-4 flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
        </span>
      )}
    </div>
  );
}
