import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Elevation, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { teamLabel, TEAM_OPTIONS } from '@/lib/teams';
import { TaskTeam } from '@/types/task';

type Anchor = { x: number; y: number; width: number; height: number };

/**
 * Dropdown for picking one team, or all of them (null). The menu is drawn in a
 * transparent Modal rather than as an absolutely positioned sibling: on Nearby it
 * opens over the map, and a native WebView paints over sibling views regardless of
 * zIndex. A Modal is its own window, so it always lands on top.
 */
export function TeamFilter({
  value,
  onChange,
}: {
  value: TaskTeam | null;
  onChange: (team: TaskTeam | null) => void;
}) {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const buttonRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  function open() {
    // Measured on each open: the button can move (rotation, the header's safe area).
    buttonRef.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
  }

  function choose(team: TaskTeam | null) {
    setAnchor(null);
    onChange(team);
  }

  // Open towards the middle of the screen: line the menu up with the button's left edge
  // when it sits on the left, its right edge when it sits on the right.
  const menuPosition =
    anchor && anchor.x + anchor.width / 2 > windowWidth / 2
      ? { right: windowWidth - (anchor.x + anchor.width) }
      : { left: anchor?.x ?? 0 };

  const options: { value: TaskTeam | null; label: string }[] = [
    { value: null, label: 'All teams' },
    ...TEAM_OPTIONS,
  ];

  return (
    <>
      <Pressable
        ref={buttonRef}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`Team filter: ${value ? teamLabel(value) : 'All teams'}`}
        style={[styles.button, value !== null && { backgroundColor: theme.primary }]}
      >
        <ThemedText style={styles.buttonLabel} themeColor="primaryText" numberOfLines={1}>
          {value ? teamLabel(value) : 'All teams'}
        </ThemedText>
        <SymbolView
          name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
          tintColor={theme.primaryText}
          size={11}
        />
      </Pressable>

      <Modal
        visible={anchor !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setAnchor(null)}
      >
        {/* Tapping anywhere outside the menu closes it. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setAnchor(null)} />
        {anchor && (
          <View
            style={[
              styles.menu,
              Elevation.level2,
              { top: anchor.y + anchor.height + Spacing.xxs, ...menuPosition },
            ]}
          >
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => choose(option.value)}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.option,
                    pressed && { backgroundColor: theme.canvasSoft },
                  ]}
                >
                  <ThemedText
                    style={[styles.optionLabel, selected && styles.optionLabelSelected]}
                    themeColor={selected ? 'primary' : 'ink'}
                  >
                    {option.label}
                  </ThemedText>
                  {selected && (
                    <SymbolView
                      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                      tintColor={theme.primary}
                      size={14}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    flexShrink: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.half + 1,
  },
  buttonLabel: {
    ...Typography.caption,
    fontFamily: Typography.bodyMdStrong.fontFamily,
    flexShrink: 1,
  },
  menu: {
    position: 'absolute',
    minWidth: 240,
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    paddingVertical: Spacing.half,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  optionLabel: {
    ...Typography.bodySm,
  },
  optionLabelSelected: {
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
});
