"use client"

import * as React from "react"
import { Checkbox as RadixCheckbox } from "radix-ui"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof RadixCheckbox.Root>) {
  return (
    <RadixCheckbox.Root
      className={cn(
        "h-4 w-4 shrink-0 rounded border border-gray-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary dark:border-gray-600",
        className,
      )}
      {...props}
    >
      <RadixCheckbox.Indicator className="flex items-center justify-center text-white">
        <Check className="h-3 w-3" />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  )
}

export { Checkbox }
