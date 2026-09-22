import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InteractiveMap } from '@/components/interactive-map';
import { TaskCard } from '@/components/task-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BottomTabInset,
  BrandColors,
  Elevation,
  MaxContentWidth,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { mockTasks, WAREHOUSE_COORDS } from '@/data/mock-tasks';
import { useTheme } from '@/hooks/use-theme';

// Placeholder until Story 3 (service area) / real geolocation supplies this.
const SERVICE_AREA = 'Brunswick, VIC';

const SHEET_COLLAPSED_RATIO = 0.16;
const SHEET_DEFAULT_RATIO = 0.46;
const SHEET_EXPANDED_RATIO = 0.88;
const FLING_VELOCITY_THRESHOLD = 500;

const RADIUS_OPTIONS: { label: string; km: number | null }[] = [
  { label: '5 km', km: 5 },
  { label: '10 km', km: 10 },
  { label: '20 km', km: 20 },
  { label: 'All', km: null },
];

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function nearestSnapPoint(value: number, points: number[]) {
  'worklet';
  return points.reduce((closest, point) =>
    Math.abs(point - value) < Math.abs(closest - value) ? point : closest
  );
}

export default function NearbyScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [radiusKm, setRadiusKm] = useState<number | null>(RADIUS_OPTIONS[0].km);
  // The sheet's snap points are a % of the map area, not the full window —
  // the docked header above the map shortens that area, so measure it directly
  // instead of assuming it's the whole screen.
  const [mapAreaHeight, setMapAreaHeight] = useState(windowHeight);

  const tasks = mockTasks
    .filter((task) => radiusKm === null || task.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const mapMarkers = [
    { ...WAREHOUSE_COORDS, color: BrandColors.white },
    ...tasks
      .filter((task) => task.urgency === 'urgent')
      .map((task) => ({ ...task.orgCoords, color: BrandColors.red })),
    ...tasks
      .filter((task) => task.urgency !== 'urgent')
      .map((task) => ({ ...task.orgCoords, color: '#8a8d99' })),
  ];

  const collapsedHeight = Math.round(mapAreaHeight * SHEET_COLLAPSED_RATIO);
  const defaultHeight = Math.round(mapAreaHeight * SHEET_DEFAULT_RATIO);
  const expandedHeight = Math.round(mapAreaHeight * SHEET_EXPANDED_RATIO);
  const snapPoints = [collapsedHeight, defaultHeight, expandedHeight];

  const sheetHeight = useSharedValue(defaultHeight);
  const dragStartHeight = useSharedValue(defaultHeight);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      dragStartHeight.value = sheetHeight.value;
    })
    .onUpdate((event) => {
      sheetHeight.value = clamp(
        dragStartHeight.value - event.translationY,
        collapsedHeight,
        expandedHeight
      );
    })
    .onEnd((event) => {
      let target = nearestSnapPoint(sheetHeight.value, snapPoints);
      if (event.velocityY < -FLING_VELOCITY_THRESHOLD) {
        target = snapPoints[Math.min(snapPoints.indexOf(target) + 1, snapPoints.length - 1)];
      } else if (event.velocityY > FLING_VELOCITY_THRESHOLD) {
        target = snapPoints[Math.max(snapPoints.indexOf(target) - 1, 0)];
      }
      sheetHeight.value = withSpring(target, { damping: 22, stiffness: 220 });
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({ height: sheetHeight.value }));

  return (
    <GestureHandlerRootView style={styles.screen}>
      <ThemedView type="canvasNavy" style={styles.screen}>
        <StatusBar style="light" />

        {/*
          A native WebView composites as its own always-on-top surface on iOS/Android
          and ignores normal sibling paint order (even zIndex/elevation), so this bar
          can't float translucently over the map the way it can over a plain image —
          it's docked above the map instead, in normal flex flow, so the two never
          overlap in the native view hierarchy.
        */}
        <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.topBarContent}>
            <View style={styles.locationBadge}>
              <SymbolView
                name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
                tintColor={theme.primaryText}
                size={11}
              />
              <ThemedText style={styles.locationBadgeLabel} themeColor="primaryText">
                {SERVICE_AREA}
              </ThemedText>
            </View>

            <View style={styles.filterRow}>
              {RADIUS_OPTIONS.map((option) => {
                const selected = option.km === radiusKm;
                return (
                  <Pressable
                    key={option.label}
                    onPress={() => setRadiusKm(option.km)}
                    style={[
                      styles.chip,
                      Elevation.level1,
                      {
                        backgroundColor: selected ? theme.primary : 'rgba(20,26,67,0.75)',
                        borderColor: selected ? theme.primary : 'rgba(255,255,255,0.25)',
                      },
                    ]}
                  >
                    <ThemedText
                      style={[styles.chipLabel, { opacity: selected ? 1 : 0.85 }]}
                      themeColor="primaryText"
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View
          style={styles.mapArea}
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;
            setMapAreaHeight(height);
            // Reanimated shared value: `.value` assignment is the correct way to
            // update it and doesn't participate in React's render/effect purity model.
            // eslint-disable-next-line react-hooks/immutability
            sheetHeight.value = Math.round(height * SHEET_DEFAULT_RATIO);
          }}
        >
          <InteractiveMap markers={mapMarkers} style={styles.mapImage} />

          <Animated.View style={[styles.sheet, Elevation.level2, animatedSheetStyle]}>
            <GestureDetector gesture={panGesture}>
              <View style={styles.sheetHandleArea}>
                <View style={styles.sheetHandle} />
              </View>
            </GestureDetector>
            <FlatList
              style={styles.list}
              alwaysBounceHorizontal={false}
              directionalLockEnabled
              data={tasks}
              keyExtractor={(task) => task.id}
              renderItem={({ item }) => <TaskCard task={item} />}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <ThemedText style={styles.emptyState} themeColor="mute">
                  No runs within this radius — try widening your search.
                </ThemedText>
              }
            />
          </Animated.View>
        </View>
      </ThemedView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  mapArea: {
    flex: 1,
  },
  mapImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBar: {
    alignItems: 'center',
  },
  topBarContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.half,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.half + 1,
    marginBottom: Spacing.sm,
  },
  locationBadgeLabel: {
    ...Typography.caption,
    opacity: 0.9,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  chip: {
    borderRadius: Radius.full,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
  },
  chipLabel: {
    ...Typography.bodySm,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  sheetHandleArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxs,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: '#e0e1e6',
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: BottomTabInset + Spacing.md,
  },
  separator: {
    height: Spacing.sm,
  },
  emptyState: {
    ...Typography.bodyMd,
    textAlign: 'center',
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
});
