import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { LucideIcon } from "lucide-react";

interface InfoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export const InfoCard = React.forwardRef<HTMLDivElement, InfoCardProps>(
  ({ icon: Icon, title, description, children, footer, className, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn("transition-shadow hover:shadow-md", className)} {...props}>
        {(Icon || title || description) && (
          <CardHeader>
            {Icon && (
              <div className="mb-2 w-fit rounded-lg bg-primary/10 p-2">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        {children && <CardContent>{children}</CardContent>}
        {footer && <CardFooter>{footer}</CardFooter>}
      </Card>
    );
  }
);

InfoCard.displayName = "InfoCard";
