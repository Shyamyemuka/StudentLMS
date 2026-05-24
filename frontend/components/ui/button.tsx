import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-base font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-card text-foreground border-[3px] border-border shadow-hard-md hover:bg-accent hover:text-accent-foreground btn-sketch-interactive active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
        destructive:
          "bg-destructive text-destructive-foreground border-[3px] border-border shadow-hard-md hover:bg-destructive/90 btn-sketch-interactive active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
        outline:
          "border-[3px] border-border bg-transparent shadow-hard-sm hover:bg-muted btn-sketch-interactive active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        secondary:
          "bg-muted text-foreground border-[3px] border-border shadow-hard-md hover:bg-secondary hover:text-secondary-foreground btn-sketch-interactive active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
        ghost:
          "hover:bg-muted hover:text-foreground rounded-md",
        link: "text-secondary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-md gap-1.5 px-3",
        lg: "h-13 rounded-md px-8 text-lg",
        icon: "size-11 flex items-center justify-center",
        "icon-sm": "size-9 flex items-center justify-center",
        "icon-lg": "size-13 flex items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  style,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  // Inject wobbly borders inline for non-link / non-ghost variants
  const wobblyStyle =
    variant !== "link" && variant !== "ghost"
      ? { borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }
      : undefined;

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      suppressHydrationWarning
      style={{ ...wobblyStyle, ...style }}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
