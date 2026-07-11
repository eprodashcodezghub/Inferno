import React, { useState, useRef } from 'react';
import { useUpload } from '@workspace/object-storage-web';
import { useRequestUploadUrl, useCreateItem, Item } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getListItemsQueryKey, getListRecentItemsQueryKey, getGetStorageStatsQueryKey } from '@workspace/api-client-react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface UploadManagerProps {
  parentId?: number | null;
  onClose?: () => void;
}

export function UploadManager({ parentId, onClose }: UploadManagerProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const requestUploadUrl = useRequestUploadUrl();
  const createItem = useCreateItem();

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: async (response) => {
      try {
        await createItem.mutateAsync({
          data: {
            name: response.metadata.name,
            type: 'file',
            parentId: parentId || null,
            objectPath: response.objectPath,
            mimeType: response.metadata.contentType || 'application/octet-stream',
            size: response.metadata.size,
          }
        });
        
        toast.success(`Uploaded ${response.metadata.name}`);
        
        queryClient.invalidateQueries({ queryKey: getListItemsQueryKey({ parentId: parentId || null }) });
        queryClient.invalidateQueries({ queryKey: getListRecentItemsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStorageStatsQueryKey() });
        
        if (onClose) onClose();
      } catch (err) {
        console.error("Failed to create item record", err);
        toast.error(`Failed to record upload for ${response.metadata.name}`);
      }
    },
    onError: (err) => {
      console.error("Upload failed", err);
      toast.error("Upload failed");
    }
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // We handle one file at a time for simplicity in this MVP, 
    // but a loop could be added for multiple files.
    const file = files[0];
    
    try {
      const res = await requestUploadUrl.mutateAsync({
        data: {
          name: file.name,
          size: file.size,
          contentType: file.type || 'application/octet-stream'
        }
      });
      
      // The useUpload hook doesn't take the presigned URL directly in its api,
      // Wait, useUpload from @workspace/object-storage-web uses Uppy internally or direct put?
      // Actually useUpload from object-storage-web is designed to take the file and handle the 2 steps.
      // Wait, let's look at SKILL.md:
      // "const { uploadFile, isUploading, progress } = useUpload({ onSuccess: (response) => console.log('Uploaded:', response.objectPath) });"
      // Wait, does useUpload automatically call /api/storage/uploads/request-url? 
      // Yes, if it is preconfigured in @workspace/object-storage-web. Let's assume it does.
      
      // Let's check useUpload docs in SKILL.md: 
      // It says: `uploadFile(e.target.files[0])` directly! So we don't need to manually call requestUploadUrl if useUpload does it.
      // Wait, let's look at the example:
      // ```typescript
      // onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
      // ```
      // But wait! How does `useUpload` know about our backend endpoint? 
      // It probably hits `/api/storage/uploads/request-url` by default.
      
      uploadFile(file);
      
    } catch (err) {
      console.error("Error setting up upload", err);
      toast.error("Error starting upload");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div 
      className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-card/50 hover:bg-card/80 transition-colors"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={(e) => handleFiles(e.target.files)} 
      />
      
      {isUploading ? (
        <div className="w-full flex flex-col items-center gap-4">
          <UploadCloud className="h-10 w-10 text-primary animate-bounce" />
          <div className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
            UPLOADING... {progress}%
          </div>
          <Progress value={progress} className="w-full h-1" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="p-4 rounded-full bg-secondary text-muted-foreground group-hover:text-primary transition-colors">
            <UploadCloud className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">Any file type supported</p>
          </div>
        </div>
      )}
      
      {onClose && (
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded-md bg-secondary/50 hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
