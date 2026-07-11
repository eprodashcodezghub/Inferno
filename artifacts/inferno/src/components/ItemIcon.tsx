import React, { useState } from 'react';
import { Folder, File, FileText, Image, Video, Music, Archive, Code, Search } from 'lucide-react';
import { Item } from '@workspace/api-client-react';

export function getFileIcon(item: Item, className?: string) {
  if (item.type === 'folder') {
    return <Folder className={`fill-primary/20 text-primary ${className}`} />;
  }

  const mime = item.mimeType || '';
  if (mime.startsWith('image/')) return <Image className={`text-blue-400 ${className}`} />;
  if (mime.startsWith('video/')) return <Video className={`text-purple-400 ${className}`} />;
  if (mime.startsWith('audio/')) return <Music className={`text-yellow-400 ${className}`} />;
  if (mime.includes('zip') || mime.includes('tar') || mime.includes('compressed')) return <Archive className={`text-orange-400 ${className}`} />;
  if (mime.includes('json') || mime.includes('javascript') || mime.includes('html') || mime.includes('css')) return <Code className={`text-green-400 ${className}`} />;
  
  return <FileText className={`text-muted-foreground ${className}`} />;
}
