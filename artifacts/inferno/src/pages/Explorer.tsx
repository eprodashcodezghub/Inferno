import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useListItems, useCreateItem, getListItemsQueryKey } from '@workspace/api-client-react';
import { PathBar } from '@/components/PathBar';
import { ItemGrid } from '@/components/ItemGrid';
import { UploadManager } from '@/components/UploadManager';
import { Search, FolderPlus, Upload, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function Explorer() {
  const params = useParams();
  const folderId = params.id ? parseInt(params.id, 10) : null;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: items = [], isLoading } = useListItems({ 
    parentId: search ? undefined : folderId, // If searching, ignore parentId (full-tree search depending on API implementation)
    search: search || undefined
  });

  const createItem = useCreateItem();

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await createItem.mutateAsync({
        data: {
          name: newFolderName.trim(),
          type: 'folder',
          parentId: folderId,
        }
      });
      toast.success('Folder created');
      setNewFolderOpen(false);
      setNewFolderName('');
      queryClient.invalidateQueries({ queryKey: getListItemsQueryKey({ parentId: folderId }) });
    } catch (err) {
      toast.error('Failed to create folder');
    }
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div className="flex flex-col h-full w-full relative z-10">
          <PathBar currentFolderId={folderId} />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setNewFolderOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-mono bg-secondary text-foreground hover:bg-secondary/80 hover:text-primary transition-all border border-border"
              >
                <FolderPlus className="w-4 h-4" />
                New Folder
              </button>
              <button 
                onClick={() => setUploadOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-mono bg-secondary text-foreground hover:bg-secondary/80 hover:text-primary transition-all border border-border"
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
            </div>
            
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-card border border-border rounded-full pl-9 pr-4 py-1.5 text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:opacity-50"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <ItemGrid items={items} parentId={folderId} isLoading={isLoading} />
          </div>

          {/* New Folder Dialog */}
          <Dialog.Root open={newFolderOpen} onOpenChange={setNewFolderOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card border border-border shadow-2xl rounded-lg p-6 z-50 animate-in zoom-in-95">
                <Dialog.Title className="font-mono text-lg font-bold mb-4 flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-primary" /> Create Folder
                </Dialog.Title>
                <form onSubmit={handleCreateFolder} className="flex flex-col gap-4">
                  <input
                    autoFocus
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="Folder name..."
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={() => setNewFolderOpen(false)} className="px-4 py-2 text-sm font-mono text-muted-foreground hover:text-foreground">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 text-sm font-mono bg-primary text-primary-foreground rounded-md hover:bg-primary/90 shadow-md shadow-primary/20">
                      Create
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          {/* Upload Dialog */}
          <Dialog.Root open={uploadOpen} onOpenChange={setUploadOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border shadow-2xl rounded-lg p-6 z-50 animate-in zoom-in-95">
                <Dialog.Title className="font-mono text-lg font-bold mb-4">Upload to current folder</Dialog.Title>
                <UploadManager parentId={folderId} onClose={() => setUploadOpen(false)} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="min-w-[160px] bg-popover border border-border shadow-xl rounded-md p-1 z-50 font-mono text-sm animate-in fade-in">
          <ContextMenu.Item 
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-secondary outline-none cursor-pointer rounded-sm text-foreground focus:bg-secondary"
            onSelect={() => setNewFolderOpen(true)}
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </ContextMenu.Item>
          <ContextMenu.Item 
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-secondary outline-none cursor-pointer rounded-sm text-foreground focus:bg-secondary"
            onSelect={() => setUploadOpen(true)}
          >
            <Upload className="w-4 h-4" />
            Upload File
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
