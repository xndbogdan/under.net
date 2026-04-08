import type { Tracklist, Playlist } from "./types";

export const underNet: Tracklist = [
  {
    title: "crossroad",
    artist: "beansclub",
    audio_url: "undernet/beansclub-crossroad",
    permalink_url: "https://soundcloud.com/underdotnet/beansclub-crossroad-1",
  },
  {
    title: "Snake Pit",
    artist: "MEKA",
    audio_url: "undernet/MEKA-Snake_Pit",
    permalink_url: "https://soundcloud.com/underdotnet/meka-snake-pit-2",
  },
  {
    title: "Young Birds",
    artist: "✯cenobia✯",
    audio_url: "undernet/cenobia-Young_Birds",
    permalink_url: "https://soundcloud.com/underdotnet/cenobia-young-birds-3",
  },
];

export const playlists: Playlist[] = [
  {
    id: 1,
    name: "under.net",
    tracks: underNet,
  },
];
