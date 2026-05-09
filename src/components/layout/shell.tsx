import { cn } from "@/lib/utils";

interface ShellProps {
  children: React.ReactNode;
  className?: string;
}

export function Shell({ children, className }: ShellProps) {
  return (
    <div className={cn("flex flex-col gap-6 pb-8", className)}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h1 className="text-xl font-bold text-zinc-100">{title}</h1>
        {description && (
          <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0">{children}</div>
      )}
    </div>
  );
}

interface SectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({ title, description, children, className }: SectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div>
          {title && (
            <h2 className="text-base font-semibold text-zinc-200">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-zinc-500 mt-0.5">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// Skeleton loader for data-heavy sections
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-zinc-800/50",
        className
      )}
    />
  );
}

// Empty state for when there's no data
interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-zinc-500" />
        </div>
      )}
      <h3 className="text-sm font-medium text-zinc-300 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
