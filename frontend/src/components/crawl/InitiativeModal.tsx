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
                className="flex w-72 flex-col space-y-4 rounded-lg bg-gray-800 p-6 text-white"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-bold">Set Initiative</h2>
                <p className="text-sm text-gray-300">
                    Adding <span className="font-semibold text-white">{template.name}</span> to battle.
                </p>
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Initiative</label>
                    <div className="flex items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => adjust(-5)}
                            className="rounded bg-red-700/60 px-2.5 py-1 text-sm font-bold text-red-200 hover:bg-red-600/80"
                        >
                            -5
                        </button>
                        <button
                            type="button"
                            onClick={() => adjust(-1)}
                            className="rounded bg-red-700/60 px-2.5 py-1 text-sm font-bold text-red-200 hover:bg-red-600/80"
                        >
                            -1
                        </button>
                        <span className="min-w-[3rem] text-center text-2xl font-bold">{initiative}</span>
                        <button
                            type="button"
                            onClick={() => adjust(1)}
                            className="rounded bg-green-700/60 px-2.5 py-1 text-sm font-bold text-green-200 hover:bg-green-600/80"
                        >
                            +1
                        </button>
                        <button
                            type="button"
                            onClick={() => adjust(5)}
                            className="rounded bg-green-700/60 px-2.5 py-1 text-sm font-bold text-green-200 hover:bg-green-600/80"
                        >
                            +5
                        </button>
                    </div>
                </div>
                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md bg-gray-600 px-4 py-2 hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="rounded-md bg-green-600 px-4 py-2 hover:bg-green-500"
                    >
                        Add to Battle
                    </button>
                </div>
            </form>
        </div>
    );
}
