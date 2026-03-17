import { useState } from 'react';
import { useAppDispatch } from 'app/hooks';
import { addCombatant } from 'features/crawl/crawlSlice';
import { CharacterTemplate } from 'types/api';
import { BattleSection } from 'components/crawl/BattleSection';
import { CharacterBank } from 'components/crawl/CharacterBank';
import { InitiativeModal } from 'components/crawl/InitiativeModal';

export default function DungeonCrawlPage() {
    const dispatch = useAppDispatch();
    const [initiativeTarget, setInitiativeTarget] = useState<CharacterTemplate | null>(null);

    const handleRequestInitiative = (template: CharacterTemplate) => {
        setInitiativeTarget(template);
    };

    const handleInitiativeConfirm = (template: CharacterTemplate, initiative: number) => {
        dispatch(addCombatant({ template, initiative }));
        setInitiativeTarget(null);
    };

    return (
        <div className="flex h-full flex-col gap-2 p-2 pb-0">
            {/* Battle section — top */}
            <BattleSection onRequestInitiative={handleRequestInitiative} />

            {/* Flourish Divider */}
            <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-paladin-gold/40 to-transparent" />
                <span className="text-paladin-gold/60 text-sm select-none">&#10087; &#10086; &#10087;</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-paladin-gold/40 to-transparent" />
            </div>

            {/* Character Bank — bottom */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <CharacterBank onRequestInitiative={handleRequestInitiative} />
            </div>

            {/* Shared initiative modal */}
            {initiativeTarget && (
                <InitiativeModal
                    template={initiativeTarget}
                    onConfirm={handleInitiativeConfirm}
                    onClose={() => setInitiativeTarget(null)}
                />
            )}
        </div>
    );
}
