import React from "react";
import { View } from "react-native";
import { cn } from "@/utils/cn";

interface ProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

export const Progress = ({ value, className, indicatorClassName }: ProgressProps) => (
  <View className={cn("h-3 w-full overflow-hidden rounded-full bg-gray-100", className)}>
    <View
      className={cn("h-full bg-black", indicatorClassName)}
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </View>
);
