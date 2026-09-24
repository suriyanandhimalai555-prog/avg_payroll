import { useState } from 'react';
import { FaEye, FaEyeSlash, FaExclamationCircle } from 'react-icons/fa';

const Input = ({
    label,
    name,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    required = false,
    icon: Icon,
    className = '',
    disabled = false,
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
        <div className={`flex flex-col gap-1.5 w-full ${className}`}>
            {label && (
                <label htmlFor={name} className="text-sm font-semibold text-[#010a1f]">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Icon />
                    </div>
                )}
                <input
                    id={name}
                    name={name}
                    type={inputType}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`
            w-full bg-slate-50 border rounded-xl text-sm transition-all outline-none py-2.5
            ${Icon ? 'pl-10' : 'pl-4'}
            ${isPassword ? 'pr-10' : 'pr-4'}
            ${error
                            ? 'border-red-500 focus:ring-2 focus:ring-red-200 text-red-900 bg-red-50'
                            : 'border-slate-200 focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 focus:bg-white text-[#010a1f]'
                        }
            ${disabled ? 'opacity-60 bg-slate-100 cursor-not-allowed' : ''}
          `}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0437cc] transition-colors"
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                )}
                {error && !isPassword && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                        <FaExclamationCircle />
                    </div>
                )}
            </div>
            {error && <p className="text-xs text-red-500 mt-0.5 pl-1">{error}</p>}
        </div>
    );
};

export default Input;