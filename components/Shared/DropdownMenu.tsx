'use client';

import { DropdownMenuProps } from '@/lib/types';
import { useStore } from '@/lib/state';
import { useState } from 'react';
import { Clock } from '@/components/Clock';
import { Calendar } from '@/components/Calendar';
import Image from 'next/image';

export const DropdownMenu = ({ windowTitle }: DropdownMenuProps) => {
  const [menu, setMenu] = useState(false);
  const { windows, setWindows } = useStore();

  return (
    <>
      <div className="z-50 flex flex-row w-full border-b border-black bg-gray-mac">
          <div 
            className={ menu ? "flex flex-row items-center py-1 text-xs border-r border-black cursor-point bg-gray-400 px-2" : "flex flex-row items-center py-1 text-xs border-r border-black cursor-point px-2 hover:bg-black hover:text-white group"} 
            onMouseDown={ () => { setMenu(!menu) } }
          >
              <span>{windowTitle}</span>
              <Image className="inline ml-1 group-hover:invert w-1" src="https://dwc71k9eqn.ufs.sh/f/JxylFZcO3S9k8pj1nyU4bOHADiJeUdgISulQcLpnjGCxYry0" height="5" width="3" alt='arrow down'/>
          </div>
          <div className="flex-1 py-1"></div>
          <div className="py-1 pl-2 text-xs border-l border-black pr-2">
            <Clock />
          </div>
          <div className="hidden py-1 pl-2 text-xs border-l border-black sm:block pr-2">
            <Calendar />
          </div>
      </div>
      <div id="dropdown" className={ menu ? 'z-10 w-44 bg-gray-mac shadow-mac-os absolute' : 'hidden' }>
          <ul className="text-xs" aria-labelledby="dropdownDefault">
              <li>
                  <span
                      className="block py-1 px-4 border-b border-black hover:text-white hover:bg-black cursor-point"
                      onMouseDown={() => {
                          setMenu(false)
                          setWindows(windows.map((window, index) => {
                            return index === 3 ? { ...window, focused: true, closed: false } : window;
                          }));
                      }}
                  >Settings</span>
              </li>
          </ul>
      </div>
    </>
  );
}