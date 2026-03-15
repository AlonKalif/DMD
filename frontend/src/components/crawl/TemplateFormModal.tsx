import { useState, useEffect, FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { fetchImages } from 'features/images/imageSlice';
import { CharacterTemplate, MediaAsset } from 'types/api';
import { API_BASE_URL } from 'config';

const COLOR_PRESETS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
    '#14b8a6', '#f43f5e', '#a855f7', '#374151',
];

interface TemplateFormModalProps {
    initial?: CharacterTemplate;
    onSave: (data: Omit<CharacterTemplate, 'ID'>) => void;
    onClose: () => void;
}

export function TemplateFormModal({ initial, onSave, onClose }: TemplateFormModalProps) {
    const dispatch = useAppDispatch();
    const images = useAppSelector((state) => state.images.items);
    const imagesStatus = useAppSelector((state) => state.images.status);

    const [name, setName] = useState(initial?.name ?? '');
    const [race, setRace] = useState(initial?.race ?? '');
    const [charClass, setCharClass] = useState(initial?.class ?? '');
    const [level, setLevel] = useState(initial?.level ?? 1);
    const [hp, setHp] = useState(initial?.hp ?? 10);
    const [maxHp, setMaxHp] = useState(initial?.max_hp ?? 10);
    const [ac, setAc] = useState(initial?.ac ?? 10);
    const [color, setColor] = useState(initial?.color ?? '#374151');
    const [selectedImagePath, setSelectedImagePath] = useState(initial?.photo_path ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const [showImagePicker, setShowImagePicker] = useState(false);

    useEffect(() => {
        if (imagesStatus === 'idle') {
            dispatch(fetchImages());
        }
    }, [imagesStatus, dispatch]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            await onSave({
                name: name.trim(),
                race: race.trim(),
                class: charClass.trim(),
                level,
                hp,
                max_hp: maxHp,
                ac,
                color,
                photo_path: selectedImagePath,
                custom_fields: initial?.custom_fields ?? null,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSelectImage = (asset: MediaAsset) => {
        setSelectedImagePath(asset.file_path);
        setShowImagePicker(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
            <form
                onSubmit={handleSubmit}
                className="flex w-full max-w-md flex-col space-y-4 rounded-lg bg-gray-800 p-6 text-white max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold">
                    {initial ? 'Edit Character' : 'New Character'}
                </h2>

                {/* Name */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Name *</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full rounded-md border-gray-600 bg-gray-700 p-2 focus:border-blue-500 focus:ring-blue-500"
                        autoFocus
                    />
                </div>

                {/* Race & Class */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-300">Race</label>
                        <input
                            type="text"
                            value={race}
                            onChange={(e) => setRace(e.target.value)}
                            placeholder="e.g. Half-Elf"
                            className="w-full rounded-md border-gray-600 bg-gray-700 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-300">Class</label>
                        <input
                            type="text"
                            value={charClass}
                            onChange={(e) => setCharClass(e.target.value)}
                            placeholder="e.g. Ranger"
                            className="w-full rounded-md border-gray-600 bg-gray-700 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-300">Level</label>
                        <input
                            type="number"
                            min={0}
                            value={level}
                            onChange={(e) => setLevel(Number(e.target.value))}
                            className="w-full rounded-md border-gray-600 bg-gray-700 p-2 text-center focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-300">HP</label>
                        <input
                            type="number"
                            min={0}
                            value={hp}
                            onChange={(e) => setHp(Number(e.target.value))}
                            className="w-full rounded-md border-gray-600 bg-gray-700 p-2 text-center focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-300">Max HP</label>
                        <input
                            type="number"
                            min={0}
                            value={maxHp}
                            onChange={(e) => setMaxHp(Number(e.target.value))}
                            className="w-full rounded-md border-gray-600 bg-gray-700 p-2 text-center focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-300">AC</label>
                        <input
                            type="number"
                            min={0}
                            value={ac}
                            onChange={(e) => setAc(Number(e.target.value))}
                            className="w-full rounded-md border-gray-600 bg-gray-700 p-2 text-center focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Color picker */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Card Color</label>
                    <div className="flex flex-wrap gap-2">
                        {COLOR_PRESETS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                                style={{
                                    backgroundColor: c,
                                    borderColor: color === c ? 'white' : 'transparent',
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Photo picker */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Photo</label>
                    <div className="flex items-center gap-3">
                        {selectedImagePath ? (
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-600">
                                <img
                                    src={`${API_BASE_URL}/static/${selectedImagePath}`}
                                    alt="Selected"
                                    className="h-full w-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => setSelectedImagePath('')}
                                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-400"
                                >
                                    &times;
                                </button>
                            </div>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => setShowImagePicker(!showImagePicker)}
                            className="rounded-md bg-gray-600 px-3 py-1.5 text-sm hover:bg-gray-500"
                        >
                            {selectedImagePath ? 'Change Image' : 'Choose Image'}
                        </button>
                    </div>

                    {showImagePicker && (
                        <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-gray-600 bg-gray-700 p-2">
                            {images.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-4">No images available.</p>
                            ) : (
                                <div className="grid grid-cols-5 gap-2">
                                    {images.map((img) => (
                                        <button
                                            key={img.ID}
                                            type="button"
                                            onClick={() => handleSelectImage(img)}
                                            className={`overflow-hidden rounded-md border-2 transition-transform hover:scale-105 ${
                                                selectedImagePath === img.file_path
                                                    ? 'border-blue-500'
                                                    : 'border-transparent'
                                            }`}
                                        >
                                            <img
                                                src={`${API_BASE_URL}/static/${img.file_path}`}
                                                alt={img.name}
                                                className="h-16 w-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md bg-gray-600 px-4 py-2 hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving || !name.trim()}
                        className="rounded-md bg-blue-600 px-4 py-2 hover:bg-blue-500 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : initial ? 'Update' : 'Create'}
                    </button>
                </div>
            </form>
        </div>
    );
}
