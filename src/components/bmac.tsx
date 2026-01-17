import { Coffee } from "lucide-react";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

export function BuyMeACoffee() {
  return (
    <a href="https://buymeacoffee.com/aiken.si" target="_blank" className={cn(buttonVariants({ size: "icon", variant: "outline" }))}>
      <Coffee />
    </a>
  )
}