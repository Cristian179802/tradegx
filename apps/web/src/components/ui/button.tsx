import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ── Button ───────────────────────────────────────────────────────────────────
// Materialul (lumină stratificată, masă la apăsare, sheen, bloom) trăiește în
// clasele .tg-btn-* din globals.css. Aici stau doar forma și dimensiunile.
//
// Fundalul e declarat acolo în `:where()`, cu specificitate 0 — deci un
// `className="bg-emerald-600"` pus la locul folosirii câștigă în continuare, iar
// butoanele cu culoare semantică proprie nu se strică. Materialul se aplică
// oricum peste ele.
//
// Rază mai mare (rounded-xl în loc de rounded-md): 6px citește ca bootstrap
// vechi; 12px e limbajul actual.

const buttonVariants = cva(
  // `tg-tap` da fiecarui buton o zona de atins de minim 44×44 pe ecrane
  // tactile, fara sa-i schimbe aspectul. Aici, in componenta comuna, in loc de
  // cateva zeci de locuri: variantele „sm" (36px) si „icon" (32px) sunt sub
  // pragul la care un deget nimereste constant.
  "tg-tap tg-btn inline-flex items-center justify-center whitespace-nowrap text-sm ring-offset-background focus-visible:outline-none disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default: "tg-btn-primary",
        destructive: "tg-btn-destructive",
        outline: "tg-btn-outline",
        secondary: "tg-btn-secondary",
        ghost: "tg-btn-ghost",
        // Link-ul rămâne text: nu are material, deci nici sheen.
        link: "text-indigo-400 underline-offset-4 hover:underline hover:text-indigo-300",
      },
      size: {
        // Înălțimile respectă minimul de ~40px pentru atins pe telefon.
        default: "h-10 px-4 rounded-xl",
        sm: "h-9 px-3.5 rounded-lg text-[13px]",
        lg: "h-12 px-7 rounded-xl text-base",
        icon: "h-10 w-10 rounded-xl",
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
