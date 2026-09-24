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
                <label htmlFor={name} className="text-sm font-semibold text-[#010a1f]">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                <select
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`
            w-full bg-slate-50 border rounded-xl text-sm transition-all outline-none py-2.5 pl-4 pr-10 appearance-none cursor-pointer
            ${error
                            ? 'border-red-500 focus:ring-2 focus:ring-red-200 text-red-900 bg-red-50'
                            : 'border-slate-200 focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 focus:bg-white text-[#010a1f]'
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
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <FaChevronDown className="text-xs" />
                </div>
            </div>
            {error && <p className="text-xs text-red-500 mt-0.5 pl-1">{error}</p>}
        </div>
    );
};

export default Select;