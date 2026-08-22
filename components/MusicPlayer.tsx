"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { throttle } from "@/lib/throttle";
import AudioSpectrum from "./Shared/AudioSpectrum";
import type { Track } from "@/lib/types";
import { playlists } from "@/lib/tracklist";
import Image from "next/image";
import { useStore } from "@/lib/state";

const LCD_SLOTS = 24;

const SPECIAL_CHAR_MAP: Record<string, string> = {
  // Stars, sparks & asterisks
  "✯": "*",
  "★": "*",
  "☆": "*",
  "✦": "*",
  "✧": "*",
  "✶": "*",
  "✴": "*",
  "✹": "*",
  "✪": "*",
  "✫": "*",
  "✬": "*",

  // Bullets & dots
  "•": "*",
  "●": "*",
  "○": "*",
  "·": ".",
  "∙": ".",
  "・": ".",

  // Hearts & music notes
  "♥": "*",
  "♡": "*",
  "♪": "*",
  "♫": "*",
  "♬": "*",

  // Quotes & apostrophes
  "’": "'",
  "‘": "'",
  "‚": "'",
  "‛": "'",
  "“": '"',
  "”": '"',
  "„": '"',
  "‟": '"',
  "«": '"',
  "»": '"',

  // Dashes & hyphens
  "–": "-",
  "—": "-",
  "−": "-",
  "─": "-",
  "ー": "-",
  "~": "-",

  // Slashes & pipes
  "|": "|",
  "│": "|",
  "¦": "|",
  "／": "/",
  "＼": "\\",

  // Right arrows & play pointers
  "→": ">",
  "➡": ">",
  "➔": ">",
  "▶": ">",
  "►": ">",
  "▸": ">",
  "▻": ">",
  "⇒": ">",
  "↦": ">",
  "↝": ">",
  "⇢": ">",
  "˃": ">",
  "›": ">",

  // Left arrows
  "←": "<",
  "⬅": "<",
  "◀": "<",
  "◄": "<",
  "◂": "<",
  "◅": "<",
  "⇐": "<",
  "↤": "<",
  "⇠": "<",
  "˂": "<",
  "‹": "<",

  // Up arrows
  "↑": "^",
  "⬆": "^",
  "▲": "^",
  "▴": "^",
  "△": "^",
  "⇑": "^",
  "⇡": "^",
  "ˆ": "^",

  // Down arrows (14-segment 'V' chevron)
  "↓": "V",
  "⬇": "V",
  "▼": "V",
  "▾": "V",
  "▽": "V",
  "⇓": "V",
  "⇣": "V",
};

export function sanitizeLcdText(raw: string): string {
  if (!raw) return "";

  // 1. Direct symbol mapping
  let text = raw;
  for (const [char, replacement] of Object.entries(SPECIAL_CHAR_MAP)) {
    if (text.includes(char)) {
      text = text.replaceAll(char, replacement);
    }
  }

  // 2. Normalize unicode diacritics (é -> e, ü -> u, ñ -> n, etc.)
  text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 3. Fallback: Any remaining non-ASCII character becomes star *
  text = text.replace(/[^\x20-\x7E]/g, "*");

  return text;
}

function splitIntoLcdPages(text: string, maxLen: number = LCD_SLOTS): string[] {
  const clean = sanitizeLcdText(text);
  if (!clean || clean.length <= maxLen) {
    return [clean];
  }

  const words = clean.split(" ");
  const pages: string[] = [];
  let currentPage = "";

  for (const word of words) {
    if (!currentPage) {
      if (word.length > maxLen) {
        let w = word;
        while (w.length > maxLen) {
          pages.push(w.slice(0, maxLen));
          w = w.slice(maxLen);
        }
        currentPage = w;
      } else {
        currentPage = word;
      }
    } else if ((currentPage + " " + word).length <= maxLen) {
      currentPage += " " + word;
    } else {
      pages.push(currentPage);
      if (word.length > maxLen) {
        let w = word;
        while (w.length > maxLen) {
          pages.push(w.slice(0, maxLen));
          w = w.slice(maxLen);
        }
        currentPage = w;
      } else {
        currentPage = word;
      }
    }
  }

  if (currentPage) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [clean];
}

