import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { fetchPlaylists } from 'features/spotify/spotifySlice';
import axios from 'axios';

export function PlaylistPanel() {
    const dispatch = useAppDispatch();
    const { playlists, isFetchingPlaylists, accessToken, deviceId } = useAppSelector(
        (state) => state.spotify
    );

    useEffect(() => {
        if (accessToken) {
            dispatch(fetchPlaylists());
        }
    }, [accessToken, dispatch]);

    const handlePlayPlaylist = async (playlistUri: string) => {
        if (!accessToken || !deviceId) {
            console.error('Cannot play playlist: missing token or device ID');
            return;
        }

        try {
            await axios.put(
                `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
                { context_uri: playlistUri },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
        } catch (error) {
            console.error('Failed to play playlist:', error);
        }
    };

    if (isFetchingPlaylists) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="text-gray-400">Loading playlists...</div>
            </div>
        );
    }

    if (playlists.length === 0) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="text-gray-400">No playlists found</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Your Playlists</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {playlists.map((playlist) => (
                    <div
                        key={playlist.id}
                        onClick={() => handlePlayPlaylist(playlist.uri)}
                        className="cursor-pointer rounded-lg bg-gray-800 p-4 transition-colors hover:bg-gray-700"
                    >
                        {playlist.images && playlist.images[0] ? (
                            <img
                                src={playlist.images[0].url}
                                alt={playlist.name}
                                className="mb-2 h-32 w-full rounded-md object-cover"
                            />
                        ) : (
                            <div className="mb-2 h-32 w-full rounded-md bg-gray-700 flex items-center justify-center">
                                <svg className="h-12 w-12 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                </svg>
                            </div>
                        )}
                        <h3 className="truncate font-semibold text-white">{playlist.name}</h3>
                        <p className="text-sm text-gray-400">{playlist.tracks.total} tracks</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

