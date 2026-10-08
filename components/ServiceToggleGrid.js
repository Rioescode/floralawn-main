"use client";

import { CheckIcon } from "@heroicons/react/24/solid";

export default function ServiceToggleGrid({ services, selected, onToggle }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {services.map((service) => {
        const on = selected.includes(service.form);
        return (
          <button
            key={service.form}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(service.form)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 rounded-2xl border-2 text-left text-sm sm:text-base font-bold text-stone-900 transition-colors ${
              on ? "border-red-800 bg-red-50" : "bg-white border-stone-300"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center ${
                on ? "bg-red-800 text-white" : "bg-white border-2 border-stone-300"
              }`}
            >
              {on ? <CheckIcon className="w-3.5 h-3.5" /> : null}
            </span>
            {service.name}
          </button>
        );
      })}
    </div>
  );
}
