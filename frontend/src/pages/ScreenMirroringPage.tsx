import { useState, useRef, useEffect } from 'react';
import { ScreenMirroringToolbar } from 'components/screen-mirroring/ScreenMirroringToolbar';
import { AssetSelectionBar } from 'components/screen-mirroring/AssetSelectionBar';
import { useBroadcastChannel } from 'hooks/useBroadcastChannel';
import { MediaAsset } from 'types/api';
import axios from 'axios';
import clsx from 'clsx';

type PreviewStatus = 'empty' | 'staged' | 'live';

interface PreviewState {
    status: PreviewStatus;
    url: string | null;
}

const API_BASE_URL = 'http://localhost:8080';

export default function ScreenMirroringPage() {
    const [preview, setPreview] = useState<PreviewState>({ status: 'empty', url: null });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const channel = useBroadcastChannel('dmd-channel', () => {});


    useEffect(() => {
        return () => {
            if (preview.url) URL.revokeObjectURL(preview.url);
        };
    }, [preview.url]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (preview.url) URL.revokeObjectURL(preview.url);
        const file = event.target.files?.[0];
        if (file) {
            setPreview({ status: 'staged', url: URL.createObjectURL(file) });
        }
    };

    // Fetch the list of media assets from the backend when the component mounts.
    useEffect(() => {
        axios.get<MediaAsset[]>(`${API_BASE_URL}/api/v1/assets/media`)
            .then(response => {
                setAssets(response.data);
            })
            .catch(error => {
                console.error("Failed to fetch media assets:", error);
            });
    }, []);

    const handleAssetSelect = (asset: MediaAsset) => {
        // When a thumbnail is clicked, stage it for preview.
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

    return (
        <div className="flex h-screen flex-col">
            <ScreenMirroringToolbar
                previewStatus={preview.status}
                onBrowseClick={() => fileInputRef.current?.click()}
                onShowToPlayersClick={handleShowToPlayers}
                onHideFromPlayersClick={handleHideFromPlayers}
            />
            <AssetSelectionBar assets={assets} onAssetSelect={handleAssetSelect} />
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