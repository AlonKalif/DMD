import { BottomNavBar } from 'components/layout/BottomNavBar';
import { Outlet } from 'react-router-dom';

export default function DmLayout() {
    return (
        // Add padding to the bottom to prevent content from being hidden by the nav bar
        <div className="pb-16">
            <Outlet /> {/* The current page will be rendered here */}
            <BottomNavBar />
        </div>
    );
}