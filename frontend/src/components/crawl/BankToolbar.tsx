import { useAppDispatch, useAppSelector } from 'app/hooks';
import { setSearchQuery } from 'features/crawl/crawlSlice';

interface BankToolbarProps {
    onNewTemplate: () => void;
}

export function BankToolbar({ onNewTemplate }: BankToolbarProps) {
    const dispatch = useAppDispatch();
    const searchQuery = useAppSelector((state) => state.crawl.searchQuery);

    return (
        <div className="flex items-center gap-4 px-4 py-3 border-b border-paladin-gold/20">
            <h2 className="text-xl font-bold font-blackletter gold-gradient-text whitespace-nowrap">Character Bank</h2>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                placeholder="Search by name..."
                className="flex-1 rounded-md border border-paladin-gold/30 bg-leather-dark px-3 py-1.5 text-sm text-parchment placeholder-faded-ink focus:border-arcane-purple focus:outline-none focus:ring-1 focus:ring-arcane-purple"
            />
            <button
                onClick={onNewTemplate}
                className="whitespace-nowrap rounded-md bg-arcane-purple px-4 py-1.5 text-sm font-semibold text-parchment hover:bg-arcane-purple/80 transition-colors arcane-glow-hover border border-transparent"
            >
                + New Character
            </button>
        </div>
    );
}
