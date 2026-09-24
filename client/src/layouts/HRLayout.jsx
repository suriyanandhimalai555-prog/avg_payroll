import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import HRNavbar from '../components/hr/HRNavbar';
import HRSidebar from '../components/hr/HRSidebar';

const HRLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

    const toggleMobileSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleDesktopSidebar = () => setIsDesktopCollapsed(!isDesktopCollapsed);

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
            <HRSidebar
                isOpen={isSidebarOpen}
                toggleMobileSidebar={toggleMobileSidebar}
                isDesktopCollapsed={isDesktopCollapsed}
                setIsDesktopCollapsed={setIsDesktopCollapsed}
            />

            <div className="flex flex-col flex-1 overflow-hidden w-full transition-all duration-300">
                <HRNavbar
                    toggleMobileSidebar={toggleMobileSidebar}
                    toggleDesktopSidebar={toggleDesktopSidebar}
                    isDesktopCollapsed={isDesktopCollapsed}
                />

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 bg-slate-50">
                    <Outlet />
                </main>
            </div>

            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-[#010a1f]/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={toggleMobileSidebar}
                ></div>
            )}
        </div>
    );
};

export default HRLayout;