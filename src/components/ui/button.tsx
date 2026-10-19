import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3e63dd] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#3e63dd] text-white shadow-xs hover:bg-[#3451b2] active:bg-[#2f469e]",
        destructive:
          "bg-red-600 text-white shadow-xs hover:bg-red-500 active:bg-red-700",
        outline:
          "border border-[#e5e7eb] bg-white hover:bg-gray-50 text-[#111827] shadow-xs active:bg-gray-100",
        secondary:
          "bg-gray-100 text-[#111827] hover:bg-gray-200/80 active:bg-gray-200",
        ghost:
          "hover:bg-gray-100 hover:text-[#111827] text-[#4b5563] active:bg-gray-200/60",
        link: "text-[#3e63dd] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 rounded px-2.5 text-xs",
        lg: "h-10 rounded-md px-6",
        icon: "h-8 w-8",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
