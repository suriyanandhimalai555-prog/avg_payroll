import { CgSpinner } from 'react-icons/cg';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    type = 'button',
    disabled = false,
    loading = false,
    icon: Icon,
    className = '',
    fullWidth = false,
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
        primary: 'bg-[#0437cc] text-white hover:bg-[#032a9e] focus:ring-[#0437cc] shadow-sm hover:shadow-md',
        secondary: 'bg-[#f77704] text-white hover:bg-[#d66503] focus:ring-[#f77704] shadow-sm hover:shadow-md',
        outline: 'border-2 border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white focus:ring-[#0437cc]',
        ghost: 'text-slate-600 hover:bg-slate-100 hover:text-[#010a1f] focus:ring-slate-200',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm gap-1.5',
        md: 'px-4 py-2.5 text-sm gap-2',
        lg: 'px-6 py-3 text-base gap-3',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${disabled || loading ? 'opacity-60 cursor-not-allowed' : ''} 
        ${className}
      `}
        >
            {loading ? (
                <CgSpinner className="animate-spin text-xl" />
            ) : Icon ? (
                <Icon className="text-lg" />
            ) : null}
            <span>{children}</span>
        </button>
    );
};

export default Button;