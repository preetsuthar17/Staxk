"use client";

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import { mergeProps } from "@base-ui/react/merge-props";
import type { VariantProps } from "class-variance-authority";
import type * as React from "react";
import { isValidElement, type ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

function AlertDialog({ ...props }: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({
  children,
  render,
  ...props
}: AlertDialogPrimitive.Trigger.Props) {
  if (render !== undefined) {
    return (
      <AlertDialogPrimitive.Trigger
        data-slot="alert-dialog-trigger"
        render={render}
        {...props}
      />
    );
  }

  if (
    isValidElement(children) &&
    children.type &&
    typeof children.type === "function" &&
    (children.type.name === "Button" ||
      (children.props as { variant?: unknown; size?: unknown })?.variant !==
        undefined ||
      (children.props as { variant?: unknown; size?: unknown })?.size !==
        undefined)
  ) {
    const buttonProps = children.props as {
      variant?: VariantProps<typeof buttonVariants>["variant"];
      size?: VariantProps<typeof buttonVariants>["size"];
      className?: string;
      disabled?: boolean;
      loading?: boolean;
      children?: ReactNode;
      [key: string]: unknown;
    };
    const {
      variant = "default",
      size = "default",
      className,
      ...restProps
    } = buttonProps;

    return (
      <AlertDialogPrimitive.Trigger
        data-slot="alert-dialog-trigger"
        render={(triggerProps) => (
          <button
            {...mergeProps<"button">(triggerProps, restProps, {
              className: cn(
                "relative",
                buttonVariants({ variant, size, className })
              ),
              disabled: buttonProps.disabled || buttonProps.loading,
            })}
          >
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
                buttonProps.loading && "opacity-0"
              )}
            >
              {buttonProps.children}
            </span>
            {buttonProps.loading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner />
              </span>
            )}
          </button>
        )}
        {...props}
      />
    );
  }

  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props}>
      {children}
    </AlertDialogPrimitive.Trigger>
  );
}

function AlertDialogPortal({ ...props }: AlertDialogPrimitive.Portal.Props) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  );
}

function AlertDialogOverlay({
  className,
  ...props
}: AlertDialogPrimitive.Backdrop.Props) {
  return (
    <AlertDialogPrimitive.Backdrop
      className={cn(
        "data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 isolate z-50 bg-black/10 duration-100 data-closed:animate-out data-open:animate-in supports-backdrop-filter:backdrop-blur-xs",
        className
      )}
      data-slot="alert-dialog-overlay"
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  size = "default",
  children,
  ...props
}: AlertDialogPrimitive.Popup.Props & {
  size?: "default" | "sm";
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Popup
        aria-modal="true"
        className={cn(
          "data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-6 rounded-xl bg-background p-6 outline-none ring-1 ring-foreground/10 duration-100 data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-closed:animate-out data-open:animate-in motion-reduce:duration-0 data-[size=default]:sm:max-w-lg",
          className
        )}
        data-size={size}
        data-slot="alert-dialog-content"
        {...props}
      >
        <span aria-live="assertive" className="sr-only">
          Alert dialog opened. Press Escape to close.
        </span>
        {children}
      </AlertDialogPrimitive.Popup>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]",
        className
      )}
      data-slot="alert-dialog-header"
      {...props}
    />
  );
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end",
        className
      )}
      data-slot="alert-dialog-footer"
      {...props}
    />
  );
}

function AlertDialogMedia({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mb-2 inline-flex size-16 items-center justify-center rounded-md bg-muted sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-8",
        className
      )}
      data-slot="alert-dialog-media"
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={cn(
        "font-medium text-lg sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2",
        className
      )}
      data-slot="alert-dialog-title"
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={cn(
        "text-balance text-muted-foreground text-sm md:text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      data-slot="alert-dialog-description"
      {...props}
    />
  );
}

function AlertDialogAction({
  className,
  loading = false,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(className)}
      data-slot="alert-dialog-action"
      loading={loading}
      {...props}
    />
  );
}

function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}: AlertDialogPrimitive.Close.Props &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <AlertDialogPrimitive.Close
      className={cn(className)}
      data-slot="alert-dialog-cancel"
      render={<Button size={size} variant={variant} />}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
