import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-clip-padding font-medium text-sm outline-none transition-[color,background-color,border-color,box-shadow,transform,opacity] will-change-transform focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-1.5 in-data-[slot=button-group]:rounded-md px-3.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "relative h-7 gap-1 in-data-[slot=button-group]:rounded-md rounded-[min(var(--radius-md),8px)] px-2 text-xs after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "relative h-9 gap-1 in-data-[slot=button-group]:rounded-md rounded-[min(var(--radius-md),10px)] px-3.5 after:absolute after:inset-x-0 after:-inset-y-0.5 after:content-[''] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-12 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-11",
        "icon-xs":
          "relative size-7 in-data-[slot=button-group]:rounded-md rounded-[min(var(--radius-md),8px)] after:absolute after:-inset-2 after:content-[''] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "relative size-9 in-data-[slot=button-group]:rounded-md rounded-[min(var(--radius-md),10px)] after:absolute after:-inset-0.5 after:content-['']",
        "icon-lg": "size-11",
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
  loading = false,
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { loading?: boolean }) {
  return (
    <ButtonPrimitive
      className={cn("relative", buttonVariants({ variant, size, className }))}
      data-loading={loading || undefined}
      disabled={loading || disabled}
      {...props}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5",
          loading && "opacity-0"
        )}
      >
        {children}
      </span>

      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
