
const ToggleSwitch = ({
    checked,
    onChange,
    label,
    description,
    disabled = false,
    className = ''
}) => {
    return (
        <label className={`flex items-start gap-4 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
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
                    className={`block w-12 h-6 rounded-full transition-colors duration-300 ${checked ? 'bg-[#0437cc]' : 'bg-slate-300'
                        }`}
                ></div>
                {/* Thumb */}
                <div
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${checked ? 'translate-x-6' : 'translate-x-0'
                        }`}
                ></div>
            </div>

            {(label || description) && (
                <div className="flex flex-col">
                    {label && <span className="text-sm font-semibold text-[#010a1f]">{label}</span>}
                    {description && <span className="text-xs text-slate-500 mt-0.5">{description}</span>}
                </div>
            )}
        </label>
    );
};

export default ToggleSwitch;