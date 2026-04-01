import React from "react";
import { ActivityIndicator, Pressable, PressableProps, Text } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-2xl px-4 py-3 active:opacity-75",
  {
    variants: {
      variant: {
        default: "bg-black",
        outline: "border-2 border-gray-200 bg-white",
        ghost: "bg-transparent",
        danger: "bg-red-500",
        primary: "bg-indigo-600",
      },
      size: {
        default: "h-12",
        sm: "h-10 px-3",
        lg: "h-14 px-8 rounded-3xl",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

interface ButtonProps extends PressableProps, VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export const Button = ({ children, variant, size, className, loading, disabled, ...props }: ButtonProps) => (
  <Pressable
    className={cn(buttonVariants({ variant, size, className }), disabled || loading ? "opacity-50" : "")}
    disabled={!!loading || !!disabled}
    {...props}
  >
    {loading ? (
      <ActivityIndicator color={variant === "outline" || variant === "ghost" ? "#000" : "#fff"} />
    ) : typeof children === "string" ? (
      <Text
        className={cn(
          "font-black text-center",
          variant === "outline" || variant === "ghost" ? "text-black" : "text-white",
          size === "sm" ? "text-sm" : "text-base"
        )}
      >
        {children}
      </Text>
    ) : (
      children
    )}
  </Pressable>
);
