import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-600 text-white shadow hover:bg-indigo-500",
        secondary:
          "border-zinc-800 bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
        destructive:
          "border-red-900/50 bg-red-950/60 text-red-400 hover:bg-red-900/80",
        outline: "text-zinc-300 border-zinc-800",
        success:
          "border-emerald-900/50 bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/80",
        warning:
          "border-amber-900/50 bg-amber-950/60 text-amber-400 hover:bg-amber-900/80",
        purple:
          "border-purple-900/50 bg-purple-950/60 text-purple-400 hover:bg-purple-900/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
