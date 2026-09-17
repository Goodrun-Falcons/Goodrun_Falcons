import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { router, usePathname } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import {
  BrandColors,
  Colors,
  Elevation,
  Radius,
  Spacing,
} from '@/constants/theme';

type IconName = ComponentProps<typeof Feather>['name'];

type NavigationItem = {
  label: string;
  icon: IconName;
  path?: '/home' | '/nearby' | '/profile';
  isDelivery?: boolean;
};

const navigationItems: NavigationItem[] = [
  { label: 'Home', icon: 'home', path: '/home' },
  { label: 'Nearby Runs', icon: 'list', path: '/nearby' },
  { label: 'Current Delivery', icon: 'truck', isDelivery: true },
  { label: 'My Route', icon: 'map' },
  { label: 'Profile', icon: 'user', path: '/profile' },
];

export const NAVIGATION_HEIGHT = 88;

type NavigationBarProps = {
  onCurrentDeliveryPress?: () => void;
  onMyRoutePress?: () => void;
};

export default function NavigationBar({
  onCurrentDeliveryPress,
  onMyRoutePress,
}: NavigationBarProps) {
  const pathname = usePathname();
  const [notice, setNotice] = useState('');

  function handlePress(item: NavigationItem) {
    setNotice('');

    if (item.isDelivery) {
      if (onCurrentDeliveryPress) {
        onCurrentDeliveryPress();
      } else {
        setNotice('Current delivery navigation is coming soon.');
      }
      return;
    }

    if (item.path) {
      if (pathname !== item.path) {
        router.navigate(item.path);
      }
      return;
    }

    if (onMyRoutePress) {
      onMyRoutePress();
    } else {
      setNotice('My Route is coming soon.');
    }
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {!!notice && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${notice} Tap to dismiss.`}
          onPress={() => setNotice('')}
          style={styles.notice}
        >
          <ThemedText
            type="small"
            accessibilityLiveRegion="polite"
            style={styles.noticeText}
          >
            {notice}
          </ThemedText>
        </Pressable>
      )}

      <View pointerEvents="none" style={styles.background} />

      <View style={styles.items}>
        {navigationItems.map((item) => {
          const isSelected = item.path === pathname;
          const color = isSelected
            ? BrandColors.red
            : Colors.light.mute;

          if (item.isDelivery) {
            return (
              <View key={item.label} style={styles.deliverySlot}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open current delivery navigation"
                  onPress={() => handlePress(item)}
                  style={({ pressed }) => [
                    styles.deliveryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Feather
                    name={item.icon}
                    size={26}
                    color={BrandColors.white}
                  />
                </Pressable>
              </View>
            );
          }

          return (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isSelected }}
              onPress={() => handlePress(item)}
              style={({ pressed }) => [
                styles.item,
                pressed && styles.pressed,
              ]}
            >
              <Feather name={item.icon} size={22} color={color} />

              <ThemedText
                type="small"
                style={[styles.label, { color }]}
              >
                {item.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: NAVIGATION_HEIGHT,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },

  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: BrandColors.white,
    ...Elevation.level2,
  },

  items: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xs,
  },

  item: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxs,
    paddingVertical: Spacing.xs,
  },

  label: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },

  deliverySlot: {
    flex: 1,
    height: NAVIGATION_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  deliveryButton: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    borderWidth: 4,
    borderColor: BrandColors.white,
    backgroundColor: BrandColors.red,
    alignItems: 'center',
    justifyContent: 'center',
    ...Elevation.level2,
  },

  pressed: {
    opacity: 0.7,
  },

  notice: {
    position: 'absolute',
    bottom: NAVIGATION_HEIGHT + Spacing.xs,
    left: Spacing.xs,
    right: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: BrandColors.navy,
    ...Elevation.level1,
  },

  noticeText: {
    color: BrandColors.white,
    textAlign: 'center',
  },
});