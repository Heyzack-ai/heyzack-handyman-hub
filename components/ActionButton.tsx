import React from "react";
import { StyleSheet, Text, Pressable, ViewStyle, TextStyle } from "react-native";
import Colors from "@/constants/colors";

type ActionButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export default function ActionButton({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  style,
  textStyle,
}: ActionButtonProps) {
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case "secondary":
        return {
          container: {
            backgroundColor: Colors.light.secondary,
          },
          text: {
            color: "white",
          },
        };
      case "outline":
        return {
          container: {
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: Colors.light.primary,
          },
          text: {
            color: Colors.light.primary,
          },
        };
      case "danger":
        return {
          container: {
            backgroundColor: Colors.light.error,
          },
          text: {
            color: "white",
          },
        };
      default:
        return {
          container: {
            backgroundColor: Colors.light.primary,
          },
          text: {
            color: "white",
          },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case "small":
        return {
          container: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 6,
          },
          text: {
            fontSize: 12,
          },
        };
      case "large":
        return {
          container: {
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 10,
          },
          text: {
            fontSize: 16,
          },
        };
      default:
        return {
          container: {
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
          },
          text: {
            fontSize: 14,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variantStyles.container,
        sizeStyles.container,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          variantStyles.text,
          sizeStyles.text,
          disabled && styles.disabledText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    backgroundColor: Colors.light.gray[300],
    borderColor: Colors.light.gray[300],
  },
  disabledText: {
    color: Colors.light.gray[500],
  },
});