import React from 'react';
import { useGetStorageStats } from '@workspace/api-client-react';
import { formatBytes } from '@/lib/format';
import { HardDrive, Folder, File, UploadCloud, Activity } from 'lucide-react';

export default function Stats() {
  const { data: stats, isLoading } = useGetStorageStats();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full text-primary">
        <Activity className="w-8 h-8 animate-pulse" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Storage",
      value: formatBytes(stats?.totalBytes),
      icon: <HardDrive className="w-5 h-5 text-primary" />,
      color: "border-primary"
    },
    {
      title: "Total Files",
      value: stats?.totalFiles?.toLocaleString() || "0",
      icon: <File className="w-5 h-5 text-blue-400" />,
      color: "border-blue-400/50"
    },
    {
      title: "Directories",
      value: stats?.totalFolders?.toLocaleString() || "0",
      icon: <Folder className="w-5 h-5 text-yellow-400" />,
      color: "border-yellow-400/50"
    },
    {
      title: "Recent Uploads",
      value: stats?.recentUploads?.toLocaleString() || "0",
      icon: <UploadCloud className="w-5 h-5 text-green-400" />,
      color: "border-green-400/50"
    }
  ];

  return (
    <div className="flex flex-col h-full w-full relative z-10 overflow-hidden">
      <div className="px-8 py-6 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-20">
        <h1 className="text-xl font-bold font-mono tracking-wider glow-text-primary uppercase flex items-center gap-2">
          <Activity className="w-5 h-5" /> Storage Telemetry
        </h1>
        <p className="text-sm text-muted-foreground mt-1">System wide resource utilization</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, i) => (
            <div key={i} className={`bg-card border ${card.color} rounded-lg p-6 relative overflow-hidden group hover:bg-card/80 transition-all`}>
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-md bg-secondary/50">
                  {card.icon}
                </div>
                <h3 className="font-mono text-sm text-muted-foreground uppercase tracking-widest">{card.title}</h3>
              </div>
              <div className="text-4xl font-bold font-sans tracking-tight">
                {card.value}
              </div>
            </div>
          ))}
        </div>
        
        {/* Decorative elements representing terminal output */}
        <div className="mt-12 bg-black border border-border rounded-lg p-4 font-mono text-xs text-green-500/70 h-64 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black pointer-events-none z-10"></div>
          <div className="animate-in slide-in-from-bottom-[50%] duration-1000 opacity-50">
            {Array.from({length: 20}).map((_, i) => (
              <div key={i} className="mb-1 opacity-70 flex">
                <span className="text-muted-foreground w-24">[{new Date().toISOString().split('T')[1].slice(0,-1)}]</span>
                <span className="text-blue-400 mr-2">SYS</span> 
                {Math.random() > 0.5 ? 'Sector scan complete. Integrity verified.' : `Reallocating space for partition ${Math.floor(Math.random() * 100)}...`}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
