// /src/components/screen-mirroring/LayoutSelector.tsx

import clsx from 'clsx';
import { LayoutType, LayoutStatus } from 'pages/ScreenMirroringPage'; // We will export this type

interface LayoutSelectorProps {
    currentLayout: LayoutType;
    onSelectLayout: (layout: LayoutType) => void;
    onSavePreset: () => void;
    status: LayoutStatus;
}

const layoutOptions: { id: LayoutType; icon: JSX.Element }[] = [
    {
        id: 'single',
        icon: <div className="h-6 w-8 border-2 border-current" />,
    },
    {
        id: 'dual',
        icon: (
            <div className="grid h-6 w-8 grid-cols-2 gap-1">
                <div className="border-2 border-current" />
                <div className="border-2 border-current" />
            </div>
        ),
    },
    {
        id: 'quad',
        icon: (
            <div className="grid h-6 w-8 grid-cols-2 grid-rows-2 gap-1">
                <div className="border-2 border-current" />
                <div className="border-2 border-current" />
                <div className="border-2 border-current" />
                <div className="border-2 border-current" />
            </div>
        ),
    },
];

export function LayoutSelector({ currentLayout, onSelectLayout, onSavePreset, status }: LayoutSelectorProps) {
    return (
        <div className="flex items-center space-x-1 rounded-lg bg-obsidian/80 p-1 border border-paladin-gold/20">
            {layoutOptions.map(({ id, icon }) => (
                <button
                    key={id}
                    onClick={() => onSelectLayout(id)}
                    title={`Switch to ${id} layout`}
                    className={clsx(
                        'rounded-md p-2 transition-colors',
                        currentLayout === id
                            ? 'bg-arcane-purple text-parchment'
                            : 'text-faded-ink hover:bg-paladin-gold/10 hover:text-parchment'
                    )}
                >
                    {icon}
                </button>
            ))}
            
            {/* Save Preset Button */}
            {status !== 'empty' && (
                <>
                    {/* Divider */}
                    <div className="h-8 w-px bg-paladin-gold/30" />
                    
                    <button
                        onClick={onSavePreset}
                        title="Save current layout as preset"
                        className="rounded-md p-2 text-faded-ink transition-colors hover:bg-paladin-gold/10 hover:text-parchment"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                    </button>
                </>
            )}
        </div>
    );
}