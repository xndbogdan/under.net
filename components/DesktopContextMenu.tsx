'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/lib/state';

export const DesktopContextMenu = () => {
  const [menu, setMenu] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });
  const { windows, setWindows } = useStore();
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDesktopBackground = (target: Element) => {
    return !target.closest('.os-window') &&
      !target.closest('.os-icon') &&
      !target.closest('[id^="dock-icon"]') &&
      !target.closest('#dropdown') &&
      !target.closest('.bg-gray-mac.border-b');
  };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!isDesktopBackground(target)) return;
      e.preventDefault();

      const menuWidth = 176;
      const menuHeight = 30;
      const x = e.clientX + menuWidth > window.innerWidth ? e.clientX - menuWidth : e.clientX;
      const y = e.clientY + menuHeight > window.innerHeight ? e.clientY - menuHeight : e.clientY;

      setMenu({ visible: true, x, y });
    };

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(m => ({ ...m, visible: false }));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(m => ({ ...m, visible: false }));
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as Element;

      // Dismiss if menu is visible and touch is outside it
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenu(m => ({ ...m, visible: false }));
        return;
      }

      if (!isDesktopBackground(target)) return;
      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;
      touchTimerRef.current = setTimeout(() => {
        const menuWidth = 176;
        const menuHeight = 30;
        const x = startX + menuWidth > window.innerWidth ? startX - menuWidth : startX;
        const y = startY + menuHeight > window.innerHeight ? startY - menuHeight : startY;
        setMenu({ visible: true, x, y });
      }, 500);
    };
    const handleTouchEnd = () => { clearTimeout(touchTimerRef.current); };
    const handleTouchMove = () => { clearTimeout(touchTimerRef.current); };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchmove', handleTouchMove);
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const openWallpaperWindow = () => {
    setMenu(m => ({ ...m, visible: false }));
    setWindows(windows.map((w, index) =>
      index === 4 ? { ...w, focused: true, closed: false, minimized: false } : { ...w, focused: false }
    ));
  };

  if (!menu.visible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-gray-mac shadow-mac-os border border-black"
      style={{ left: menu.x, top: menu.y }}
    >
      <ul className="text-xs">
        <li>
          <span
            className="block py-1 px-4 hover:text-white hover:bg-black cursor-point"
            onMouseDown={openWallpaperWindow}
          >
            Change Wallpaper
          </span>
        </li>
      </ul>
    </div>
  );
};
