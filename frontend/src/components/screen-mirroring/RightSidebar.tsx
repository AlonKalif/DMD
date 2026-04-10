import { PresetLayout } from 'types/api';
import { PresetPanel } from './PresetPanel';

interface RightSidebarProps {
    onLoadPreset: (preset: PresetLayout) => void;
    onDeletePreset: (id: number) => void;
    presetRefreshKey: number;
}

export function RightSidebar({
    onLoadPreset,
    onDeletePreset,
    presetRefreshKey,
}: RightSidebarProps) {
    return (
        <div className="flex h-full w-[148px] flex-shrink-0 flex-col border-l border-paladin-gold/20 leather-card">
            {/* Logo */}
            <div className="flex flex-shrink-0 items-center justify-center gap-1.5 border-b border-paladin-gold/20 py-1.5">
                <img src="/dmd_logo.png" alt="DMD" className="logo-gold h-5 w-5" />
                <span className="text-xs font-blackletter gold-gradient-text tracking-wide">DM Dashboard</span>
            </div>

            {/* Presets — vertical scroll */}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                <PresetPanel
                    onLoadPreset={onLoadPreset}
                    onDeletePreset={onDeletePreset}
                    refreshKey={presetRefreshKey}
                />
            </div>
        </div>
    );
}
