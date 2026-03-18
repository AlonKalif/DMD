import { useState, useEffect, FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { fetchImages } from 'features/images/imageSlice';
import { CharacterTemplate, MediaAsset } from 'types/api';
import { API_BASE_URL } from 'config';

const TYPE_COLORS = { pc: '#2d4a3e', monster: '#991b1b' } as const;

interface TemplateFormModalProps {
    initial?: CharacterTemplate;
    characterType: 'pc' | 'monster';
    onSave: (data: Omit<CharacterTemplate, 'ID'>) => void;
    onClose: () => void;
}

export function TemplateFormModal({ initial, characterType, onSave, onClose }: TemplateFormModalProps) {
    const dispatch = useAppDispatch();
    const images = useAppSelector((state) => state.images.items);
    const imagesStatus = useAppSelector((state) => state.images.status);

    const [name, setName] = useState(initial?.name ?? '');
    const [race, setRace] = useState(initial?.race ?? '');
    const [charClass, setCharClass] = useState(initial?.class ?? '');
    const [level, setLevel] = useState(initial?.level ?? 1);
    const [maxHp, setMaxHp] = useState(initial?.max_hp ?? 10);
    const [ac, setAc] = useState(initial?.ac ?? 10);
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
                hp: maxHp,
                max_hp: maxHp,
                ac,
                color: TYPE_COLORS[characterType],
                character_type: characterType,
                creature_type: initial?.creature_type ?? '',
                creature_type_custom: initial?.creature_type_custom ?? '',
                alignment: initial?.alignment ?? '',
                size: initial?.size ?? '',
                proficiency_bonus: initial?.proficiency_bonus ?? 0,
                hit_dice: initial?.hit_dice ?? 0,
                spell_slots: initial?.spell_slots ?? 0,
                rage_slots: initial?.rage_slots ?? 0,
                speed: initial?.speed ?? 0,
                burrow_speed: initial?.burrow_speed ?? 0,
                climb_speed: initial?.climb_speed ?? 0,
                fly_speed: initial?.fly_speed ?? 0,
                swim_speed: initial?.swim_speed ?? 0,
                abilities: initial?.abilities ?? { strength: { score: 10, modifier: 0 }, dexterity: { score: 10, modifier: 0 }, constitution: { score: 10, modifier: 0 }, intelligence: { score: 10, modifier: 0 }, wisdom: { score: 10, modifier: 0 }, charisma: { score: 10, modifier: 0 } },
                saving_throws: initial?.saving_throws ?? [],
                skills: initial?.skills ?? { acrobatics: 0, animal_handling: 0, arcana: 0, athletics: 0, deception: 0, history: 0, insight: 0, intimidation: 0, investigation: 0, medicine: 0, nature: 0, perception: 0, performance: 0, persuasion: 0, religion: 0, sleight_of_hand: 0, stealth: 0, survival: 0 },
                immunities: initial?.immunities ?? [],
                damage_relations: initial?.damage_relations ?? [],
                languages: initial?.languages ?? [],
                senses: initial?.senses ?? [],
                actions: initial?.actions ?? [],
                reactions: initial?.reactions ?? [],
                other_features: initial?.other_features ?? [],
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
                className="leather-card relative flex w-full max-w-md flex-col rounded-lg text-parchment max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="filigree-corner filigree-tl" />
                <div className="filigree-corner filigree-tr" />
                <div className="filigree-corner filigree-bl" />
                <div className="filigree-corner filigree-br" />
                <div className="flex flex-col space-y-4 overflow-y-auto fantasy-scrollbar p-6">
                <h2 className="text-xl font-bold font-blackletter gold-gradient-text">
                    {initial ? 'Edit' : 'New'} {characterType === 'pc' ? 'Player Character' : 'Monster'}
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
                <div className="grid grid-cols-3 gap-3">
                    {([
                        { label: 'Level', value: level, setter: setLevel },
                        { label: 'Max HP', value: maxHp, setter: setMaxHp },
                        { label: 'AC', value: ac, setter: setAc },
                    ] as const).map(({ label, value, setter }) => (
                        <div key={label}>
                            <label className="mb-1 block text-xs font-medium text-parchment/70">{label}</label>
                            <div className="flex items-center rounded-md border border-paladin-gold/30 bg-leather-dark">
                                <button
                                    type="button"
                                    onClick={() => setter(Math.max(0, value - 1))}
                                    className="px-2 py-1.5 text-sm font-bold text-paladin-gold/70 hover:text-paladin-gold transition-colors"
                                >
                                    &#8722;
                                </button>
                                <input
                                    type="number"
                                    min={0}
                                    value={value}
                                    onChange={(e) => setter(Math.max(0, Number(e.target.value)))}
                                    className="hide-spin w-full bg-transparent p-1 text-center text-parchment focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setter(value + 1)}
                                    className="px-2 py-1.5 text-sm font-bold text-paladin-gold/70 hover:text-paladin-gold transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    ))}
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
                </div>
            </form>
        </div>
    );
}
