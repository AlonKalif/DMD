import { useEffect, useState } from 'react';
import { PresetLayout } from 'types/api';
import { API_BASE_URL } from 'config';
import { PresetItem } from './PresetItem';
import axios from 'axios';

interface PresetPanelProps {
    onLoadPreset: (preset: PresetLayout) => void;
    onDeletePreset: (id: number) => void;
    refreshKey?: number;
}

export function PresetPanel({ onLoadPreset, onDeletePreset, refreshKey }: PresetPanelProps) {
    const [presets, setPresets] = useState<PresetLayout[]>([]);

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
        setPresets(prevPresets => prevPresets.filter(p => p.ID !== id));
        onDeletePreset(id);
    };

    return (
        <div className="flex flex-col items-center gap-2 overflow-y-auto p-2 no-scrollbar">
            {presets.length === 0 ? (
                <div className="flex flex-1 items-center justify-center py-8">
                    <p className="text-faded-ink text-xs text-center">No saved presets.<br/>Save your first layout!</p>
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
