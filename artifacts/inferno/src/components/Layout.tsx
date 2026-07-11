import React from 'react';
import { Sidebar } from './Sidebar';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
        
        {children}
      </main>
    </div>
  );
}
