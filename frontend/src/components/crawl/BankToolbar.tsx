import { useAppDispatch, useAppSelector } from 'app/hooks';
import { setPcSearchQuery, setMonsterSearchQuery } from 'features/crawl/crawlSlice';

interface BankToolbarProps {
    type: 'pc' | 'monster';
    onNewTemplate: () => void;
}

export function BankToolbar({ type, onNewTemplate }: BankToolbarProps) {
    const dispatch = useAppDispatch();
    const searchQuery = useAppSelector((state) =>
        type === 'pc' ? state.crawl.pcSearchQuery : state.crawl.monsterSearchQuery
    );
    const setQuery = type === 'pc' ? setPcSearchQuery : setMonsterSearchQuery;

    const title = type === 'pc' ? 'Player Characters' : 'Monsters';
    const buttonLabel = type === 'pc' ? '+ New PC' : '+ New Monster';

    return (
        <div className="flex items-center gap-3 px-3 py-2 border-b border-paladin-gold/20">
            <h2 className="text-base font-bold font-blackletter gold-gradient-text whitespace-nowrap">{title}</h2>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => dispatch(setQuery(e.target.value))}
                placeholder="Search..."
                className="flex-1 rounded-md border border-paladin-gold/30 bg-leather-dark px-3 py-1.5 text-sm text-parchment placeholder-faded-ink focus:border-arcane-purple focus:outline-none focus:ring-1 focus:ring-arcane-purple"
            />
            <button
                onClick={onNewTemplate}
                className="whitespace-nowrap rounded-md bg-arcane-purple px-3 py-1.5 text-sm font-semibold text-parchment hover:bg-arcane-purple/80 transition-colors arcane-glow-hover border border-transparent"
            >
                {buttonLabel}
            </button>
        </div>
    );
}
