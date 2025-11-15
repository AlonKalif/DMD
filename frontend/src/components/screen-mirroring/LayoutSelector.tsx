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
        <div className="flex items-center space-x-1 rounded-lg bg-gray-900/80 p-1">
            {layoutOptions.map(({ id, icon }) => (
                <button
                    key={id}
                    onClick={() => onSelectLayout(id)}
                    title={`Switch to ${id} layout`}
                    className={clsx(
                        'rounded-md p-2 transition-colors',
                        currentLayout === id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    )}
                >
                    {icon}
                </button>
            ))}
            
            {/* Save Preset Button */}
            {status !== 'empty' && (
                <>
                    {/* Divider */}
                    <div className="h-8 w-px bg-gray-600" />
                    
                    <button
                        onClick={onSavePreset}
                        title="Save current layout as preset"
                        className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
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