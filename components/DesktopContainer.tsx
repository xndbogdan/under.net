'use client';

import { useEffect, useRef, useState, useMemo, createRef } from 'react';
import { DesktopContainerProps } from '@/lib/types';
import { appIcons } from '@/lib/icons';
import { useStore } from '@/lib/state';
import Draggable from 'react-draggable';
import { MusicPlayer } from '@/components/MusicPlayer';
import { WallpaperSettings } from '@/components/WallpaperSettings';
import Image from 'next/image';



export const DesktopContainer = ({ windowTitle }: DesktopContainerProps) => {
  const {
    icons, setIcons,
    windows, setWindows,
    wallpaper
  } = useStore();

  const [anyMobileDevice, setAnyMobileDevice] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia("(max-width: 412px)").matches : false
  );
  const iconTimeout = useRef<NodeJS.Timeout>(undefined);

  const findParentWindow = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) {
      return;
    }
    let daddyWindow = event.target;
    if (!daddyWindow) {
      return;
    }
    while (!daddyWindow.classList.contains('os-window')) {
      if (!daddyWindow.parentElement) {
        console.error('Could not find parent window. Contact developer.');
        return;
      }
      daddyWindow = daddyWindow.parentElement;
    }
    return daddyWindow;
  }

  const toggleWindowVisibility = (event: MouseEvent) => {
    event.stopPropagation();
    if (!(event.target instanceof Element)) {
      console.error("what did you click?")
      return;
    }
    if (runAdjacencyCheck(event)) {
      return;
    }
    if (!event.target) {
      return;
    }
    if (event.target.classList.contains('min-btn')) {
      return;
    }
    let daddyWindow = event.target;

    while (!daddyWindow.classList.contains('os-window')) {
      if (!daddyWindow.parentElement) {
        console.error('Could not find parent window. Contact developer.');
        return;
      }
      daddyWindow = daddyWindow.parentElement;
    }
    let windowIndex = parseInt(daddyWindow.id.replace('window-', ''));

    setWindows(windows.map((window, index) => {
      return index === windowIndex ? { ...window, focused: true, minimized: false } : { ...window, focused: false };
    }));
  }

  const toggleWindowVisibilityViaId = (windowIndex: number) => {
    setWindows(windows.map((window, index) => {
      return index === windowIndex ? { ...window, focused: true, minimized: false } : { ...window, focused: false };
    }));
  }

  const toggleIconVisibility = (iconIndex: number) => {
    if (iconTimeout.current) {
      clearTimeout(iconTimeout.current);
    }
    let visibleIcons = [...icons];
    visibleIcons.forEach((icon, index) => {
      if (index === iconIndex) {
        let clicks = visibleIcons[index].clicks;
        visibleIcons[index] = { ...icon, focused: true, clicks: clicks >= 1 ? 0 : clicks + 1 };
        if ((clicks == 1 || anyMobileDevice) && !icon.dragging) {
          let visibleIcons = [...icons];
          visibleIcons.forEach((icon, index) => {
            let focused = visibleIcons[index].focused;
            visibleIcons[index] = { ...icon, focused: focused, clicks: 0 };
          });
          setIcons(visibleIcons);

          setWindows(windows.map((window, index) => {
            return index === iconIndex ?
              { ...window, focused: true, closed: false, minimized: false } :
              { ...window, focused: false };
          }));

        }
      } else {
        visibleIcons[index] = { ...icon, focused: false, clicks: 0, dragging: false };
      }
    });
    setIcons(visibleIcons);

    iconTimeout.current = setTimeout(() => {
      resetIconsFocusedState(iconIndex);
    }, 2000);

  }

  const resetIconsFocusedState = (iconIndex: number) => {
    setIcons(icons.map((icon, index) => {
      const focused = icons[index].focused;
      return { ...icon, focused: focused, clicks: 0 };
    }));
  }

  const runAdjacencyCheck = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) {
      return;
    }
    if (event.target.classList.contains('close-btn')) {
      toggleHideWindow(event);
      return true;
    }
    if (event.target.classList.contains('min-btn')) {
      toggleMinimizeWindow(event);
      return true;
    }
    return false;
  }

  const toggleHideWindow = (event: MouseEvent) => {
    const parentWindow = findParentWindow(event);
    if (!parentWindow) {
      return;
    }
    let windowIndex = parseInt(parentWindow.id.replace('window-', ''));
    setWindows(windows.map((window, index) => {
      return index === windowIndex ? { ...window, closed: true } : window;
    }));
  }

  const toggleMinimizeWindow = (event: MouseEvent) => {
    const parentWindow = findParentWindow(event);
    if (!parentWindow) {
      return;
    }
    let windowIndex = parseInt(parentWindow.id.replace('window-', ''));
    setWindows(windows.map((window, index) => {
      return index === windowIndex ? { ...window, minimized: true } : window;
    }));
  }

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 412px)");
    const handler = (e: MediaQueryListEvent) => setAnyMobileDevice(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const window0Ref = useRef<HTMLDivElement>(null);
  const window1Ref = useRef<HTMLDivElement>(null);
  const window2Ref = useRef<HTMLDivElement>(null);
  const window3Ref = useRef<HTMLDivElement>(null);
  const window4Ref = useRef<HTMLDivElement>(null);

  // Create refs for icons
  const iconRefs = useMemo(() =>
    Array(appIcons.length).fill(null).map(() => createRef<HTMLDivElement>()),
    []
  );

  return (
    <>
      <div className="absolute z-0 flex flex-wrap w-screen p-2">
        <div className="grid w-full max-w-sm grid-cols-3 gap-4 mt-2">
          {
            appIcons.map((app, index) => {
              if (!app.showOnDesktop) {
                return null;
              }
              return (
                <Draggable
                  key={app.iconTitle}
                  nodeRef={iconRefs[index]}
                  onMouseDown={() => toggleIconVisibility(index)}>
                  <div
                    ref={iconRefs[index]}
                    id={`icon-${index}`}
                    className="flex flex-col items-center os-icon"
                    style={icons[index].focused ? { zIndex: 50 } : { zIndex: 1 }}
                  >
                    <Image src={app.iconImage} className="w-10 h-10 mx-auto pointer-events-none" width="240" height="240" alt='App icon' />
                    <span className={icons[index].clicks == 1 ? 'text-xs bg-blue-400 opacity-75' : wallpaper.darkBackground ? 'text-xs text-white bg-black/50 px-1' : 'text-xs'}>{app.iconTitle}</span>
                  </div>
                </Draggable>
              )
            })
          }
        </div>
      </div>
      <div className="absolute z-0 w-screen pointer-events-none">
        <div className="px-2 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap items-start justify-center md:justify-between">
              <Draggable handle=".handle" onMouseDown={(e) => { requestAnimationFrame(() => toggleWindowVisibility(e)); }} nodeRef={window0Ref}>
                <div
                  ref={window0Ref}
                  id='window-0'
                  className={windows[0].closed || windows[0].minimized ? 'hidden' : 'absolute p-1 border border-black mt-4 bg-gray-mac shadow-mac-os os-window w-full max-w-sm pointer-events-auto'}
                  style={windows[0].focused ? { zIndex: 99 } : { zIndex: 10 }}>
                  <div className="flex flex-row items-center pb-1 handle cursor-grab">
                    <div className="w-6 h-6 mr-1 border border-black close-btn md:h-4 md:w-4 hover:invert hover:bg-white cursor-point" />
                    <div className="w-6 h-6 mr-2 border border-black min-btn md:h-4 md:w-4 hover:invert hover:bg-white cursor-point hidden lg:block" />
                    <div className="flex items-center flex-1 h-4">
                      <div className="flex flex-col justify-between flex-1 h-2">
                        <div className="border-t border-black"></div>
                        <div className="border-t border-black"></div>
                        <div className="border-t border-black"></div>
                      </div>
                    </div>
                    <div className="ml-2 text-xs pr-1 font-controller">{windowTitle}</div>
                  </div>
                  <div className="p-2 overflow-y-auto text-sm bg-white border border-black select-full">
                    <p>You probably haven't noticed, but we swapped all of your beer for incredibly watered down apple juice.</p>
                    <p className='mt-2'>Join the <a className='text-blue-700 cursor-point' target='_blank' href='https://discord.gg/M7v6TtxM' rel="noreferrer">Discord server</a>.</p>
                    <p className="mt-2">Check out the <a className='text-blue-700 cursor-point' target='_blank' href='https://soundcloud.com/underdotnet' rel="noreferrer">Soundcloud</a>.</p>
                    {/* <p className="mt-2"><a className='text-blue-700 cursor-point' target='_blank' href='#' rel="noreferrer">Grab some merch here</a></p> */}
                  </div>
                </div>
              </Draggable>
              <Draggable handle=".handle" onMouseDown={(e) => { requestAnimationFrame(() => toggleWindowVisibility(e)); }} nodeRef={window1Ref}>
                <div ref={window1Ref} id='window-1' className={windows[1].closed || windows[1].minimized ? 'hidden' : 'absolute p-1 border border-black mt-4 bg-gray-mac shadow-mac-os os-window w-full max-w-sm pointer-events-auto'} style={windows[1].focused ? { zIndex: 99 } : { zIndex: 10 }}>
                  <div className="flex flex-row items-center pb-1 handle cursor-grab">
                    <div className="w-6 h-6 mr-1 border border-black close-btn md:h-4 md:w-4 hover:invert hover:bg-white cursor-point" />
                    <div className="w-6 h-6 mr-2 border border-black min-btn md:h-4 md:w-4 hover:invert hover:bg-white cursor-point hidden lg:block" />
                    <div className="flex items-center flex-1 h-4">
                      <div className="flex flex-col justify-between flex-1 h-2">
                        <div className="border-t border-black"></div>
                        <div className="border-t border-black"></div>
                        <div className="border-t border-black"></div>
                      </div>
                    </div>
                    <div className="ml-2 text-xs pr-1 font-controller">{windowTitle}</div>
                  </div>
                  <MusicPlayer closed={windows[1].closed} />
                </div>
              </Draggable>
              <Draggable handle=".handle" onMouseDown={(e) => { requestAnimationFrame(() => toggleWindowVisibility(e)); }} nodeRef={window2Ref}>
                <div ref={window2Ref} id='window-2' className={windows[2].closed || windows[2].minimized ? 'hidden' : 'absolute p-1 border border-black mt-4 bg-gray-mac shadow-mac-os os-window w-full max-w-sm pointer-events-auto'} style={windows[2].focused ? { zIndex: 99 } : { zIndex: 10 }}>
                  <div className="flex flex-row items-center pb-1 handle cursor-grab">
                    <div className="w-6 h-6 mr-1 border border-black close-btn md:h-4 md:w-4 hover:invert hover:bg-white cursor-point" />
                    <div className="w-6 h-6 mr-2 border border-black min-btn md:h-4 md:w-4 hover:invert hover:bg-white cursor-point hidden lg:block" />
                    <div className="flex items-center flex-1 h-4">
                      <div className="flex flex-col justify-between flex-1 h-2">
                        <div className="border-t border-black"></div>
                        <div className="border-t border-black"></div>
                        <div className="border-t border-black"></div>
                      </div>
                    </div>
                    <div className="ml-2 text-xs pr-1 font-controller">{windowTitle}</div>
                  </div>
                  <div className="p-2 overflow-y-auto text-sm bg-white border border-black max-h-80 select-full">
                    <p className="mb-2 text-lg">Credits</p>
                    <p><a target="_blank" href="https://remix.run" className="text-blue-700 hover:text-blue-800 cursor-point" rel="noreferrer">• Remix framework</a>, for making this project possible.</p>
                    <p><a target="_blank" href="https://nextjs.org" className="text-blue-700 hover:text-blue-800 cursor-point" rel="noreferrer">• Next.js framework</a>, for carrying the torch.</p>
                    <p><a target='_blank' href='https://tailwindcss.com/' className="text-blue-700 hover:text-blue-800 cursor-point" rel="noreferrer">• Tailwind CSS</a>, for making the design process a breeze.</p>
                    <p><a target="_blank" href="https://poolsuite.net/" className="text-blue-700 hover:text-blue-800 cursor-point" rel="noreferrer">• Poolsuite</a>, for inspiring this project's design.</p>
                  </div>
                </div>
              </Draggable>
              <Draggable handle=".handle" onMouseDown={(e) => { requestAnimationFrame(() => toggleWindowVisibility(e)); }} nodeRef={window3Ref}>
                <div ref={window3Ref} id='window-3' className={windows[3].closed || windows[3].minimized ? 'hidden' : 'absolute p-1 border border-black mt-4 bg-gray-mac shadow-mac-os os-window w-full max-w-sm pointer-events-auto'} style={windows[3].focused ? { zIndex: 99 } : { zIndex: 10 }}>
                  <div className="flex flex-row items-center pb-1 handle cursor-grab">
                    <div className="w-6 h-6 mr-1 border border-black close-btn md:h-4 md:w-4 hover:invert hover:bg-white cursor-point" />
                    <div className="w-6 h-6 mr-2 border border-black min-btn md:h-4 md:w-4 hover:invert hover:bg-white cursor-point hidden lg:block" />
                    <div className="flex items-center flex-1 h-4">
                      <div className="flex flex-col justify-between flex-1 h-2">
                        <div className="border-t border-black"></div>
                        <div className="border-t border-black"></div>
                        <div className="border-t border-black"></div>
                      </div>
                    </div>
                    <div className="ml-2 text-xs pr-1 font-controller">{windowTitle}</div>
                  </div>
                  <div className="px-2 py-4 overflow-y-auto overflow-x-hidden text-sm bg-white border border-black max-h-80 select-full flex justify-center">
                    <div
                      className="stack"
                      style={{ '--stacks': 3, 'minHeight': '3.5rem' } as React.CSSProperties}
                    >
                      <span className='pt-4 font-controller' style={{ "--index": 0 } as React.CSSProperties}>under.net</span>
                      <span className='pt-4 font-controller' style={{ "--index": 1 } as React.CSSProperties}>under.net</span>
                      <span className='pt-4 font-controller' style={{ "--index": 2 } as React.CSSProperties}>under.net</span>
                    </div>

                  </div>
                  <div className="flex flex-wrap text-xs py-2">
                    <div className="w-full md:w-1/2 md:pr-1">
                      <p>Version: under.net 2.0</p>
                      <p>Built-in Memory: 768 MB</p>
                    </div>
                    <div className="w-full md:w-1/2 md:pl-1">
                      <p>Next Rom 0.2 Alpha</p>

                    </div>
                  </div>
                </div>
              </Draggable>
              <Draggable handle=".handle" onMouseDown={(e) => { requestAnimationFrame(() => toggleWindowVisibility(e)); }} nodeRef={window4Ref}>
                <div ref={window4Ref} id='window-4' className={windows[4].closed || windows[4].minimized ? 'hidden' : 'absolute p-1 border border-black mt-4 bg-gray-mac shadow-mac-os os-window w-full max-w-sm pointer-events-auto'} style={windows[4].focused ? { zIndex: 99 } : { zIndex: 10 }}>
                  <div className="flex flex-row items-center pb-1 handle cursor-grab">
                    <div className="w-6 h-6 mr-1 border border-black close-btn md:h-4 md:w-4 hover:invert hover:bg-white cursor-point" />
                    <div className="w-6 h-6 mr-2 border border-black min-btn md:h-4 md:w-4 hover:invert hover:bg-white cursor-point hidden lg:block" />
                    <div className="flex items-center flex-1 h-4">
                      <div className="flex flex-col justify-between flex-1 h-2">
                        <div className="border-t border-black"></div>
                        <div className="border-t border-black"></div>
                        <div className="border-t border-black"></div>
                      </div>
                    </div>
                    <div className="ml-2 text-xs pr-1 font-controller font-controller">under.net</div>
                  </div>
                  <WallpaperSettings />
                </div>
              </Draggable>
            </div>
          </div>
        </div>
      </div>
      <div className='w-full fixed bottom-0 flex-row justify-center hidden lg:flex'>
        <div className="px-2 bg-gray-mac z-50 max-w-sm xl:max-w-prose mx-auto w-full rounded-t-lg py-2 bg-opacity-50 border-black border-t border-r border-l" style={{ "minHeight": "65px" }}>
          <div className="flex-1 py-1 flex justify-start space-x-4 items-center">
            {
              appIcons.map((app, index) => {
                return (
                  <div
                    key={app.iconTitle}
                    id={`dock-icon-${index}`}
                    onMouseDown={() => toggleWindowVisibilityViaId(index)}
                    className={windows[index].closed ? 'hidden' : "flex flex-col handle items-center os-icon p-2 hover:bg-gray-400 rounded-xl hover:bg-opacity-50 cursor-point"}
                  >
                    <Image src={app.iconImage} className="w-6 h-6 mx-auto pointer-events-none" alt='App icon' width="240" height="240" />
                    <span className={windows[index].minimized ? 'rounded-full bg-black h-1 w-1 mt-9 absolute' : 'hidden'}>&nbsp;</span>
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>
    </>
  )
};