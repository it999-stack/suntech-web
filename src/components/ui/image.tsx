import * as React from "react"

import { cn } from "@/lib/utils"

function Image({ className, alt = "", ...props }: React.ComponentProps<"img">) {
  return (
    <img
      data-slot="image"
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("size-full object-cover", className)}
      {...props}
    />
  )
}

export { Image }
