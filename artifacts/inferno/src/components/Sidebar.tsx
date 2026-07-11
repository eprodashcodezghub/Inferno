import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Folder, Activity, Clock, Database, ChevronRight, ChevronDown, UploadCloud, LogOut, User } from 'lucide-react';
import { useClerk, useUser } from '@clerk/react';
import { useListItems, Item } from '@workspace/api-client-react';
import { cn } from '@/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';
import { UploadManager } from './UploadManager';

function FolderTreeItem({ folder, level = 0, currentPath }: { folder: Item, level?: number, currentPath: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: children } = useListItems({ parentId: folder.id }, { query: { enabled: expanded } });
  const folders = children?.filter(c => c.type === 'folder') || [];

  const isActive = currentPath === `/folder/${folder.id}`;

  return (
    <div className="flex flex-col">
      <div 
        className={cn(
          "group flex items-center py-1.5 px-2 cursor-pointer text-sm font-mono transition-colors border-l-2 border-transparent",
          isActive ? "bg-secondary text-primary border-primary" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        <button 
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="p-0.5 hover:bg-card rounded-sm mr-1 text-muted-foreground group-hover:text-foreground"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <Folder className={cn("w-3.5 h-3.5 mr-2", isActive ? "text-primary fill-primary/20" : "text-muted-foreground")} />
        <Link href={`/folder/${folder.id}`} className="truncate flex-1">
          {folder.name}
        </Link>
      </div>
      {expanded && folders.map(f => (
        <FolderTreeItem key={f.id} folder={f} level={level + 1} currentPath={currentPath} />
      ))}
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const [uploadOpen, setUploadOpen] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();

  // Load root folders
  const { data: rootItems } = useListItems({ parentId: null });
  const rootFolders = rootItems?.filter(i => i.type === 'folder') || [];

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-full flex flex-col font-sans select-none">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center glow-box-primary text-primary-foreground">
            <Database className="w-5 h-5" />
          </div>
          <span className="font-mono font-bold text-xl tracking-widest text-foreground group-hover:text-primary transition-colors">
            INFERNO
          </span>
        </Link>
      </div>

      <div className="px-4 pb-4">
        <button 
          onClick={() => setUploadOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-md font-mono text-sm font-semibold tracking-wide transition-all shadow-md shadow-primary/20 active:scale-95"
        >
          <UploadCloud className="w-4 h-4" />
          UPLOAD FILE
        </button>
      </div>

      <Dialog.Root open={uploadOpen} onOpenChange={setUploadOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border shadow-2xl rounded-lg p-6 z-50 animate-in zoom-in-95">
            <Dialog.Title className="font-mono text-lg font-bold mb-4 text-foreground">Upload to Root</Dialog.Title>
            <UploadManager parentId={null} onClose={() => setUploadOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="flex-1 overflow-y-auto scrollbar-none py-2 flex flex-col gap-6">
        {/* Main Nav */}
        <div className="px-3 flex flex-col gap-1">
          <div className="px-3 mb-2 text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">Navigation</div>
          <Link href="/explorer">
            <div className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer",
              (location === '/explorer' || location === '/' || location.startsWith('/folder/')) ? "bg-primary/10 text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}>
              <Folder className="w-4 h-4" />
              Explorer
            </div>
          </Link>
          <Link href="/recent">
            <div className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer",
              location === '/recent' ? "bg-primary/10 text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}>
              <Clock className="w-4 h-4" />
              Recent Activity
            </div>
          </Link>
          <Link href="/stats">
            <div className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer",
              location === '/stats' ? "bg-primary/10 text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}>
              <Activity className="w-4 h-4" />
              Storage Stats
            </div>
          </Link>
        </div>

        {/* Tree */}
        <div className="flex flex-col">
          <div className="px-6 mb-2 text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">
            Structure
          </div>
          <div className="flex flex-col py-1">
            {rootFolders.map(folder => (
              <FolderTreeItem key={folder.id} folder={folder} currentPath={location} />
            ))}
            {rootFolders.length === 0 && (
              <div className="px-6 py-2 text-xs font-mono text-muted-foreground/50 italic">No folders yet</div>
            )}
          </div>
        </div>
      </div>

      {/* User section */}
      <div className="border-t border-sidebar-border p-3 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-3.5 h-3.5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-mono font-medium text-foreground truncate">
            {user?.firstName || user?.username || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground/60 truncate">
            {user?.emailAddresses[0]?.emailAddress || ''}
          </div>
        </div>
        <button
          onClick={() => signOut({ redirectUrl: (import.meta.env.BASE_URL || '/') })}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors flex-shrink-0"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
