import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Item, useUpdateItem, useDeleteItem, useCreateItem, getListItemsQueryKey } from '@workspace/api-client-react';
import { formatBytes, formatDate } from '@/lib/format';
import { getFileIcon } from './ItemIcon';
import * as ContextMenu from '@radix-ui/react-context-menu';
import * as Dialog from '@radix-ui/react-dialog';
import { MoreVertical, Edit2, Trash2, FolderPlus, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ItemGridProps {
  items: Item[];
  parentId: number | null;
  isLoading?: boolean;
}

export function ItemGrid({ items, parentId, isLoading }: ItemGridProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDoubleClick = (item: Item) => {
    if (item.type === 'folder') {
      setLocation(`/folder/${item.id}`);
    } else if (item.objectPath) {
      window.open(`/api/storage${item.objectPath}`, '_blank');
    }
  };

  const openRename = (item: Item) => {
    setSelectedItem(item);
    setNewName(item.name);
    setRenameDialogOpen(true);
  };

  const submitRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !newName.trim()) return;
    try {
      await updateItem.mutateAsync({ id: selectedItem.id, data: { name: newName.trim() } });
      toast.success('Renamed successfully');
      setRenameDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: getListItemsQueryKey({ parentId }) });
    } catch (err) {
      toast.error('Failed to rename item');
    }
  };

  const openDelete = (item: Item) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const submitDelete = async () => {
    if (!selectedItem) return;
    try {
      await deleteItem.mutateAsync({ id: selectedItem.id });
      toast.success('Deleted successfully');
      setDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: getListItemsQueryKey({ parentId }) });
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex flex-wrap gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="w-48 h-16 bg-card border border-border rounded-md animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50 p-12 text-center h-full">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <FolderPlus className="w-8 h-8" />
        </div>
        <p className="font-mono text-sm tracking-widest uppercase">Folder is Empty</p>
        <p className="text-sm mt-2 max-w-sm">Right-click anywhere or use the tools above to create folders and upload files.</p>
      </div>
    );
  }

  // Sort: folders first, then alphabetically
  const sortedItems = [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 content-start pb-32">
        {sortedItems.map(item => (
          <ContextMenu.Root key={item.id}>
            <ContextMenu.Trigger asChild>
              <div 
                className="group flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer shadow-sm hover:shadow-primary/5 active:scale-95"
                onDoubleClick={() => handleDoubleClick(item)}
              >
                <div className="shrink-0 w-10 h-10 rounded bg-secondary flex items-center justify-center">
                  {getFileIcon(item, "w-5 h-5")}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground truncate">
                    {item.type === 'file' && item.size ? (
                      <span>{formatBytes(item.size)}</span>
                    ) : (
                      <span>{item.type === 'folder' ? 'DIR' : 'FILE'}</span>
                    )}
                    <span>•</span>
                    <span>{formatDate(item.updatedAt).split(',')[0]}</span>
                  </div>
                </div>
              </div>
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
              <ContextMenu.Content className="min-w-[180px] bg-popover border border-border shadow-xl rounded-md p-1 z-50 font-mono text-sm animate-in fade-in zoom-in-95 duration-100">
                <ContextMenu.Item 
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-secondary outline-none cursor-pointer rounded-sm text-foreground focus:bg-secondary"
                  onSelect={() => handleDoubleClick(item)}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </ContextMenu.Item>
                {item.type === 'file' && item.objectPath && (
                  <ContextMenu.Item 
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-secondary outline-none cursor-pointer rounded-sm text-foreground focus:bg-secondary"
                    onSelect={() => window.open(`/api/storage${item.objectPath}`, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </ContextMenu.Item>
                )}
                <ContextMenu.Separator className="h-px bg-border my-1" />
                <ContextMenu.Item 
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-secondary outline-none cursor-pointer rounded-sm text-foreground focus:bg-secondary"
                  onSelect={() => openRename(item)}
                >
                  <Edit2 className="w-4 h-4" />
                  Rename
                </ContextMenu.Item>
                <ContextMenu.Item 
                  className="flex items-center gap-2 px-2 py-1.5 outline-none cursor-pointer rounded-sm text-destructive focus:bg-destructive focus:text-destructive-foreground transition-colors"
                  onSelect={() => openDelete(item)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Portal>
          </ContextMenu.Root>
        ))}
      </div>

      {/* Rename Dialog */}
      <Dialog.Root open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card border border-border shadow-2xl rounded-lg p-6 z-50 animate-in zoom-in-95">
            <Dialog.Title className="font-mono text-lg font-bold mb-4">Rename Item</Dialog.Title>
            <form onSubmit={submitRename} className="flex flex-col gap-4">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="New name..."
              />
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setRenameDialogOpen(false)} className="px-4 py-2 text-sm font-mono text-muted-foreground hover:text-foreground">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-mono bg-primary text-primary-foreground rounded-md hover:bg-primary/90 shadow-md shadow-primary/20">
                  Save
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Dialog */}
      <Dialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card border border-destructive/50 shadow-2xl shadow-destructive/10 rounded-lg p-6 z-50 animate-in zoom-in-95">
            <Dialog.Title className="font-mono text-lg font-bold text-destructive mb-2">Delete Item</Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete <span className="font-mono text-foreground font-bold">{selectedItem?.name}</span>? This action cannot be undone.
            </Dialog.Description>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteDialogOpen(false)} className="px-4 py-2 text-sm font-mono text-muted-foreground hover:text-foreground">
                Cancel
              </button>
              <button onClick={submitDelete} className="px-4 py-2 text-sm font-mono bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 shadow-md shadow-destructive/20">
                Delete Forever
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
