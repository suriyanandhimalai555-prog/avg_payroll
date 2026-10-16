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
    const baseStyles =
        'relative inline-flex items-center justify-center font-semibold tracking-tight transition-all duration-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] select-none whitespace-nowrap overflow-hidden';

    const variants = {
        primary:
            'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white shadow-md shadow-[#0437cc]/25 hover:shadow-lg hover:shadow-[#0437cc]/30 hover:from-[#0437cc] hover:to-[#0437cc] focus-visible:ring-[#0437cc]',
        secondary:
            'bg-gradient-to-br from-[#f77704] to-[#ff8c2b] text-white shadow-md shadow-[#f77704]/25 hover:shadow-lg hover:shadow-[#f77704]/30 hover:from-[#f77704] hover:to-[#f77704] focus-visible:ring-[#f77704]',
        outline:
            'border border-[#0437cc]/40 text-[#0437cc] bg-white hover:bg-[#0437cc] hover:text-white hover:border-[#0437cc] focus-visible:ring-[#0437cc] shadow-sm hover:shadow-md',
        ghost:
            'text-slate-600 hover:bg-slate-100 hover:text-[#010a1f] focus-visible:ring-slate-200',
        danger:
            'bg-gradient-to-br from-red-600 to-red-500 text-white shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30 hover:from-red-600 hover:to-red-600 focus-visible:ring-red-600',
    };

    const sizes = {
        sm: 'px-3.5 py-1.5 text-xs gap-1.5',
        md: 'px-4 py-2.5 text-[13px] gap-2',
        lg: 'px-6 py-3 text-sm gap-2.5',
    };

    const isDisabled = disabled || loading;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isDisabled}
            className={`
                ${baseStyles}
                ${variants[variant]}
                ${sizes[size]}
                ${fullWidth ? 'w-full' : ''}
                ${isDisabled ? 'opacity-55 cursor-not-allowed !shadow-none !active:scale-100' : ''}
                ${className}
            `}
        >
            {/* Subtle sheen on hover for filled variants */}
            {(variant === 'primary' || variant === 'secondary' || variant === 'danger') && !isDisabled && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                />
            )}

            {loading ? (
                <CgSpinner className="animate-spin text-base" />
            ) : Icon ? (
                <Icon className="text-[1.05em] shrink-0" />
            ) : null}
            <span className="truncate">{children}</span>
        </button>
    );
};

export default Button;