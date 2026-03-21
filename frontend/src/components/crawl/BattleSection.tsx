import { useDrop } from 'react-dnd';
import { CharacterTemplate } from 'types/api';
import { DND_TYPES } from './dndTypes';
import { BattleToolbar } from './BattleToolbar';
import { CombatantRow } from './CombatantRow';

interface BattleSectionProps {
    onRequestInitiative: (template: CharacterTemplate) => void;
    onViewTemplate: (template: CharacterTemplate) => void;
}

export function BattleSection({ onRequestInitiative, onViewTemplate }: BattleSectionProps) {
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
            className={`leather-card flex flex-col rounded-lg transition-colors ${
                isOver
                    ? 'border-paladin-gold bg-paladin-gold/5'
                    : ''
            }`}
        >
            <BattleToolbar />
            <div className="relative min-h-[200px]">
                <img
                    src="/dmd_logo.png"
                    alt=""
                    aria-hidden="true"
                    className="logo-gold pointer-events-none absolute inset-0 m-auto h-full max-h-48 w-auto opacity-[0.12] select-none"
                />
                <div className="relative z-10">
                    <CombatantRow onViewTemplate={onViewTemplate} />
                </div>
            </div>
        </div>
    );
}
