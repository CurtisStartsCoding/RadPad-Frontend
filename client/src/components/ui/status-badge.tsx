import { cn } from "@/lib/utils";

type StatusType = 'pending_admin' | 'pending_radiology' | 'scheduled' | 'completed' | 'cancelled';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig = {
  pending_admin: {
    bgColor: "bg-amber-100",
    textColor: "text-amber-800",
    label: "Pending Admin"
  },
  pending_radiology: {
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    label: "Pending Radiology"
  },
  scheduled: {
    bgColor: "bg-slate-100",
    textColor: "text-slate-800",
    label: "Scheduled"
  },
  completed: {
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    label: "Completed"
  },
  cancelled: {
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    label: "Cancelled"
  }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      config.bgColor,
      config.textColor,
      className
    )}>
      {config.label}
    </span>
  );
}
