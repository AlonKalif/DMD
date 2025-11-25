import { useSpotifyPlayer } from 'hooks/useSpotifyPlayer';
import { useAppSelector } from 'app/hooks';
import { formatTime } from 'utils/formatTime';

export function SpotifyPlayer() {
    const player = useSpotifyPlayer();
    const { currentTrack, isPlaying, position, duration, volume, deviceId } = useAppSelector(
        (state) => state.spotify
    );

    const handlePlayPause = async () => {
        if (!player) return;
        await player.togglePlay();
    };

    const handlePrevious = async () => {
        if (!player) return;
        await player.previousTrack();
    };

    const handleNext = async () => {
        if (!player) return;
        await player.nextTrack();
    };

    const handleVolumeChange = async (newVolume: number) => {
        if (!player) return;
        await player.setVolume(newVolume);
    };

    const handleSeek = async (newPosition: number) => {
        if (!player) return;
        await player.seek(newPosition);
    };

    if (!deviceId) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="text-gray-400">Initializing player...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-4 rounded-lg bg-gray-800 p-6">
            {/* Current Track */}
            {currentTrack ? (
                <div className="flex items-center space-x-4">
                    <img
                        src={currentTrack.album.images[0]?.url}
                        alt={currentTrack.album.name}
                        className="h-20 w-20 rounded-md"
                    />
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{currentTrack.name}</h3>
                        <p className="text-sm text-gray-400">
                            {currentTrack.artists.map((a) => a.name).join(', ')}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex items-center space-x-4">
                    <div className="h-20 w-20 rounded-md bg-gray-700"></div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-400">No track playing</h3>
                        <p className="text-sm text-gray-500">Select a playlist to start</p>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-1">
                <input
                    type="range"
                    min="0"
                    max={duration}
                    value={position}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    disabled={!currentTrack}
                />
                <div className="flex justify-between text-xs text-gray-400">
                    <span>{formatTime(position)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
                <button
                    onClick={handlePrevious}
                    disabled={!currentTrack}
                    className="rounded-full p-2 text-white hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                    </svg>
                </button>

                <button
                    onClick={handlePlayPause}
                    disabled={!currentTrack}
                    className="rounded-full bg-white p-4 text-black hover:scale-105 transition-transform disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isPlaying ? (
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                        </svg>
                    ) : (
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>

                <button
                    onClick={handleNext}
                    disabled={!currentTrack}
                    className="rounded-full p-2 text-white hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                    </svg>
                </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
            </div>
        </div>
    );
}

