import { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import NavigationBar, {
  NAVIGATION_HEIGHT,
} from '@/components/navi-bar';
import { Colors, Spacing } from '@/constants/theme';

export default function NavigationLayout() {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const bottomGap = insets.bottom + Spacing.xs;

  const bottomSpace = keyboardVisible
    ? 0
    : NAVIGATION_HEIGHT + bottomGap + Spacing.xs;

  return (
    <View style={styles.container}>
      <View style={[styles.pages, { paddingBottom: bottomSpace }]}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>

      {!keyboardVisible && (
        <View
          pointerEvents="box-none"
          style={[
            styles.navigation,
            {
              bottom: bottomGap,
              left: Math.max(insets.left, Spacing.md),
              right: Math.max(insets.right, Spacing.md),
            },
          ]}
        >
          <NavigationBar />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.canvasSoft,
  },

  pages: {
    flex: 1,
  },

  navigation: {
    position: 'absolute',
  },
});