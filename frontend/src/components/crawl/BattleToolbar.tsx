import { useAppDispatch, useAppSelector } from 'app/hooks';
import { nextTurn, clearAll } from 'features/crawl/crawlSlice';

export function BattleToolbar() {
    const dispatch = useAppDispatch();
    const combatants = useAppSelector((state) => state.crawl.combatants);
    const activeTurnIndex = useAppSelector((state) => state.crawl.activeTurnIndex);

    const activeCombatant = activeTurnIndex >= 0 && activeTurnIndex < combatants.length
        ? combatants[activeTurnIndex]
        : null;

    const hasCombatants = combatants.length > 0;

    const handleClearAll = () => {
        if (window.confirm('End the battle and remove all combatants?')) {
            dispatch(clearAll());
        }
    };

    return (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-paladin-gold/20">
            <h2 className="text-lg font-bold font-blackletter gold-gradient-text whitespace-nowrap">Dungeon Crawl</h2>

            {activeCombatant ? (
                <span className="text-sm text-paladin-gold">
                    Turn: <span className="font-semibold text-parchment">{activeCombatant.name}</span>
                </span>
            ) : (
                <span className="text-sm text-faded-ink">No active battle</span>
            )}

            <div className="ml-auto flex gap-2">
                <button
                    onClick={() => dispatch(nextTurn())}
                    disabled={!hasCombatants}
                    className="rounded-md bg-paladin-gold px-3 py-1 text-sm font-semibold text-ink hover:bg-paladin-gold/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors arcane-glow-hover border border-transparent"
                >
                    Next Turn &rarr;
                </button>
                <button
                    onClick={handleClearAll}
                    disabled={!hasCombatants}
                    className="rounded-md bg-wax-red px-3 py-1 text-sm font-semibold text-parchment hover:bg-wax-red/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors arcane-glow-hover border border-transparent"
                >
                    Clear All
                </button>
            </div>
        </div>
    );
}
