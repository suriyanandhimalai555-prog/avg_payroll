import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import CoordinatorsSidebar from '../components/coordinator/CoordinatorsSidebar';
import CoordinatorsNavbar from '../components/coordinator/CoordinatorsNavbar';

const CoordinatorsLayout = () => {
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

    return (
        <div className="h-screen w-full bg-slate-50 flex overflow-hidden">
            <CoordinatorsSidebar isDesktopCollapsed={isDesktopCollapsed} />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <CoordinatorsNavbar
                    isDesktopCollapsed={isDesktopCollapsed}
                    toggleDesktopSidebar={() => setIsDesktopCollapsed((prev) => !prev)}
                />

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
                    <div className="max-w-[1600px] w-full mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CoordinatorsLayout;

