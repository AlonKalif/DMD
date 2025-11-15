// /src/components/screen-mirroring/PresetPanel.tsx
import { useEffect, useState } from 'react';
import { PresetLayout } from 'types/api';
import { API_BASE_URL } from 'config';
import { PresetItem } from './PresetItem';
import { useHorizontalScroll } from 'hooks/useHorizontalScroll';
import axios from 'axios';

interface PresetPanelProps {
    onLoadPreset: (preset: PresetLayout) => void;
    onDeletePreset: (id: number) => void;
    refreshKey?: number;
}

export function PresetPanel({ onLoadPreset, onDeletePreset, refreshKey }: PresetPanelProps) {
    const [presets, setPresets] = useState<PresetLayout[]>([]);
    const scrollRef = useHorizontalScroll();

    useEffect(() => {
        const fetchPresets = async () => {
            try {
                const response = await axios.get<PresetLayout[]>(`${API_BASE_URL}/api/v1/images/presets`);
                setPresets(response.data || []);
            } catch (error) {
                console.error('Failed to fetch presets:', error);
                setPresets([]);
            }
        };

        fetchPresets();
    }, [refreshKey]);

    const handleDelete = async (id: number) => {
        // Optimistically remove from UI
        setPresets(prevPresets => prevPresets.filter(p => p.ID !== id));
        // Call parent handler for API call
        onDeletePreset(id);
    };

    return (
        <div
            ref={scrollRef}
            className="scrollbar-hide flex items-center space-x-2 overflow-x-auto py-0.5 px-0.5"
        >
            {presets.length === 0 ? (
                <div className="flex h-32 w-full items-center justify-center">
                    <p className="text-gray-400">No saved presets. Save your first layout!</p>
                </div>
            ) : (
                presets.map((preset) => (
                    <PresetItem
                        key={preset.ID}
                        preset={preset}
                        onLoad={onLoadPreset}
                        onDelete={handleDelete}
                    />
                ))
            )}
        </div>
    );
}

