import Link from "next/link";
import type { ComponentProps, ComponentType } from "react";

const variantes = {
  primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus-visible:ring-blue-100",
  outline: "border border-blue-600 text-blue-600 hover:bg-blue-50 focus-visible:ring-blue-100",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-200",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-100",
  ghost: "text-gray-700 hover:bg-gray-100 hover:text-blue-600 focus-visible:ring-gray-200",
};

const tailles = {
  sm: "px-3.5 py-1.5 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
};

type ButtonBaseProps = {
  variant?: keyof typeof variantes;
  size?: keyof typeof tailles;
  icon?: ComponentType<{ className?: string }>; // icône lucide-react, ex : icon={Plus}
  fullWidth?: boolean;
};

// Avec href → lien (<Link>), sans href → bouton (<button>)
type ButtonProps =
  | (ButtonBaseProps & ComponentProps<"button"> & { href?: undefined })
  | (ButtonBaseProps & ComponentProps<typeof Link> & { href: string });

export default function Button({
  variant = "primary",
  size = "md",
  icon: Icone,
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center rounded-lg font-medium transition
    focus:outline-none focus-visible:ring-4 disabled:opacity-50 disabled:pointer-events-none
    ${variantes[variant]} ${tailles[size]} ${fullWidth ? "w-full" : ""} ${className}`;

  const contenu = (
    <>
      {Icone && <Icone className={size === "sm" ? "size-3.5" : "size-4"} />}
      {children}
    </>
  );

  if (props.href !== undefined) {
    return (
      <Link {...(props as ComponentProps<typeof Link>)} className={classes}>
        {contenu}
      </Link>
    );
  }

  return (
    <button type="button" {...(props as ComponentProps<"button">)} className={classes}>
      {contenu}
    </button>
  );
}
