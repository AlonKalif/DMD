import { useDrop } from 'react-dnd';
import { CharacterTemplate } from 'types/api';
import { DND_TYPES } from './dndTypes';
import { BattleToolbar } from './BattleToolbar';
import { CombatantRow } from './CombatantRow';

interface BattleSectionProps {
    onRequestInitiative: (template: CharacterTemplate) => void;
}

export function BattleSection({ onRequestInitiative }: BattleSectionProps) {
    const [{ isOver }, dropRef] = useDrop(() => ({
        accept: DND_TYPES.BANK_CHARACTER,
        drop: (item: { template: CharacterTemplate }) => {
            onRequestInitiative(item.template);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }), [onRequestInitiative]);

    return (
        <div
            ref={dropRef as unknown as React.Ref<HTMLDivElement>}
            className={`flex flex-col rounded-lg border transition-colors ${
                isOver
                    ? 'border-yellow-400 bg-yellow-400/5'
                    : 'border-gray-700 bg-gray-800/50'
            }`}
        >
            <BattleToolbar />
            <div className="min-h-[200px]">
                <CombatantRow />
            </div>
        </div>
    );
}
