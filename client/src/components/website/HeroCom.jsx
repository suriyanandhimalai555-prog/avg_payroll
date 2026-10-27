import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaUserTie, FaUsers, FaUser, FaArrowRight } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const HeroCom = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleRoleNavigation = (role) => {
        if (user && user.role === role) {
            if (role === 'superadmin') return navigate('/superadmin');
            if (role === 'manager') return navigate('/manager');
            if (role === 'hr') return navigate('/hr');
            if (role === 'employee') return navigate('/employee');
        }

        if (role === 'superadmin') {
            navigate('/portal/superadmin-secure-auth');
        } else {
            navigate(`/login?role=${role}`, { state: { role } });
        }
    };

    const roleCards = [
        {
            id: 'superadmin',
            label: 'System Admin',
            tagline: 'Master system control',
            icon: FaUserShield,
            onClick: () => handleRoleNavigation('superadmin'),
        },
        {
            id: 'manager',
            label: 'Manager Login',
            tagline: 'Team & approvals',
            icon: FaUserTie,
            onClick: () => handleRoleNavigation('manager'),
        },
        {
            id: 'hr',
            label: 'HR Login',
            tagline: 'People operations',
            icon: FaUsers,
            onClick: () => handleRoleNavigation('hr'),
        },
        {
            id: 'employee',
            label: 'Employee Login',
            tagline: 'Self-service portal',
            icon: FaUser,
            onClick: () => handleRoleNavigation('employee'),
        },
    ];

    return (
        <div
            className="relative flex flex-col items-center justify-center min-h-screen px-4 py-12 sm:py-16 overflow-hidden bg-slate-50"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&display=swap');`}
            </style>

            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-[#0437cc]/10 via-[#0437cc]/5 to-transparent -translate-y-20 transform skew-y-3 -z-10 pointer-events-none"></div>
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-[#0437cc] rounded-full blur-[120px] opacity-[0.10] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#f77704]/[0.06] rounded-full blur-3xl -z-10 translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-[#0437cc]/[0.06] rounded-full blur-3xl -z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div
                className="absolute inset-0 -z-10 opacity-[0.035] pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, #010a1f 1px, transparent 1px), linear-gradient(to bottom, #010a1f 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                    maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
                }}
            ></div>

            <div className="relative z-10 flex flex-col items-center text-center w-full max-w-4xl">

                <div className="relative mb-8 sm:mb-10 animate-in fade-in zoom-in-95 duration-700">
                    <div className="absolute inset-0 bg-[#0437cc]/20 rounded-3xl blur-2xl scale-110"></div>
                    <div className="absolute inset-0 rounded-3xl border border-[#0437cc]/20 animate-ping opacity-30" style={{ animationDuration: '3s' }}></div>
                    <div className="relative p-3 rounded-3xl bg-white border border-[#0437cc]/10 shadow-2xl shadow-[#0437cc]/10">
                        <img
                            src="/logo.jpg"
                            alt="Company Logo"
                            className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-cover rounded-2xl"
                        />
                    </div>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-5 sm:mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">
                        Secure Portal Access
                    </span>
                </div>

                <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-black text-[#010a1f] mb-4 sm:mb-5 tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-3 duration-700">
                    Welcome to{' '}
                    <span className="relative inline-block">
                        <span className="relative z-10 text-[#0437cc]">AVG</span>{' '}
                        <span className="relative z-10 text-[#f77704]">Payroll</span>
                        <span className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-1.5 sm:h-2 bg-gradient-to-r from-[#0437cc]/30 via-[#f77704]/30 to-transparent rounded-full blur-sm"></span>
                    </span>
                </h1>

                <p className="text-slate-600 max-w-xl mb-10 sm:mb-12 text-sm sm:text-base md:text-lg font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 px-2">
                    Select your designated role to securely access the centralized management and payroll portal.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-5 duration-700">

                    {roleCards.map((role) => {
                        const Icon = role.icon;

                        return (
                            <button
                                key={role.id}
                                type="button"
                                onClick={role.onClick}
                                className="group relative flex items-center gap-4 w-full text-left bg-white border border-slate-200 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 transition-all duration-300 hover:border-[#0437cc]/40 hover:shadow-[0_12px_30px_-10px_rgba(4,55,204,0.25)] hover:-translate-y-1 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0437cc]/40 focus-visible:ring-offset-2 overflow-hidden"
                            >
                                <span className="absolute inset-0 bg-gradient-to-br from-[#0437cc]/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></span>

                                <span className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:from-[#0437cc] group-hover:to-[#1f56d6] group-hover:border-[#0437cc] transition-all duration-300">
                                    <Icon className="text-lg sm:text-xl text-[#010a1f] group-hover:text-white transition-colors duration-300" />
                                </span>

                                <span className="relative flex flex-col min-w-0 flex-1">
                                    <span className="text-[15px] sm:text-base font-bold text-[#010a1f] group-hover:text-[#0437cc] transition-colors duration-300 truncate">
                                        {role.label}
                                    </span>
                                    <span className="text-[11px] sm:text-xs font-semibold text-slate-400 mt-0.5 truncate">
                                        {role.tagline}
                                    </span>
                                </span>

                                <span className="relative shrink-0 w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-[#0437cc] group-hover:border-[#0437cc] group-hover:text-white transition-all duration-300 group-hover:translate-x-0.5">
                                    <FaArrowRight className="text-[10px]" />
                                </span>
                            </button>
                        );
                    })}

                </div>

                <div className="flex items-center justify-center gap-3 mt-10 sm:mt-14 animate-in fade-in duration-1000">
                    <span className="h-px w-8 sm:w-12 bg-slate-200"></span>
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] text-center">
                        © {new Date().getFullYear()} AVG Prime Tech
                    </p>
                    <span className="h-px w-8 sm:w-12 bg-slate-200"></span>
                </div>

            </div>
        </div>
    );
};

export default HeroCom;