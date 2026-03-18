import { useRef, useEffect, createRef } from 'react';
import { useAppSelector } from 'app/hooks';
import { CombatantCard } from './CombatantCard';

export function CombatantRow() {
    const combatants = useAppSelector((state) => state.crawl.combatants);
    const activeTurnIndex = useAppSelector((state) => state.crawl.activeTurnIndex);
    const cardRefs = useRef<Map<string, React.RefObject<HTMLDivElement>>>(new Map());

    // Ensure refs exist for all combatants
    combatants.forEach((c) => {
        if (!cardRefs.current.has(c.instanceId)) {
            cardRefs.current.set(c.instanceId, createRef<HTMLDivElement>());
        }
    });

    // Clean up stale refs
    const currentIds = new Set(combatants.map(c => c.instanceId));
    cardRefs.current.forEach((_, key) => {
        if (!currentIds.has(key)) cardRefs.current.delete(key);
    });

    useEffect(() => {
        if (activeTurnIndex < 0 || activeTurnIndex >= combatants.length) return;
        const activeId = combatants[activeTurnIndex].instanceId;
        const ref = cardRefs.current.get(activeId);
        if (ref?.current) {
            ref.current.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
        }
    }, [activeTurnIndex, combatants]);

    const templateCounts = new Map<number, number>();
    combatants.forEach((c) => {
        templateCounts.set(c.templateId, (templateCounts.get(c.templateId) ?? 0) + 1);
    });

    if (combatants.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-faded-ink text-sm font-display">
                Drag or double-click characters from the bank to start a battle.
            </div>
        );
    }

    return (
        <div className="flex gap-5 overflow-x-auto px-4 pt-12 pb-6 fantasy-scrollbar">
            {combatants.map((combatant, idx) => (
                <CombatantCard
                    key={combatant.instanceId}
                    ref={cardRefs.current.get(combatant.instanceId)}
                    combatant={combatant}
                    isActive={idx === activeTurnIndex}
                    showCopyIndex={(templateCounts.get(combatant.templateId) ?? 0) > 1}
                />
            ))}
        </div>
    );
}
