import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

// A helper to define the style for our NavLink
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
        'flex flex-1 items-center justify-center p-4 text-lg font-semibold font-blackletter transition-colors',
        isActive
            ? 'bg-arcane-purple text-parchment'
            : 'text-faded-ink hover:text-parchment hover:bg-paladin-gold/10'
    );

export function BottomNavBar() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-16 leather-card border-t border-paladin-gold/30">
            <NavLink to="/" className={navLinkClass} end>
                Screen Mirroring
            </NavLink>
            <NavLink to="/audio" className={navLinkClass}>
                Audio Player
            </NavLink>
            <NavLink to="/crawl" className={navLinkClass}>
                Dungeon Crawl
            </NavLink>
        </nav>
    );
}