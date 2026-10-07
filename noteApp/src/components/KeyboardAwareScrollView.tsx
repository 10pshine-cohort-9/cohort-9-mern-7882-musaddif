import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type TextInput,
  type ViewStyle,
} from "react-native";

// Comfortable 20-40px gap left between the focused input's bottom edge and
// the top of the keyboard after auto-scrolling.
const KEYBOARD_GAP = 28;

interface KeyboardAwareScrollViewContextValue {
  focusInput: (node: TextInput | null) => void;
}

const KeyboardAwareScrollContext = createContext<KeyboardAwareScrollViewContextValue | null>(null);

function noop() {
  // Outside a KeyboardAwareScrollView inputs do nothing special on focus.
}

export function useKeyboardAwareInput() {
  const value = useContext(KeyboardAwareScrollContext);
  return value ? value.focusInput : noop;
}

interface KeyboardAwareScrollViewProps extends Omit<ScrollViewProps, "contentContainerStyle"> {
  contentContainerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/**
 * A ScrollView that guarantees the currently focused input stays visible above
 * the software keyboard.
 *
 * Why a manual measurement pass is needed: the auth forms are vertically
 * centred via `marginVertical: "auto"`, so whenever the OS does not shrink
 * the window (for example Android Expo Go / edge-to-edge, where
 * `softwareKeyboardLayoutMode` is a build-time setting) the scroll content
 * has no overflow and a plain ScrollView physically cannot scroll a lower
 * field above the keyboard.
 *
 * This component:
 *  - listens to keyboard events for the ACTUAL keyboard height (never a
 *    hardcoded offset),
 *  - while the keyboard is open it adds a bottom inset equal to that real
 *    height, so the form always has room to scroll further even when the
 *    window itself does not resize,
 *  - on focus and on every keyboard show it measures the focused input
 *    (`measureInWindow`) against the ScrollView's visible frame and scrolls
 *    by exactly the needed delta with a KEYBOARD_GAP margin.
 */
export function KeyboardAwareScrollView({
  contentContainerStyle,
  contentStyle,
  children,
  onScroll,
  ...scrollProps
}: KeyboardAwareScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  // A layout-neutral wrapper (flex: 1) that lets us measure the ScrollView's
  // visible frame in window coordinates, since ScrollView's own type does not
  // expose measureInWindow.
  const frameRef = useRef<View>(null);
  const focusedInputRef = useRef<TextInput | null>(null);
  const offsetRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const [keyboardInset, setKeyboardInset] = useState(0);

  const revealFocusedInput = useCallback(() => {
    const node = focusedInputRef.current;
    const frame = frameRef.current;
    if (!node || !frame) {
      return;
    }

    node.measureInWindow((_x, y, _w, height) => {
      frame.measureInWindow((_fx, frameTop, _fw, frameHeight) => {
        const keyboardHeight = keyboardHeightRef.current;
        const windowHeight = Dimensions.get("window").height;
        const keyboardTop = windowHeight - keyboardHeight;
        // Bottom edge of the visible area is where the keyboard starts,
        // unless the ScrollView does not extend that far down the screen.
        const visibleBottom = Math.min(frameTop + frameHeight, keyboardTop);
        const inputBottom = y + height + KEYBOARD_GAP;
        const target = offsetRef.current + Math.max(0, inputBottom - visibleBottom);
        if (target > offsetRef.current) {
          offsetRef.current = target;
          scrollRef.current?.scrollTo({ y: target, animated: true });
        }
      });
    });
  }, []);

  const handleFocusInput = useCallback(
    (node: TextInput | null) => {
      focusedInputRef.current = node;
      if (node) {
        // Wait two frames so the keyboard/layout have settled before measuring.
        requestAnimationFrame(() => {
          requestAnimationFrame(revealFocusedInput);
        });
      }
    },
    [revealFocusedInput]
  );

  useEffect(() => {
    // Android only emits keyboardDidShow/DidHide; iOS also has Will events.
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      keyboardHeightRef.current = event.endCoordinates.height;
      setKeyboardInset(event.endCoordinates.height);
      requestAnimationFrame(() => {
        requestAnimationFrame(revealFocusedInput);
      });
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      keyboardHeightRef.current = 0;
      setKeyboardInset(0);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [revealFocusedInput]);

  const contextValue = useMemo(() => ({ focusInput: handleFocusInput }), [handleFocusInput]);
  const baseContentStyle = StyleSheet.flatten(contentContainerStyle);

  return (
    <KeyboardAwareScrollContext.Provider value={contextValue}>
      <View ref={frameRef} style={styles.fill}>
        <ScrollView
          {...scrollProps}
          ref={scrollRef}
          style={[styles.fill, scrollProps.style]}
          contentContainerStyle={[baseContentStyle, { paddingBottom: keyboardInset }]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(event) => {
            offsetRef.current = event.nativeEvent.contentOffset.y;
            onScroll?.(event);
          }}>
          <View style={contentStyle}>{children}</View>
        </ScrollView>
      </View>
    </KeyboardAwareScrollContext.Provider>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});