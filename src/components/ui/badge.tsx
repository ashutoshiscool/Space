import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#3e63dd] text-white shadow-xs hover:bg-[#3451b2]",
        secondary:
          "border-[#e5e7eb] bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]",
        destructive:
          "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        outline: "text-[#111827] border-[#e5e7eb]",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
        warning:
          "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
        purple:
          "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100",
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
