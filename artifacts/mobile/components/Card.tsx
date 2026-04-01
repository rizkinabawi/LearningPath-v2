import React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "@/utils/cn";

interface CardProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className, ...props }: CardProps) => (
  <View className={cn("bg-white rounded-[2.5rem] shadow-sm overflow-hidden", className)} {...props}>
    {children}
  </View>
);

export const CardHeader = ({ children, className, ...props }: CardProps) => (
  <View className={cn("p-6 pb-2", className)} {...props}>{children}</View>
);

export const CardTitle = ({ children, className, ...props }: CardProps) => (
  <View className={cn("font-black tracking-tight", className)} {...props}>{children}</View>
);

export const CardContent = ({ children, className, ...props }: CardProps) => (
  <View className={cn("p-6 pt-0", className)} {...props}>{children}</View>
);
