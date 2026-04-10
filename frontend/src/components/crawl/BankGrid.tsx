import { useAppSelector } from 'app/hooks';
import { CharacterTemplate } from 'types/api';
import { CreatureCard } from './CreatureCard';

interface BankGridProps {
    type: 'pc' | 'monster';
    onEdit: (template: CharacterTemplate) => void;
    onDelete: (id: number) => void;
    onDoubleClick: (template: CharacterTemplate) => void;
    onView: (template: CharacterTemplate) => void;
}

export function BankGrid({ type, onEdit, onDelete, onDoubleClick, onView }: BankGridProps) {
    const templates = useAppSelector((state) => state.crawl.templates);
    const searchQuery = useAppSelector((state) =>
        type === 'pc' ? state.crawl.pcSearchQuery : state.crawl.monsterSearchQuery
    );

    const filtered = templates.filter((t) =>
        t.character_type === type && t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const label = type === 'pc' ? 'PC' : 'monster';

    if (filtered.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center text-faded-ink font-display text-sm">
                {templates.filter(t => t.character_type === type).length === 0
                    ? `No ${label} templates yet. Create one!`
                    : 'No matches found.'}
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-3 p-3">
            {filtered.map((tmpl) => (
                <CreatureCard
                    key={tmpl.ID}
                    template={tmpl}
                    mode="bank"
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDoubleClick={onDoubleClick}
                    onViewTemplate={onView}
                />
            ))}
        </div>
    );
}
