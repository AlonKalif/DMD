import { useRef, useEffect, createRef } from 'react';
import { BattleDisplayPayload, CharacterTemplate } from 'types/api';
import { CreatureCard } from './CreatureCard';

interface PlayerBattleViewProps {
    battleState: BattleDisplayPayload;
}

function findTemplate(templates: CharacterTemplate[], templateId: number): CharacterTemplate | undefined {
    return templates.find(t => t.ID === templateId);
}

export function PlayerBattleView({ battleState }: PlayerBattleViewProps) {
    const { combatants, templates, activeTurnIndex } = battleState;
    const cardRefs = useRef<Map<string, React.RefObject<HTMLDivElement>>>(new Map());

    combatants.forEach(c => {
        if (!cardRefs.current.has(c.instanceId)) {
            cardRefs.current.set(c.instanceId, createRef<HTMLDivElement>());
        }
    });

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
    combatants.forEach(c => {
        templateCounts.set(c.templateId, (templateCounts.get(c.templateId) ?? 0) + 1);
    });

    if (combatants.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-faded-ink text-lg font-display">
                No active battle.
            </div>
        );
    }

    return (
        <div className="flex h-full w-full items-end justify-start gap-5 overflow-x-auto px-4 pt-12 pb-6 fantasy-scrollbar">
            {combatants.map((combatant, idx) => {
                const template = findTemplate(templates, combatant.templateId);
                if (!template) return null;
                return (
                    <CreatureCard
                        key={combatant.instanceId}
                        ref={cardRefs.current.get(combatant.instanceId)}
                        template={template}
                        mode="player"
                        combatant={combatant}
                        isActive={idx === activeTurnIndex}
                        showCopyIndex={(templateCounts.get(combatant.templateId) ?? 0) > 1}
                    />
                );
            })}
        </div>
    );
}
