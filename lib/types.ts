type Track = {
  soundcloud_id?: number;
  artist: string;
  title: string;
  duration_ms?: number;
  date_added?: string;
  waveform_url?: string;
  permalink_url: string;
  audio_url?: string;
}

type Tracklist = Track[];

type Playlist = {
  id: number;
  name: string;
  tracks: Tracklist;
};

type DropdownMenuProps = {
  windowTitle: string;
  // setWindows: React.Dispatch<React.SetStateAction<Window[]>>;
};

type DesktopContainerProps = {
  windowTitle: string;
};

type Wallpaper = {
  id: number;
  className: string;
  name: string;
  author: string;
  authorUrl?: string;
  previewImage: string;
  darkBackground?: boolean;
};

export type { DesktopContainerProps, DropdownMenuProps, Tracklist, Track, Playlist, Wallpaper };