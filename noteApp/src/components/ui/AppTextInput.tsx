import { forwardRef, useRef, type ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useKeyboardAwareInput } from "@/components/KeyboardAwareScrollView";
import { palette } from "@/constants/colors";

interface AppTextInputProps extends TextInputProps {
  label?: string;
  required?: boolean;
  error?: boolean | string;
  hint?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const AppTextInput = forwardRef<TextInput, AppTextInputProps>(function AppTextInput(
  {
    label,
    required = false,
    error,
    hint,
    leftIcon,
    rightElement,
    containerStyle,
    inputStyle,
    multiline,
    style,
    onBlur,
    onFocus,
    ...rest
  },
  ref
) {
  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;
  const focusInput = useKeyboardAwareInput();
  const inputRef = useRef<TextInput>(null);

  const setInputRef = (node: TextInput | null) => {
    inputRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputRow,
          multiline && styles.inputRowMultiline,
          hasError && styles.inputRowError,
        ]}>
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          ref={setInputRef}
          placeholderTextColor={palette.placeholder}
          multiline={multiline}
          style={[
            styles.input,
            leftIcon ? styles.inputWithIcon : null,
            multiline ? styles.multilineInput : null,
            inputStyle,
            style,
          ]}
          onFocus={(event) => {
            focusInput(inputRef.current);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            focusInput(null);
            onBlur?.(event);
          }}
          {...rest}
        />
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      {!errorMessage && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#33405f",
  },
  required: {
    color: "#f02e4c",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderWidth: 1,
    borderColor: palette.inputBorder,
    borderRadius: 10,
    backgroundColor: palette.white,
    paddingHorizontal: 12,
  },
  inputRowMultiline: {
    alignItems: "flex-start",
    minHeight: 96,
    paddingVertical: 10,
  },
  inputRowError: {
    borderColor: "#f05b70",
  },
  leftIcon: {
    marginRight: 10,
  },
  rightElement: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: palette.ink,
    fontSize: 14,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  multilineInput: {
    minHeight: 96,
    paddingTop: 0,
    textAlignVertical: "top",
  },
  error: {
    color: palette.danger,
    fontSize: 12,
  },
  hint: {
    color: palette.subtle,
    fontSize: 12,
  },
});
