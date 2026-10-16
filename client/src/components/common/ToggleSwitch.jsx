const ToggleSwitch = ({
    checked,
    onChange,
    label,
    description,
    disabled = false,
    className = ''
}) => {
    return (
        <label
            className={`flex items-start gap-3 sm:gap-4 group ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                } ${className}`}
        >
            <div className="relative flex items-center shrink-0 mt-0.5">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) => {
                        if (!disabled && onChange) onChange(e.target.checked);
                    }}
                    disabled={disabled}
                />

                {/* Track */}
                <div
                    className={`block w-11 h-6 rounded-full transition-all duration-300 relative overflow-hidden ${checked
                        ? 'bg-gradient-to-r from-[#0437cc] to-[#1f56d6] shadow-md shadow-[#0437cc]/25'
                        : 'bg-slate-300 group-hover:bg-slate-400/80'
                        }`}
                >
                    {/* Soft inner glow */}
                    {checked && (
                        <span className="absolute inset-0 bg-white/10 rounded-full"></span>
                    )}
                </div>

                {/* Thumb */}
                <div
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all duration-300 shadow-md ${checked
                        ? 'translate-x-5 shadow-[#0437cc]/20'
                        : 'translate-x-0 shadow-slate-400/20'
                        }`}
                ></div>
            </div>

            {(label || description) && (
                <div className="flex flex-col min-w-0 flex-1">
                    {label && (
                        <span className={`text-[13px] sm:text-sm font-bold transition-colors ${checked ? 'text-[#010a1f]' : 'text-slate-700'
                            }`}>
                            {label}
                        </span>
                    )}
                    {description && (
                        <span className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {description}
                        </span>
                    )}
                </div>
            )}
        </label>
    );
};

export default ToggleSwitch;