const LcdSegmentLine = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const [prevText, setPrevText] = useState<string>("");
  const [currentText, setCurrentText] = useState<string>(text);
  const [decayKey, setDecayKey] = useState<number>(0);

  useEffect(() => {
    if (text !== currentText) {
      setPrevText(currentText);
      setCurrentText(text);
      setDecayKey((k) => k + 1);
    }
  }, [text, currentText]);

  const activeChars = sanitizeLcdText(currentText || "")
    .toUpperCase()
    .padEnd(LCD_SLOTS, " ")
    .slice(0, LCD_SLOTS)
    .split("");

  const prevChars = prevText
    ? sanitizeLcdText(prevText || "")
        .toUpperCase()
        .padEnd(LCD_SLOTS, " ")
        .slice(0, LCD_SLOTS)
        .split("")
    : null;

  return (
    <div
      className={`flex items-center select-none font-dseg14 text-sm ${className || ""}`}
    >
      {activeChars.map((char, index) => {
        const prevChar = prevChars ? prevChars[index] : null;
        return (
          <span
            key={index}
            className="relative inline-flex h-6 w-[14px] flex-shrink-0 items-center justify-center"
          >
            {/* 1. Permanent background unlit 14-segment cell */}
            <span className="pointer-events-none absolute inset-0 flex select-none items-center justify-center opacity-25">
              ~
            </span>

            {/* 2. Decaying ghost trail from previous page transition */}
            {prevChar && prevChar !== " " && prevChar !== char && (
              <span
                key={`${decayKey}-${index}`}
                className="animate-lcd-decay pointer-events-none absolute inset-0 flex select-none items-center justify-center opacity-80"
              >
                {prevChar}
              </span>
            )}

            {/* 3. Active lit character with phosphor glow */}
            <span className="lcd-glow relative z-10">
              {char === " " ? "\u00A0" : char}
            </span>
          </span>
        );
      })}
    </div>
  );
};

