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
        <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-700">
            <h2 className="text-lg font-bold text-white whitespace-nowrap">Dungeon Crawl</h2>

            {activeCombatant ? (
                <span className="text-sm text-yellow-300">
                    Turn: <span className="font-semibold text-white">{activeCombatant.name}</span>
                </span>
            ) : (
                <span className="text-sm text-gray-500">No active battle</span>
            )}

            <div className="ml-auto flex gap-2">
                <button
                    onClick={() => dispatch(nextTurn())}
                    disabled={!hasCombatants}
                    className="rounded-md bg-yellow-600 px-3 py-1 text-sm font-semibold text-white hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Next Turn &rarr;
                </button>
                <button
                    onClick={handleClearAll}
                    disabled={!hasCombatants}
                    className="rounded-md bg-red-700 px-3 py-1 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Clear All
                </button>
            </div>
        </div>
    );
}
