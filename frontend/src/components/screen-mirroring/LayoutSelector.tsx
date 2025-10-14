// /src/components/screen-mirroring/LayoutSelector.tsx

import clsx from 'clsx';
import { LayoutType } from 'pages/ScreenMirroringPage'; // We will export this type

interface LayoutSelectorProps {
    currentLayout: LayoutType;
    onSelectLayout: (layout: LayoutType) => void;
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

export function LayoutSelector({ currentLayout, onSelectLayout }: LayoutSelectorProps) {
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
        </div>
    );
}