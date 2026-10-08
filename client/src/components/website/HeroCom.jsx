import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaUserTie, FaUsers, FaUser } from 'react-icons/fa';
import Button from '../../components/common/Button';

const HeroCom = () => {
    const navigate = useNavigate();

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden bg-slate-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>

            {/* Inject DM Sans Font globally for this view */}
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap');`}
            </style>

            {/* Decorative Electric Blue Ambient Glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-[#0437cc] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center text-center w-full max-w-3xl">

                {/* Logo Container */}
                <div className="mb-8 p-3 rounded-3xl bg-white border border-[#0437cc]/10 shadow-2xl shadow-[#0437cc]/5">
                    <img
                        src="/logo.jpg"
                        alt="Company Logo"
                        className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-2xl"
                    />
                </div>

                {/* Hero Heading */}
                <h1 className="text-4xl md:text-6xl font-black text-[#010a1f] mb-4 tracking-tight">
                    Welcome to <span className="text-[#f77704]">AVG Payroll</span>
                </h1>
                <p className="text-slate-600 max-w-lg mb-12 text-base sm:text-lg font-medium leading-relaxed">
                    Select your designated role to securely access the centralized management and payroll portal.
                </p>

                {/* Login Buttons Grid using Common Button Component */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">

                    {/* SUPER ADMIN (Routes to the new secure portal) */}
                    <Button
                        variant="outline"
                        size="lg"
                        fullWidth
                        icon={FaUserShield}
                        onClick={() => navigate('/portal/superadmin-secure-auth')}
                        className="bg-white border-slate-200 text-[#010a1f] group hover:border-[#0437cc] hover:text-[#0437cc] hover:bg-[#0437cc]/5 hover:shadow-[0_8px_25px_rgba(4,55,204,0.15)] justify-start px-6 transition-all duration-300 h-16 sm:h-20 rounded-2xl"
                    >
                        <span className="text-base sm:text-lg tracking-wide font-bold ml-3">System Admin</span>
                    </Button>

                    {/* MANAGER LOGIN */}
                    <Button
                        variant="outline"
                        size="lg"
                        fullWidth
                        icon={FaUserTie}
                        onClick={() => navigate('/login', { state: { role: 'manager' } })}
                        className="bg-white border-slate-200 text-[#010a1f] group hover:border-[#0437cc] hover:text-[#0437cc] hover:bg-[#0437cc]/5 hover:shadow-[0_8px_25px_rgba(4,55,204,0.15)] justify-start px-6 transition-all duration-300 h-16 sm:h-20 rounded-2xl"
                    >
                        <span className="text-base sm:text-lg tracking-wide font-bold ml-3">Manager Login</span>
                    </Button>

                    {/* HR LOGIN */}
                    <Button
                        variant="outline"
                        size="lg"
                        fullWidth
                        icon={FaUsers}
                        onClick={() => navigate('/login', { state: { role: 'hr' } })}
                        className="bg-white border-slate-200 text-[#010a1f] group hover:border-[#0437cc] hover:text-[#0437cc] hover:bg-[#0437cc]/5 hover:shadow-[0_8px_25px_rgba(4,55,204,0.15)] justify-start px-6 transition-all duration-300 h-16 sm:h-20 rounded-2xl"
                    >
                        <span className="text-base sm:text-lg tracking-wide font-bold ml-3">HR Login</span>
                    </Button>

                    {/* EMPLOYEE LOGIN */}
                    <Button
                        variant="outline"
                        size="lg"
                        fullWidth
                        icon={FaUser}
                        onClick={() => navigate('/login', { state: { role: 'employee' } })}
                        className="bg-white border-slate-200 text-[#010a1f] group hover:border-[#0437cc] hover:text-[#0437cc] hover:bg-[#0437cc]/5 hover:shadow-[0_8px_25px_rgba(4,55,204,0.15)] justify-start px-6 transition-all duration-300 h-16 sm:h-20 rounded-2xl"
                    >
                        <span className="text-base sm:text-lg tracking-wide font-bold ml-3">Employee Login</span>
                    </Button>

                </div>
            </div>
        </div>
    );
};

export default HeroCom;