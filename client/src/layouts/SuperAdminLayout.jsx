import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminNavbar from '../components/superadmin/SuperAdminNavbar';
import SuperAdminSidebar from '../components/superadmin/SuperAdminSidebar';

const SuperAdminLayout = () => {
    // State to manage mobile sidebar visibility (slide in/out)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // State to manage desktop sidebar width (expanded/collapsed)
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

    const toggleMobileSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleDesktopSidebar = () => {
        setIsDesktopCollapsed(!isDesktopCollapsed);
    };

    // Close mobile sidebar automatically if screen resizes to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768 && isSidebarOpen) {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isSidebarOpen]);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar Component */}
            <SuperAdminSidebar
                isOpen={isSidebarOpen}
                toggleMobileSidebar={toggleMobileSidebar}
                isDesktopCollapsed={isDesktopCollapsed}
                setIsDesktopCollapsed={setIsDesktopCollapsed}
            />

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 overflow-hidden w-full transition-all duration-300">
                {/* Navbar Component */}
                <SuperAdminNavbar
                    toggleMobileSidebar={toggleMobileSidebar}
                    toggleDesktopSidebar={toggleDesktopSidebar}
                    isDesktopCollapsed={isDesktopCollapsed}
                />

                {/* Dynamic Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 bg-slate-50">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Overlay Background */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={toggleMobileSidebar}
                ></div>
            )}
        </div>
    );
};

export default SuperAdminLayout;