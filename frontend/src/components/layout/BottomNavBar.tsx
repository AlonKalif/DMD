import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

// A helper to define the style for our NavLink
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
        'flex flex-1 items-center justify-center p-4 text-lg font-semibold',
        isActive
            ? 'bg-blue-600 text-white' // Active style
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600' // Inactive style
    );

export function BottomNavBar() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 flex h-16 bg-gray-800">
            <NavLink to="/" className={navLinkClass} end>
                Screen Mirroring
            </NavLink>
            <NavLink to="/audio" className={navLinkClass}>
                Audio Player
            </NavLink>
            <NavLink to="/cards" className={navLinkClass}>
                Cards
            </NavLink>
        </nav>
    );
}