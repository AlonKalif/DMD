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
        <div className="flex h-full flex-col bg-gray-900 gap-2 p-2 pb-0">
            {/* Battle section — top */}
            <BattleSection onRequestInitiative={handleRequestInitiative} />

            {/* Divider */}
            <div className="border-t border-gray-700" />

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
