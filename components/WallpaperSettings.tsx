'use client';

import { useStore } from '@/lib/state';
import { wallpapers } from '@/lib/wallpapers';

export const WallpaperSettings = () => {
  const { wallpaper, setWallpaper } = useStore();

  return (
    <div className="p-2 overflow-y-auto text-sm bg-white border border-black max-h-80">
      <div className="grid grid-cols-2 gap-3">
        {wallpapers.map((wp) => (
          <div
            key={wp.id}
            className={`cursor-point border-2 bg-gray-mac ${wallpaper.id === wp.id ? 'border-blue-500' : 'border-black'} hover:border-blue-400`}
            onMouseDown={() => setWallpaper(wp)}
          >
            <div
              className="w-full h-20 bg-cover bg-center"
              style={{ backgroundImage: `url(${wp.previewImage})` }}
            />
            <div className="text-xs p-1 border-t border-black">
              {wp.name} -{' '}
              {wp.authorUrl ? (
                <a
                  href={wp.authorUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 hover:text-blue-800 cursor-point"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {wp.author}
                </a>
              ) : (
                <span>{wp.author}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
