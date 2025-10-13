import { useState, useRef, useEffect } from 'react';
import { ScreenMirroringToolbar } from 'components/screen-mirroring/ScreenMirroringToolbar';
import { AssetSelectionBar } from 'components/screen-mirroring/AssetSelectionBar';
import { useBroadcastChannel, BroadcastMessage } from 'hooks/useBroadcastChannel';
import { MediaAsset } from 'types/api';
import clsx from 'clsx';
import { API_BASE_URL } from 'config';
import { useAppSelector } from 'app/hooks';

type PreviewStatus = 'empty' | 'staged' | 'live';

interface PreviewState {
    status: PreviewStatus;
    url: string | null;
}

export default function ScreenMirroringPage() {
    const [preview, setPreview] = useState<PreviewState>({ status: 'empty', url: null });
    const [notification, setNotification] = useState<string | null>(null);
    const [isNotificationVisible, setIsNotificationVisible] = useState(false);
    const notificationTimerRef = useRef<NodeJS.Timeout>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const assets = useAppSelector((state) => state.images.items);

    const handleChannelMessage = (message: BroadcastMessage) => {
        if (message.type === 'response_current_content' && message.payload) {
            setPreview({
                status: 'live',
                url: message.payload.url,
            });
        }
        if (message.type === 'response_is_empty') {
            // Clear any existing timer to avoid overlaps
            if (notificationTimerRef.current) {
                clearTimeout(notificationTimerRef.current);
            }

            setNotification('Player window is clear. Nothing to Show.');
            setIsNotificationVisible(true); // Make it visible (fade in)

            // Set a timer to fade out and then remove the notification
            notificationTimerRef.current = setTimeout(() => {
                setIsNotificationVisible(false); // Fade out
            }, 2500); // Start fading out after 2.5 seconds
        }
    };

    const channel = useBroadcastChannel('dmd-channel', handleChannelMessage);

    // For cleaning up object URLs
    useEffect(() => {
        return () => {
            if (preview.url?.startsWith('blob:')) {
                URL.revokeObjectURL(preview.url);
            }
        };
    }, [preview.url]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (preview.url?.startsWith('blob:')) {
            URL.revokeObjectURL(preview.url);
        }
        const file = event.target.files?.[0];
        if (file) {
            setPreview({ status: 'staged', url: URL.createObjectURL(file) });
        }
    };

    const handleAssetSelect = (asset: MediaAsset) => {
        const assetUrl = `${API_BASE_URL}/static/${asset.file_path}`;
        setPreview({ status: 'staged', url: assetUrl });
    };

    const handleShowToPlayers = () => {
        if (preview.status === 'staged' && preview.url) {
            const message = {
                type: 'show_image',
                payload: { url: preview.url, caption: 'An image from the DM' },
            };
            channel.postMessage(message);
            setPreview({ ...preview, status: 'live' });
        }
    };

    const handleHideFromPlayers = () => {
        if (preview.status === 'live') {
            const message = { type: 'clear_display' };
            channel.postMessage(message);
            setPreview({ ...preview, status: 'staged' });
        }
    };

    const handlePlayerWindowClose = () => {
        // Reset preview status if it was live when the window closed
        if (preview.status === 'live') {
            setPreview({ ...preview, status: 'staged' });
        }
    };

    const handleSyncWithPlayer = () => {
        channel.postMessage({ type: 'request_current_content' });
    };

    return (
        <div className="flex h-screen flex-col">
            <ScreenMirroringToolbar
                previewStatus={preview.status}
                onShowToPlayersClick={handleShowToPlayers}
                onHideFromPlayersClick={handleHideFromPlayers}
                onPlayerWindowClose={handlePlayerWindowClose}
                onSyncWithPlayerClick={handleSyncWithPlayer}
            />
            {/* AssetSelectionBar is a placeholder for the component that handles asset picking */}
            <AssetSelectionBar
                assets={assets}
                onAssetSelect={handleAssetSelect}
                onBrowseClick={() => fileInputRef.current?.click()}
            />
            <main className="flex flex-1 items-center justify-center bg-gray-900 p-4">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                <div className={clsx(
                    'relative flex h-full w-full items-center justify-center rounded-lg border-4 border-dashed',
                    preview.status === 'empty' && 'border-gray-600',
                    preview.status === 'staged' && 'border-blue-500 border-solid',
                    preview.status === 'live' && 'border-green-500 border-solid',
                )}>
                    {/* Notification Banner */}
                    <div className={clsx(
                        'absolute top-0 left-0 right-0 bg-blue-800/95 p-2 text-center font-semibold text-white shadow-lg transition-opacity duration-300 ease-in-out',
                        isNotificationVisible ? 'opacity-100' : 'opacity-0'
                    )}>
                        {notification}
                    </div>

                    {preview.status !== 'empty' && (
                        <div className={clsx(
                            'absolute top-2 left-2 rounded px-2 py-1 text-sm font-bold text-white',
                            preview.status === 'staged' && 'bg-blue-500',
                            preview.status === 'live' && 'bg-green-500',
                        )}>
                            {preview.status.toUpperCase()}
                        </div>
                    )}

                    {preview.url ? (
                        <img src={preview.url} alt="Staged preview" className="max-h-full max-w-full object-contain" />
                    ) : (
                        <span className="text-gray-400">Browse to select an image for preview</span>
                    )}
                </div>
            </main>
        </div>
    );
}
