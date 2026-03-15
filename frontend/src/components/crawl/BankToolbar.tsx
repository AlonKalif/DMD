import { useAppDispatch, useAppSelector } from 'app/hooks';
import { setSearchQuery } from 'features/crawl/crawlSlice';

interface BankToolbarProps {
    onNewTemplate: () => void;
}

export function BankToolbar({ onNewTemplate }: BankToolbarProps) {
    const dispatch = useAppDispatch();
    const searchQuery = useAppSelector((state) => state.crawl.searchQuery);

    return (
        <div className="flex items-center gap-4 px-4 py-3">
            <h2 className="text-xl font-bold text-white whitespace-nowrap">Character Bank</h2>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                placeholder="Search by name..."
                className="flex-1 rounded-md border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
                onClick={onNewTemplate}
                className="whitespace-nowrap rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
                + New Character
            </button>
        </div>
    );
}
