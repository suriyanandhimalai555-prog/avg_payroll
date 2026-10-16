import { FaChevronDown } from 'react-icons/fa';

const Select = ({
    label,
    name,
    options = [],
    value,
    onChange,
    error,
    required = false,
    placeholder = 'Select an option',
    className = '',
    disabled = false,
}) => {
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
                <select
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`
                        w-full rounded-xl text-sm font-medium transition-all duration-200 outline-none py-2.5 pl-4 pr-10 appearance-none cursor-pointer
                        ${error
                            ? 'border border-red-300 bg-red-50/50 text-red-900 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                            : 'border border-slate-200 bg-slate-50/70 text-[#010a1f] focus:border-[#0437cc] focus:ring-4 focus:ring-[#0437cc]/10 focus:bg-white shadow-sm hover:border-slate-300'
                        }
                        ${disabled ? 'opacity-60 bg-slate-100 cursor-not-allowed' : ''}
                    `}
                >
                    <option value="" disabled hidden>{placeholder}</option>
                    {options.map((option, index) => (
                        <option key={index} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-7 h-7 flex items-center justify-center text-slate-400 group-focus-within:text-[#0437cc] transition-colors">
                    <FaChevronDown className="text-[10px]" />
                </div>
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

export default Select;