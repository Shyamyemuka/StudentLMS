import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, style, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      style={{
        borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
        ...style,
      }}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/60 selection:bg-primary selection:text-primary-foreground h-11 w-full min-w-0 border-2 border-border bg-background px-4 py-2 text-base transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-bold disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 font-body text-foreground",
        "focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/20",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Input };
