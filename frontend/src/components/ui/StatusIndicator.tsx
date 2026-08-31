import { statusColor, cn } from "@/lib/utils"

export const StatusIndicator = ({ status, className }: { status: string, className?: string }) => {
  return (
    <span className={cn("flex h-2 w-2 rounded-full", statusColor(status), className)}>
      <span className={cn("animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-75", statusColor(status))}></span>
    </span>
  );
}
