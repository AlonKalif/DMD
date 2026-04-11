import { useAppDispatch, useAppSelector } from 'app/hooks';
import { nextTurn, clearAll, selectTemplateForCombatant } from 'features/crawl/crawlSlice';

interface BattleToolbarProps {
    isBattleShown: boolean;
    onToggleBattleDisplay: () => void;
}

export function BattleToolbar({ isBattleShown, onToggleBattleDisplay }: BattleToolbarProps) {
    const dispatch = useAppDispatch();
    const combatants = useAppSelector((state) => state.crawl.combatants);
    const templates = useAppSelector((state) => state.crawl.templates);
    const activeTurnIndex = useAppSelector((state) => state.crawl.activeTurnIndex);
    const round = useAppSelector((state) => state.crawl.round);

    const activeCombatant = activeTurnIndex >= 0 && activeTurnIndex < combatants.length
        ? combatants[activeTurnIndex]
        : null;
    const activeTemplate = activeCombatant
        ? selectTemplateForCombatant(templates, activeCombatant.templateId)
        : undefined;

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
                <div className="flex items-center gap-4">
                    <span className="rounded-full border border-paladin-gold/40 bg-paladin-gold/10 px-3 py-0.5 text-sm font-semibold text-paladin-gold">
                        Round {round}
                    </span>
                    <span className="text-sm text-paladin-gold">
                        Turn: <span className="font-semibold text-parchment">{activeTemplate?.name ?? '???'}</span>
                    </span>
                </div>
            ) : (
                <span className="text-sm text-faded-ink">No active battle</span>
            )}

            <div className="ml-auto flex gap-2">
                <button
                    onClick={onToggleBattleDisplay}
                    disabled={!hasCombatants}
                    className={`rounded-md px-3 py-1 text-sm font-semibold transition-colors arcane-glow-hover border border-transparent disabled:opacity-40 disabled:cursor-not-allowed ${
                        isBattleShown
                            ? 'bg-wax-red text-parchment hover:bg-wax-red/80'
                            : 'bg-arcane-purple text-parchment hover:bg-arcane-purple/80'
                    }`}
                >
                    {isBattleShown ? 'Hide Battle' : 'Show Battle'}
                </button>
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
