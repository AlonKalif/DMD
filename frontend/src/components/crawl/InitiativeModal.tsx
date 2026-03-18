import { useState, FormEvent } from 'react';
import { CharacterTemplate } from 'types/api';

interface InitiativeModalProps {
    template: CharacterTemplate;
    onConfirm: (template: CharacterTemplate, initiative: number) => void;
    onClose: () => void;
}

export function InitiativeModal({ template, onConfirm, onClose }: InitiativeModalProps) {
    const [initiative, setInitiative] = useState(10);

    const adjust = (delta: number) => setInitiative((prev) => prev + delta);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onConfirm(template, initiative);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
            <form
                onSubmit={handleSubmit}
                className="leather-card relative flex w-72 flex-col rounded-lg text-parchment overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="filigree-corner filigree-tl" />
                <div className="filigree-corner filigree-tr" />
                <div className="filigree-corner filigree-bl" />
                <div className="filigree-corner filigree-br" />
                <div className="flex flex-col space-y-4 p-6">
                <h2 className="text-lg font-bold font-blackletter gold-gradient-text">Set Initiative</h2>
                <p className="text-sm text-parchment/70">
                    Adding <span className="font-semibold text-parchment">{template.name}</span> to battle.
                </p>
                <div>
                    <label className="mb-2 block text-sm font-medium text-parchment/70">Initiative</label>
                    <div className="flex items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => adjust(-5)}
                            className="rounded bg-wax-red/60 px-2.5 py-1 text-sm font-bold text-parchment hover:bg-wax-red/80"
                        >
                            -5
                        </button>
                        <button
                            type="button"
                            onClick={() => adjust(-1)}
                            className="rounded bg-wax-red/60 px-2.5 py-1 text-sm font-bold text-parchment hover:bg-wax-red/80"
                        >
                            -1
                        </button>
                        <span className="min-w-[3rem] text-center text-2xl font-bold font-blackletter gold-gradient-text">{initiative}</span>
                        <button
                            type="button"
                            onClick={() => adjust(1)}
                            className="rounded bg-paladin-gold/40 px-2.5 py-1 text-sm font-bold text-parchment hover:bg-paladin-gold/60"
                        >
                            +1
                        </button>
                        <button
                            type="button"
                            onClick={() => adjust(5)}
                            className="rounded bg-paladin-gold/40 px-2.5 py-1 text-sm font-bold text-parchment hover:bg-paladin-gold/60"
                        >
                            +5
                        </button>
                    </div>
                </div>
                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md bg-faded-ink/40 px-4 py-2 text-parchment hover:bg-faded-ink/60"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="rounded-md bg-paladin-gold px-4 py-2 text-ink font-semibold hover:bg-paladin-gold/80 arcane-glow-hover border border-transparent"
                    >
                        Add to Battle
                    </button>
                </div>
                </div>
            </form>
        </div>
    );
}
