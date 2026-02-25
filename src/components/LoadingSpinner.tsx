import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = "md",
  text,
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 sm:w-5 sm:h-5",
    md: "w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10",
    lg: "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14",
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-[var(--accent-green)]`}
      />
      {text && (
        <p className="text-white mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-center px-4">
          {text}
        </p>
      )}
    </div>
  );
}
