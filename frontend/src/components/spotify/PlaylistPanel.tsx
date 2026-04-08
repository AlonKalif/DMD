import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import {
    fetchPlaylists,
    fetchPlaylistTracks,
    selectPlaylist,
    clearSelectedPlaylist,
    SpotifyPlaylistTrackItem,
} from 'features/spotify/spotifySlice';
import { formatTime } from 'utils/formatTime';
import axios from 'axios';

export function PlaylistPanel() {
    const dispatch = useAppDispatch();
    const {
        playlists,
        isFetchingPlaylists,
        accessToken,
        deviceId,
        selectedPlaylist,
        playlistTracks,
        isFetchingTracks,
    } = useAppSelector((state) => state.spotify);

    useEffect(() => {
        if (accessToken) {
            dispatch(fetchPlaylists());
        }
    }, [accessToken, dispatch]);

    const resolveDeviceId = async (): Promise<string | null> => {
        if (!accessToken || !deviceId) return null;
        try {
            const resp = await axios.get('https://api.spotify.com/v1/me/player/devices', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const devices = resp.data.devices || [];
            const dmdDevice = devices.find((d: any) => d.name === 'DMD Spotify Player');
            return dmdDevice ? dmdDevice.id : deviceId;
        } catch {
            return deviceId;
        }
    };

    const handleSelectPlaylist = (playlist: typeof playlists[number]) => {
        dispatch(selectPlaylist(playlist));
        dispatch(fetchPlaylistTracks(playlist.id));
    };

    const handleBack = () => {
        dispatch(clearSelectedPlaylist());
    };

    const handlePlayAll = async () => {
        if (!selectedPlaylist) return;
        const resolved = await resolveDeviceId();
        if (!resolved) return;
        try {
            await axios.put(
                `https://api.spotify.com/v1/me/player/play?device_id=${resolved}`,
                { context_uri: selectedPlaylist.uri },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
        } catch (error) {
            console.error('Failed to play playlist:', error);
        }
    };

    const handlePlayTrack = async (track: SpotifyPlaylistTrackItem) => {
        if (!selectedPlaylist) return;
        const resolved = await resolveDeviceId();
        if (!resolved) return;
        try {
            await axios.put(
                `https://api.spotify.com/v1/me/player/play?device_id=${resolved}`,
                { context_uri: selectedPlaylist.uri, offset: { uri: track.uri } },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
        } catch (error) {
            console.error('Failed to play track:', error);
        }
    };

    if (isFetchingPlaylists) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="text-faded-ink">Loading playlists...</div>
            </div>
        );
    }

    if (playlists.length === 0) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="text-faded-ink">No playlists found</div>
            </div>
        );
    }

    // ── Track list view for the selected playlist ──
    if (selectedPlaylist) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-parchment/70 transition-colors hover:bg-paladin-gold/10 hover:text-parchment"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {selectedPlaylist.images?.[0] ? (
                            <img
                                src={selectedPlaylist.images[0].url}
                                alt={selectedPlaylist.name}
                                className="h-12 w-12 rounded-md object-cover flex-shrink-0"
                            />
                        ) : (
                            <div className="h-12 w-12 rounded-md bg-leather-dark flex items-center justify-center flex-shrink-0">
                                <svg className="h-6 w-6 text-faded-ink" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                </svg>
                            </div>
                        )}
                        <h2 className="text-xl font-bold font-blackletter gold-gradient-text truncate">
                            {selectedPlaylist.name}
                        </h2>
                    </div>

                    <button
                        onClick={handlePlayAll}
                        className="flex items-center gap-2 rounded-lg bg-paladin-gold px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-paladin-gold/80 flex-shrink-0"
                    >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                        Play All
                    </button>
                </div>

                {isFetchingTracks ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="text-faded-ink">Loading tracks...</div>
                    </div>
                ) : playlistTracks.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="text-faded-ink">This playlist is empty</div>
                    </div>
                ) : (
                    <div className="leather-card rounded-lg divide-y divide-paladin-gold/10">
                        {playlistTracks.map((track, index) => (
                            <button
                                key={`${track.id}-${index}`}
                                onClick={() => handlePlayTrack(track)}
                                className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-paladin-gold/10"
                            >
                                <span className="w-8 text-right text-sm text-faded-ink/60 flex-shrink-0">
                                    {index + 1}
                                </span>

                                <img
                                    src={track.album.images[track.album.images.length - 1]?.url}
                                    alt={track.album.name}
                                    className="h-10 w-10 rounded flex-shrink-0"
                                />

                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm font-medium text-parchment">
                                        {track.name}
                                    </p>
                                    <p className="truncate text-xs text-faded-ink">
                                        {track.artists.map((a) => a.name).join(', ')}
                                    </p>
                                </div>

                                <span className="text-xs text-faded-ink/60 flex-shrink-0">
                                    {formatTime(track.duration_ms)}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ── Playlist grid view ──
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold font-blackletter gold-gradient-text">Your Playlists</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {playlists.map((playlist) => (
                    <div
                        key={playlist.id}
                        onClick={() => handleSelectPlaylist(playlist)}
                        className="parchment-texture parchment-edge cursor-pointer rounded-lg p-4 arcane-glow-hover border border-transparent"
                    >
                        {playlist.images && playlist.images[0] ? (
                            <img
                                src={playlist.images[0].url}
                                alt={playlist.name}
                                className="mb-2 h-32 w-full rounded-md object-cover"
                            />
                        ) : (
                            <div className="mb-2 h-32 w-full rounded-md bg-leather-dark flex items-center justify-center">
                                <svg className="h-12 w-12 text-faded-ink" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                </svg>
                            </div>
                        )}
                        <h3 className="truncate font-semibold text-ink">{playlist.name}</h3>
                        <p className="text-sm text-faded-ink">{playlist.tracks.total} tracks</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
