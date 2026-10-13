import type { ComponentProps } from "react";

// Accepte toutes les propriétés d'un <input> (required, min, max, disabled...)
type InputProps = ComponentProps<"input"> & {
  id: string;
  label: string;
};

export default function Input({ id, label, type = "text", ...props }: InputProps) {
  return (
    <div className="w-full space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="text-red-500"> *</span>}
      </label>
      <input
        name={id}
        {...props}
        id={id}
        type={type}
        className="py-2.5 sm:py-3 px-4 rounded-lg block w-full bg-white border border-gray-300 sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 disabled:pointer-events-none"
      />
    </div>
  );
}

// Même style pour les <select> et <textarea> des formulaires
export const styleChamp =
  "py-2.5 sm:py-3 px-4 rounded-lg block w-full bg-white border border-gray-300 sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
