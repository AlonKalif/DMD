interface Window {
  onSpotifyWebPlaybackSDKReady: () => void;
  Spotify: {
    Player: new (options: {
      name: string;
      getOAuthToken: (cb: (token: string) => void) => void;
      volume?: number;
    }) => SpotifyPlayer;
  };
}

interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(
    event: 'ready' | 'not_ready' | 'player_state_changed' | 'initialization_error' | 'authentication_error' | 'account_error',
    callback: (data: any) => void
  ): void;
  removeListener(event: string, callback?: (data: any) => void): void;
  getCurrentState(): Promise<SpotifyPlayerState | null>;
  setName(name: string): Promise<void>;
  getVolume(): Promise<number>;
  setVolume(volume: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  togglePlay(): Promise<void>;
  seek(position_ms: number): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
}

interface SpotifyPlayerState {
  context: {
    uri: string;
    metadata: any;
  };
  disallows: {
    pausing?: boolean;
    skipping_prev?: boolean;
    skipping_next?: boolean;
  };
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: SpotifyTrack;
    previous_tracks: SpotifyTrack[];
    next_tracks: SpotifyTrack[];
  };
}

interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: Array<{ name: string; uri: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  duration_ms: number;
}

