import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaUserTie, FaUsers, FaUser } from 'react-icons/fa';
import Button from '../../components/common/Button';

const HeroCom = () => {
    const navigate = useNavigate();

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden bg-slate-50">

            {/* Decorative Electric Blue Ambient Glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-[#0437cc] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center text-center w-full max-w-3xl">

                {/* Logo Container */}
                <div className="mb-8 p-3 rounded-2xl bg-white border border-[#0437cc]/20 shadow-[0_4px_20px_rgba(4,55,204,0.08)]">
                    <img
                        src="/logo.jpg"
                        alt="Company Logo"
                        className="w-32 h-32 object-cover rounded-xl"
                    />
                </div>

                {/* Hero Heading */}
                <h1 className="text-4xl md:text-6xl font-bold text-[#010a1f] mb-4 tracking-tight">
                    Welcome to <span className="text-[#f77704]">AVG Payroll</span>
                </h1>
                <p className="text-slate-600 max-w-lg mb-12 text-lg">
                    Select your designated role to securely access the centralized management and payroll portal.
                </p>

                {/* Login Buttons Grid using Common Button Component */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

                    <Button
                        variant="outline"
                        size="lg"
                        fullWidth
                        icon={FaUserShield}
                        onClick={() => navigate('/superadmin')}
                        className="bg-white group hover:shadow-[0_8px_25px_rgba(4,55,204,0.2)] justify-start px-6"
                    >
                        <span className="text-lg tracking-wide ml-2">SuperAdmin Login</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        fullWidth
                        icon={FaUserTie}
                        onClick={() => navigate('/manager')}
                        className="bg-white group hover:shadow-[0_8px_25px_rgba(4,55,204,0.2)] justify-start px-6"
                    >
                        <span className="text-lg tracking-wide ml-2">Manager Login</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        fullWidth
                        icon={FaUsers}
                        onClick={() => navigate('/hr')}
                        className="bg-white group hover:shadow-[0_8px_25px_rgba(4,55,204,0.2)] justify-start px-6"
                    >
                        <span className="text-lg tracking-wide ml-2">HR Login</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        fullWidth
                        icon={FaUser}
                        onClick={() => navigate('/employee-login')}
                        className="bg-white group hover:shadow-[0_8px_25px_rgba(4,55,204,0.2)] justify-start px-6"
                    >
                        <span className="text-lg tracking-wide ml-2">Employee Login</span>
                    </Button>

                </div>
            </div>
        </div>
    );
};

export default HeroCom;