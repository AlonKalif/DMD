// /src/components/screen-mirroring/EditAssetModal.tsx
import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import { MediaAsset } from 'types/api';
import { API_BASE_URL } from 'config';

interface EditAssetModalProps {
    asset: MediaAsset;
    onClose: () => void;
    onSave: (updatedAsset: MediaAsset) => Promise<void>;
}

export function EditAssetModal({ asset, onClose, onSave }: EditAssetModalProps) {
    const [types, setTypes] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState(asset.type || 'unknown');
    const [newType, setNewType] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const response = await axios.get<string[]>(`${API_BASE_URL}/api/v1/images/types`);
                setTypes(response.data);
            } catch (error) {
                console.error("Failed to fetch image types for modal:", error);
            }
        };
        fetchTypes();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        // Prioritize the new type input if it's filled, otherwise use the selected type.
        const finalType = (newType.trim() !== '' ? newType.trim() : selectedType);

        const updatedAsset = {
            ...asset,
            type: finalType,
        };

        try {
            await onSave(updatedAsset);
        } finally {
            setIsSaving(false);
        }
    };

    // This function handles the form's submit event.
    const handleSubmit = (e: FormEvent) => {
        // Prevent the default browser action of reloading the page.
        e.preventDefault();
        // Call our existing save logic.
        handleSave();
    };

    return (
        // Overlay
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
            <form
                onSubmit={handleSubmit}
                className="flex w-full max-w-md flex-col space-y-4 rounded-lg bg-gray-800 p-6 text-white"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold">Edit Image Group</h2>
                <img src={`${API_BASE_URL}/static/${asset.file_path}`} alt={asset.name} className="max-h-60 w-full rounded-md object-contain" />

                {/* Assign Existing Type */}
                <div>
                    <label htmlFor="type-select" className="mb-1 block text-sm font-medium text-gray-300">Group With</label>
                    <select
                        id="type-select"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full rounded-md border-gray-600 bg-gray-700 p-2 focus:border-blue-500 focus:ring-blue-500"
                        disabled={newType.trim() !== ''}
                    >
                        <option value="unknown">No Group</option>
                        {types.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>

                {/* Create New Type */}
                <div>
                    <label htmlFor="new-type-input" className="mb-1 block text-sm font-medium text-gray-300">Or Create New Group</label>
                    <input
                        id="new-type-input"
                        type="text"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        placeholder="NPCs, Maps, Scenes..."
                        className="w-full rounded-md border-gray-600 bg-gray-700 p-2 focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="rounded-md bg-gray-600 px-4 py-2 hover:bg-gray-500">Cancel</button>
                    {/* --- CHANGE: Add type="submit" to the Save button --- */}
                    <button type="submit" disabled={isSaving} className="rounded-md bg-blue-600 px-4 py-2 hover:bg-blue-500 disabled:opacity-50">
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    );
}