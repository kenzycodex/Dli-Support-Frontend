// components/ui/visually-hidden.tsx

import * as React from "react"
import { cn } from "@/lib/utils"

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
}

const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
          "clip-path-inset-50",
          className
        )}
        style={{
          clipPath: "inset(50%)",
          clip: "rect(1px, 1px, 1px, 1px)",
        }}
        {...props}
      >
        {children}
      </span>
    )
  }
)

VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }