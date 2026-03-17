import { useState, useEffect, FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { fetchImages } from 'features/images/imageSlice';
import { CharacterTemplate, MediaAsset } from 'types/api';
import { API_BASE_URL } from 'config';

const COLOR_PRESETS = [
    '#1a160f', '#2a2419', '#991b1b',
    '#2d4a3e', '#3b2a1a', '#6b5e4c',
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
                className="leather-card relative flex w-full max-w-md flex-col space-y-4 rounded-lg p-6 text-parchment max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="filigree-corner filigree-tl" />
                <div className="filigree-corner filigree-tr" />
                <div className="filigree-corner filigree-bl" />
                <div className="filigree-corner filigree-br" />
                <h2 className="text-xl font-bold font-blackletter gold-gradient-text">
                    {initial ? 'Edit Character' : 'New Character'}
                </h2>

                {/* Name */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-parchment/70">Name *</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full rounded-md border border-paladin-gold/30 bg-leather-dark p-2 text-parchment focus:border-arcane-purple focus:ring-arcane-purple"
                        autoFocus
                    />
                </div>

                {/* Race & Class */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-parchment/70">Race</label>
                        <input
                            type="text"
                            value={race}
                            onChange={(e) => setRace(e.target.value)}
                            placeholder="e.g. Half-Elf"
                            className="w-full rounded-md border border-paladin-gold/30 bg-leather-dark p-2 text-sm text-parchment placeholder-faded-ink focus:border-arcane-purple focus:ring-arcane-purple"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-parchment/70">Class</label>
                        <input
                            type="text"
                            value={charClass}
                            onChange={(e) => setCharClass(e.target.value)}
                            placeholder="e.g. Ranger"
                            className="w-full rounded-md border border-paladin-gold/30 bg-leather-dark p-2 text-sm text-parchment placeholder-faded-ink focus:border-arcane-purple focus:ring-arcane-purple"
                        />
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-parchment/70">Level</label>
                        <input
                            type="number"
                            min={0}
                            value={level}
                            onChange={(e) => setLevel(Number(e.target.value))}
                            className="w-full rounded-md border border-paladin-gold/30 bg-leather-dark p-2 text-center text-parchment focus:border-arcane-purple focus:ring-arcane-purple"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-parchment/70">HP</label>
                        <input
                            type="number"
                            min={0}
                            value={hp}
                            onChange={(e) => setHp(Number(e.target.value))}
                            className="w-full rounded-md border border-paladin-gold/30 bg-leather-dark p-2 text-center text-parchment focus:border-arcane-purple focus:ring-arcane-purple"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-parchment/70">Max HP</label>
                        <input
                            type="number"
                            min={0}
                            value={maxHp}
                            onChange={(e) => setMaxHp(Number(e.target.value))}
                            className="w-full rounded-md border border-paladin-gold/30 bg-leather-dark p-2 text-center text-parchment focus:border-arcane-purple focus:ring-arcane-purple"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-parchment/70">AC</label>
                        <input
                            type="number"
                            min={0}
                            value={ac}
                            onChange={(e) => setAc(Number(e.target.value))}
                            className="w-full rounded-md border border-paladin-gold/30 bg-leather-dark p-2 text-center text-parchment focus:border-arcane-purple focus:ring-arcane-purple"
                        />
                    </div>
                </div>

                {/* Color picker */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-parchment/70">Card Color</label>
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
                    <label className="mb-1 block text-sm font-medium text-parchment/70">Photo</label>
                    <div className="flex items-center gap-3">
                        {selectedImagePath ? (
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-paladin-gold/30">
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
                            className="rounded-md bg-faded-ink/40 px-3 py-1.5 text-sm text-parchment hover:bg-faded-ink/60"
                        >
                            {selectedImagePath ? 'Change Image' : 'Choose Image'}
                        </button>
                    </div>

                    {showImagePicker && (
                        <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-paladin-gold/30 bg-leather-dark p-2">
                            {images.length === 0 ? (
                                <p className="text-center text-sm text-faded-ink py-4">No images available.</p>
                            ) : (
                                <div className="grid grid-cols-5 gap-2">
                                    {images.map((img) => (
                                        <button
                                            key={img.ID}
                                            type="button"
                                            onClick={() => handleSelectImage(img)}
                                            className={`overflow-hidden rounded-md border-2 transition-transform hover:scale-105 ${
                                                selectedImagePath === img.file_path
                                                    ? 'border-arcane-purple'
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
                        className="rounded-md bg-faded-ink/40 px-4 py-2 text-parchment hover:bg-faded-ink/60"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving || !name.trim()}
                        className="rounded-md bg-arcane-purple px-4 py-2 text-parchment font-semibold hover:bg-arcane-purple/80 disabled:opacity-50 arcane-glow-hover border border-transparent"
                    >
                        {isSaving ? 'Saving...' : initial ? 'Update' : 'Create'}
                    </button>
                </div>
            </form>
        </div>
    );
}
