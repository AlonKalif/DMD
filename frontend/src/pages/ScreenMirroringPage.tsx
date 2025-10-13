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

    const fileInputRef = useRef<HTMLInputElement>(null);
    const assets = useAppSelector((state) => state.images.items);

    const handleChannelMessage = (message: BroadcastMessage) => {
        // Handle any future player-initiated messages here (e.g., player feedback).
        console.log(`Received message from player channel: ${message.type}`);
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

    return (
        <div className="flex h-screen flex-col">
            <ScreenMirroringToolbar
                previewStatus={preview.status}
                onShowToPlayersClick={handleShowToPlayers}
                onHideFromPlayersClick={handleHideFromPlayers}
                onPlayerWindowClose={handlePlayerWindowClose}
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
