import { CheckCircle2, Clock, XCircle } from "lucide-react";

export type RequestStatus = "pending" | "approved" | "rejected";

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

const statusConfig: Record<
  RequestStatus,
  { color: string; icon: typeof Clock }
> = {
  pending: {
    color: "bg-warning/10 text-warning border-warning/20",
    icon: Clock,
  },
  approved: {
    color: "bg-success/10 text-success border-success/20",
    icon: CheckCircle2,
  },
  rejected: {
    color: "bg-danger/10 text-danger border-danger/20",
    icon: XCircle,
  },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${config.color} ${className}`}
    >
      <Icon className="size-4" />
      <span className="capitalize">{status}</span>
    </div>
  );
}
