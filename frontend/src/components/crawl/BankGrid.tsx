import { useAppSelector } from 'app/hooks';
import { CharacterTemplate } from 'types/api';
import { CharacterCard } from './CharacterCard';

interface BankGridProps {
    onEdit: (template: CharacterTemplate) => void;
    onDelete: (id: number) => void;
    onDoubleClick: (template: CharacterTemplate) => void;
}

export function BankGrid({ onEdit, onDelete, onDoubleClick }: BankGridProps) {
    const templates = useAppSelector((state) => state.crawl.templates);
    const searchQuery = useAppSelector((state) => state.crawl.searchQuery);

    const filtered = templates.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filtered.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center text-gray-500">
                {templates.length === 0
                    ? 'No character templates yet. Create one to get started!'
                    : 'No characters match your search.'}
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-4 overflow-y-auto p-4">
            {filtered.map((tmpl) => (
                <CharacterCard
                    key={tmpl.ID}
                    template={tmpl}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDoubleClick={onDoubleClick}
                />
            ))}
        </div>
    );
}
