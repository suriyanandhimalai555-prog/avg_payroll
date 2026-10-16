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
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className={`flex flex-col gap-1.5 w-full ${className}`}>
            {label && (
                <label
                    htmlFor={name}
                    className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider"
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="relative group">
                {Icon && (
                    <div
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${error
                            ? 'text-red-400'
                            : isFocused
                                ? 'text-[#0437cc]'
                                : 'text-slate-400'
                            }`}
                    >
                        <Icon className="text-sm" />
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
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`
                        w-full rounded-xl text-sm font-medium transition-all duration-200 outline-none py-2.5
                        ${Icon ? 'pl-10' : 'pl-4'}
                        ${isPassword ? 'pr-10' : error ? 'pr-10' : 'pr-4'}
                        ${error
                            ? 'border border-red-300 bg-red-50/50 text-red-900 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                            : 'border border-slate-200 bg-slate-50/70 text-[#010a1f] focus:border-[#0437cc] focus:ring-4 focus:ring-[#0437cc]/10 focus:bg-white shadow-sm focus:shadow-md focus:shadow-[#0437cc]/5'
                        }
                        ${disabled ? 'opacity-60 bg-slate-100 cursor-not-allowed' : 'hover:border-slate-300'}
                    `}
                />

                {isPassword && (
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#0437cc] hover:bg-blue-50 rounded-lg transition-all"
                    >
                        {showPassword ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                    </button>
                )}

                {error && !isPassword && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none">
                        <FaExclamationCircle className="text-xs" />
                    </div>
                )}
            </div>

            {error && (
                <p className="text-[10px] sm:text-xs text-red-500 font-semibold pl-1 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 shrink-0"></span>
                    {error}
                </p>
            )}
        </div>
    );
};

export default Input;