export const MusicPlayer = (props?: { closed?: boolean }) => {
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const musicApiEndpoint = process.env.NEXT_PUBLIC_TRACKLIST_ENDPOINT;

  const [menu, setMenu] = useState<boolean>(false);
  const { playlist, setPlaylist, currentVolume, setCurrentVolume } = useStore();
  const [selectedPlaylistLength, setSelectedPlaylistLength] = useState<number>(
    playlist.tracks.length
  );
  const [trackIndex, setTrackIndex] = useState<number>(0);
  const [selectedTrack, setSelectedTrack] = useState<Track>(
    playlist.tracks[trackIndex] ?? null
  );

  const display = selectedTrack
    ? `${selectedTrack.artist} - ${selectedTrack.title}`
    : "Player Offline";
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [trackProgress, setTrackProgress] = useState<string>("0%");
  const [currentTrackTime, setCurrentTrackTime] = useState<number>(0);
  const [currentTrackDuration, setCurrentTrackDuration] = useState<number>(0);

  const [pageIndex, setPageIndex] = useState<number>(0);
  const lcdPages = useMemo(
    () => splitIntoLcdPages(display, LCD_SLOTS),
    [display]
  );

  const audio = useRef<HTMLAudioElement>(null);
  const displayText = useRef<HTMLAnchorElement>(null);
  const displayTextContainer = useRef<HTMLDivElement>(null);
  const progressBar = useRef<HTMLDivElement>(null);
  const progressBarContainer = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const stationBtnRef = useRef<HTMLDivElement>(null);
  const previousWaveformUrl = useRef<string>(
    selectedTrack?.audio_url || selectedTrack?.waveform_url || ""
  );

  // Close station dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!menu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        stationBtnRef.current &&
        !stationBtnRef.current.contains(e.target as Node)
      ) {
        setMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menu]);

  // Pause playback when window is closed
  useEffect(() => {
    if (props?.closed && isPlaying) {
      if (audio.current) {
        audio.current.pause();
      }
      setIsPlaying(false);
    }
  }, [props?.closed, isPlaying]);

  useEffect(() => {
    setPageIndex(0);
  }, [display]);

  useEffect(() => {
    if (lcdPages.length <= 1) return;

    const interval = setInterval(() => {
      setPageIndex((prev) => (prev + 1) % lcdPages.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [lcdPages]);

  const updateTrackProgress = useMemo(
    () =>
      throttle((event: React.ChangeEvent<HTMLAudioElement>): void => {
        const currentTime = event.target.currentTime;
        const duration = event.target.duration;
        if (duration) {
          setTrackProgress(((currentTime + 0.25) / duration) * 100 + "%");
          setCurrentTrackDuration(duration);
          setCurrentTrackTime(currentTime);
        }
      }, 200),
    []
  );

  const updateSongPosition = (event: React.MouseEvent<HTMLElement>): void => {
    if (!(event.target instanceof Element)) {
      return;
    }
    let boundingRect = event.target.getBoundingClientRect();
    let percentage = (event.clientX - boundingRect.left) / boundingRect.width;
    if (!audio.current || !isFinite(audio.current.duration)) {
      return;
    }
    const newTime = percentage * audio.current.duration;
    if (isFinite(newTime)) {
      audio.current.currentTime = newTime;
    }
  };

  const convertDuration = (time: number): string => {
    let mins = Math.floor(time / 60);
    let secs = Math.floor(time % 60);
    let returnResult = mins < 10 ? "0" + String(mins) : String(mins);
    returnResult += ":";
    returnResult += secs < 10 ? "0" + String(secs) : String(secs);
    return returnResult;
  };

  const getTrackUrl = useCallback(
    (selectedTrack: Track): string => {
      if (!selectedTrack.waveform_url) {
        return (musicApiEndpoint || "") + selectedTrack.audio_url!;
      }
      return (
        (musicApiEndpoint || "") +
        selectedTrack.waveform_url!.split("/")[3].replace("_m.png", "")
      );
    },
    [musicApiEndpoint]
  );

  // Convert linear volume (0-1) to logarithmic scale for better human perception
  const logVolume = (value: number): number => {
    const minp = 0;
    const maxp = 1;
    const minv = Math.log(0.01);
    const maxv = Math.log(1);
    const scale = (maxv - minv) / (maxp - minp);
    return Math.exp(minv + scale * (value - minp));
  };

  const changeVolume = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const linearVolume = parseFloat(event.target.value);
    const logScaledVolume = logVolume(linearVolume);
    if (audio.current) {
      audio.current.volume = logScaledVolume;
    }
    setCurrentVolume(linearVolume);
  };

  const togglePlay = (): void => {
    if (!audio.current || !selectedTrack) {
      return;
    }
    if (audio.current.src !== getTrackUrl(selectedTrack)) {
      audio.current.src = getTrackUrl(selectedTrack);
    }
    setIsPlaying(!isPlaying);
    const trackUrl = selectedTrack.waveform_url || selectedTrack.audio_url;
    if (previousWaveformUrl.current !== trackUrl && !isPlaying) {
      return;
    }
    if (isPlaying) {
      audio.current.pause();
    } else {
      audio.current.play();
    }
  };

  const nextTrack = async (): Promise<void> => {
    if (trackIndex >= playlist.tracks.length - 1) {
      return;
    }
    setSelectedTrack(playlist.tracks[trackIndex + 1]);
    setTrackIndex(trackIndex + 1);
    if (isPlaying && audio.current?.ended) {
      await sleep(200);
      setIsPlaying(true);
      audio.current?.play();
    }
  };

  const previousTrack = (): void => {
    if (trackIndex <= 0) {
      return;
    }
    setSelectedTrack(playlist.tracks[trackIndex - 1]);
    setTrackIndex(trackIndex - 1);
  };

  const changePlaylist = async (id: number): Promise<void> => {
    setMenu(false);
    if (playlist.id === id) {
      return;
    }
    const newPlaylist = playlists.find((pl) => pl.id === id);
    if (!newPlaylist) {
      return;
    }

    if (isPlaying) {
      audio.current?.pause();
      setIsPlaying(false);
    }

    setTrackProgress("0%");
    setCurrentTrackTime(0);
    setCurrentTrackDuration(0);

    setPlaylist(newPlaylist);
    setSelectedPlaylistLength(newPlaylist.tracks.length);
    setSelectedTrack(newPlaylist.tracks[0]);
    setTrackIndex(0);

    if (audio.current) {
      audio.current.pause();
      audio.current.currentTime = 0;
      audio.current.src = getTrackUrl(newPlaylist.tracks[0]);
    }
  };

  useEffect(() => {
    const handleTrackChange = async () => {
      if (!audio.current || !selectedTrack) {
        return;
      }

      const prevVolume = audio.current.volume;

      if (audio.current.src !== getTrackUrl(selectedTrack)) {
        audio.current.src = getTrackUrl(selectedTrack);
        audio.current.volume = prevVolume;
      }

      const trackUrl = selectedTrack.waveform_url || selectedTrack.audio_url;
      if (trackUrl === previousWaveformUrl.current) {
        previousWaveformUrl.current = trackUrl || "";
      }

      if (isPlaying) {
        audio.current.pause();
        audio.current.volume = prevVolume;
        await sleep(200);
        await audio.current.play();
        audio.current.volume = prevVolume;
      }
    };

    handleTrackChange();
  }, [trackIndex, isPlaying, getTrackUrl, selectedTrack, playlist]);

  // Initialize volume on audio ref
  useEffect(() => {
    if (audio.current) {
      const logScaledVolume = logVolume(currentVolume);
      audio.current.volume = logScaledVolume;
    }
  }, [currentVolume]);

  const currentBarsColor = playlist.appearance?.barsColors || [
    { stop: 0, color: "#01d7b0" },
    { stop: 0.1, color: "#fff" },
    { stop: 1, color: "#fff" },
  ];

  return (
    <div className="font-chicago z-10 px-2">
      <div className="relative my-2 overflow-hidden border-2 border-gray-600 bg-gray-900 shadow-inner">
        {/* Glossy acrylic glass reflection */}
        <div
          className="pointer-events-none absolute inset-0 z-30 select-none"
          style={{
            background:
              "linear-gradient(225deg, rgba(255, 255, 255, 0.155) 0%, rgba(255, 255, 255, 0.045) 44%, rgba(255, 255, 255, 0) 45%)",
          }}
          aria-hidden="true"
        />

        <div
          className={
            "relative flex h-8 items-center overflow-hidden px-2 select-none " +
            (playlist.appearance?.textColor || "text-mint-dark")
          }
        >
          <a
            target="_blank"
            href={selectedTrack?.permalink_url || "#"}
            className="w-full cursor-point overflow-hidden whitespace-nowrap"
            rel="noreferrer"
            title={display}
          >
            <LcdSegmentLine text={lcdPages[pageIndex] || display} />
          </a>
        </div>
        <div
          className={
            isPlaying
              ? "relative flex h-8 items-center justify-start overflow-hidden px-2 select-none " +
                (playlist.appearance?.textColor || "text-mint-dark")
              : "hidden"
          }
          ref={displayTextContainer}
        >
          <AudioSpectrum
            id="audio-canvas"
            height={24}
            width={336}
            audioId={"music-player"}
            capColor={playlist.appearance?.barsColors?.[0]?.color || "#01d7b0"}
            capHeight={2}
            meterWidth={10}
            meterCount={24}
            meterColor={currentBarsColor}
            gap={4}
          />
        </div>
        <div
          className={
            !isPlaying
              ? "relative flex h-8 items-center justify-start overflow-hidden px-2 select-none " +
                (playlist.appearance?.textColor || "text-mint-dark")
              : "hidden"
          }
          ref={displayTextContainer}
        >
          <LcdSegmentLine text="NEXT OS PLAYER - PAUSED" />
        </div>
      </div>

      <div className="flex items-center py-1">
        <p className="text-sm select-none">Station:&nbsp;</p>
        <div
          ref={stationBtnRef}
          onMouseDown={() => {
            setMenu(!menu);
          }}
          className={
            menu
              ? "flex cursor-point items-center bg-gray-400 px-1"
              : "bg-gray-mac flex cursor-point items-center px-1 hover:invert"
          }
        >
          <p className="text-sm">{playlist.name}</p>
          <Image
            className="ml-1 inline w-1"
            src="/img/arrow-down.png"
            height="5"
            width="3"
            alt="arrow down"
          />
        </div>
        <div
          id="dropdown"
          ref={dropdownRef}
          className={
            menu
              ? "shadow-mac-os bg-gray-mac absolute z-10 mt-30 ml-16 w-44"
              : "hidden"
          }
        >
          <ul className="text-xs" aria-labelledby="dropdownDefault">
            {playlists.map((pl) => (
              <li key={pl.id} onMouseDown={() => changePlaylist(pl.id)}>
                <span className="block cursor-point border-b border-black px-4 py-1 hover:bg-black hover:text-white">
                  {pl.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className="relative h-2 w-full cursor-point overflow-hidden border-b border-white/20 bg-black shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]"
        ref={progressBarContainer}
        onMouseUp={updateSongPosition}
      >
        <div
          ref={progressBar}
          className={
            "pointer-events-none h-full transition-all duration-75 " +
            (playlist.appearance?.primaryColor || "bg-mint-dark")
          }
          style={{ width: trackProgress }}
        ></div>
      </div>

      {currentTrackDuration ? (
        <div className="select-none">
          {convertDuration(currentTrackTime)} /{" "}
          {convertDuration(currentTrackDuration)}
        </div>
      ) : (
        <div className="select-none">-</div>
      )}

      <div className="flex flex-row items-center justify-between">
        <div className="mt-2 flex flex-row space-x-4 pb-2 text-sm">
          <button
            onClick={previousTrack}
            aria-label="Previous track"
            className="cursor-point transition-transform duration-150 hover:scale-110"
          >
            <svg
              className="icon h-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 12 9"
            >
              <path
                fill="var(--color-icon, #000)"
                d="M12 0v9h-1V8h-1V7H9V6H8V5H7v4H6V8H5V7H4V6H3V5H2v4H0V0h2v4h1V3h1V2h1V1h1V0h1v4h1V3h1V2h1V1h1V0h1z"
              />
            </svg>
          </button>
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause track" : "Play track"}
            className="cursor-point transition-transform duration-150 hover:scale-110"
          >
            {!isPlaying ? (
              <svg
                className="icon h-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 9 9"
              >
                <path
                  fill="var(--color-icon, #000)"
                  d="M3 9V0h1v1h1v1h1v1h1v1h1v1H7v1H6v1H5v1H4v1H3z"
                />
              </svg>
            ) : (
              <svg
                className="icon h-4"
                viewBox="0 0 9 9"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M2 0H4V9H2V0Z" fill="var(--color-icon, #000)" />
                <path d="M5 0H7V9H5V0Z" fill="var(--color-icon, #000)" />
              </svg>
            )}
          </button>
          <button
            onClick={nextTrack}
            aria-label="Next track"
            className="cursor-point transition-transform duration-150 hover:scale-110"
          >
            <svg
              className="icon h-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 12 9"
            >
              <path
                fill="var(--color-icon, #000)"
                d="M0 9V0h1v1h1v1h1v1h1v1h1V0h1v1h1v1h1v1h1V0h2v9h-2V5H9v1H8v1H7v1H6v1H5V5H4v1H3v1H2v1H1v1H0z"
              />
            </svg>
          </button>
        </div>
        <div className="wrapper">
          <input
            id="music-player-volume"
            value={currentVolume}
            onChange={changeVolume}
            aria-label="Volume"
            className={
              "mac-input hidden lg:block " +
              (playlist.appearance?.inputClass || "input-mint")
            }
            type="range"
            min="0"
            max="1"
            step="0.025"
          />
          <label className="hidden" htmlFor="music-player-volume">
            Volume
          </label>
        </div>
      </div>
      <div className="select-none">
        Track {trackIndex + 1} of {selectedPlaylistLength}
      </div>
      <audio
        id="music-player"
        crossOrigin="anonymous"
        ref={audio}
        onEnded={nextTrack}
        onTimeUpdate={updateTrackProgress}
      />
    </div>
  );
};
