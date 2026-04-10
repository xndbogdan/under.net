'use client';

import { useEffect, useState } from 'react';
import { DropdownMenu } from './Shared/DropdownMenu';
import { DesktopContainer } from './DesktopContainer';
import { DesktopContextMenu } from './DesktopContextMenu';
import { useStore } from '@/lib/state';
import { wallpapers } from '@/lib/wallpapers';

export const Desktop = () => {
  const windowTitle = 'under.net';
  const { wallpaper, setWallpaper } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedId = localStorage.getItem('wallpaper-id');
    if (storedId) {
      const found = wallpapers.find((w) => w.id === parseInt(storedId));
      if (found) setWallpaper(found);
    }
    setMounted(true);
  }, [setWallpaper]);

  return (
    <div className={`flex-1 min-h-screen font-chicago ${mounted ? wallpaper.className : 'bg-gray-mac'}`}>
      <DropdownMenu
        windowTitle={windowTitle}
      />
      <DesktopContainer
        windowTitle={windowTitle}
      />
      <DesktopContextMenu />
    </div>
  );
}
