import { create } from 'zustand'
import { Playlist, Wallpaper } from './types';
import { playlists } from './tracklist';
import { wallpapers } from './wallpapers';


type Store = {
  icons: { focused: boolean; clicks: number; dragging: boolean }[],
  setIcons: (icons: { focused: boolean; clicks: number; dragging: boolean }[]) => void
  playlist: Playlist,
  setPlaylist: (playlist: Playlist) => void,
  currentVolume: number,
  setCurrentVolume: (volume: number) => void,
  windows: { focused: boolean; closed: boolean; minimized: boolean }[],
  setWindows: (windows: { focused: boolean; closed: boolean; minimized: boolean }[]) => void,
  wallpaper: Wallpaper,
  setWallpaper: (wallpaper: Wallpaper) => void,
}

const useStore = create<Store>()((set) => ({
  icons: Array(5).fill({ focused: false, clicks: 0, dragging: false }),
  setIcons: (icons) => set({ icons }),
  playlist: (() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('playlist-id');
      if (storedId) {
        const found = playlists.find((p) => p.id === parseInt(storedId));
        if (found) return found;
      }
    }
    return playlists[0];
  })(),
  setPlaylist: (playlist) => {
    set({ playlist });
    if (typeof window !== 'undefined') {
      localStorage.setItem('playlist-id', playlist.id.toString());
    }
  },
  currentVolume:
    typeof window !== 'undefined' && localStorage.getItem('volume')
      ? parseFloat(localStorage.getItem('volume')!)
      : 1,
  setCurrentVolume: (volume) => {
    set({ currentVolume: volume });
    if (typeof window !== 'undefined') {
      localStorage.setItem('volume', volume.toString());
    }
  },
  windows: [
    { focused: false, closed: false, minimized: false },
    ...Array(4).fill({ focused: false, closed: true, minimized: false })
  ],
  setWindows: (windows) => set({ windows }),
  wallpaper: wallpapers[0],
  setWallpaper: (wallpaper) => {
    set({ wallpaper });
    if (typeof window !== 'undefined') {
      localStorage.setItem('wallpaper-id', wallpaper.id.toString());
    }
  },
}))

export { useStore }