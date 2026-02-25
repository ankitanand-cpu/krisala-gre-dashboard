import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  className = "",
}: StatCardProps) {
  return (
    <Card className={`bg-[var(--bg-surface)] border-white/20 ${className}`}>
      <CardContent className="p-4 sm:p-6 md:p-8 text-center">
        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 md:mb-6 rounded-xl bg-[var(--accent-green)] flex items-center justify-center">
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[var(--bg-primary)]" />
        </div>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3">
          {value}
        </h3>
        <p className="text-sm sm:text-base text-white/80 font-medium">
          {title}
        </p>
      </CardContent>
    </Card>
  );
}
