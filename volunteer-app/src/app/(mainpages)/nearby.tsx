import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TaskCard } from '@/components/task-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { mockTasks, WAREHOUSE_COORDS } from '@/data/mock-tasks';
import { useTheme } from '@/hooks/use-theme';
import { buildTaskMapUrl } from '@/lib/static-map';

// Placeholder until Story 3 (service area) / real geolocation supplies this.
const SERVICE_AREA = 'Brunswick, VIC';

const MAP_HEIGHT = 200;

const RADIUS_OPTIONS: { label: string; km: number | null }[] = [
  { label: '5 km', km: 5 },
  { label: '10 km', km: 10 },
  { label: '20 km', km: 20 },
  { label: 'All', km: null },
];

export default function NearbyScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [radiusKm, setRadiusKm] = useState<number | null>(RADIUS_OPTIONS[0].km);

  const tasks = mockTasks
    .filter((task) => radiusKm === null || task.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const mapWidth = Math.round(Math.min(windowWidth, MaxContentWidth) - Spacing.md * 2);
  const mapUrl = buildTaskMapUrl(
    WAREHOUSE_COORDS,
    tasks.filter((task) => task.urgency === 'urgent').map((task) => task.orgCoords),
    tasks.filter((task) => task.urgency !== 'urgent').map((task) => task.orgCoords),
    { width: mapWidth, height: MAP_HEIGHT }
  );

  return (
    <ThemedView type="canvasSoft" style={styles.screen}>
      <StatusBar style="light" />

      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.md, backgroundColor: theme.secondary },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.title} themeColor="primaryText">
              Nearby runs
            </ThemedText>
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
          </View>
          <ThemedText style={styles.subtitle} themeColor="primaryText">
            {radiusKm === null
              ? 'Showing all runs, sorted by distance'
              : `Showing runs within ${radiusKm} km of your location`}
          </ThemedText>

          <View style={[styles.mapContainer, { height: MAP_HEIGHT }]}>
            {mapUrl ? (
              <Image source={{ uri: mapUrl }} style={styles.mapImage} contentFit="cover" />
            ) : (
              <View style={styles.mapFallback}>
                <SymbolView
                  name={{ ios: 'map', android: 'map', web: 'map' }}
                  tintColor="rgba(255,255,255,0.4)"
                  size={20}
                />
                <ThemedText style={styles.mapFallbackLabel} themeColor="primaryText">
                  Map preview needs a Mapbox access token
                </ThemedText>
              </View>
            )}
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
                    {
                      backgroundColor: selected ? theme.primary : 'transparent',
                      borderColor: selected ? theme.primary : 'rgba(255,255,255,0.2)',
                    },
                  ]}
                >
                  <ThemedText
                    style={[styles.chipLabel, { opacity: selected ? 1 : 0.7 }]}
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  header: {
    alignItems: 'center',
  },
  headerContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...Typography.displayMd,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.half + 1,
  },
  locationBadgeLabel: {
    ...Typography.caption,
    opacity: 0.75,
  },
  subtitle: {
    ...Typography.bodySm,
    opacity: 0.6,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  mapContainer: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapFallback: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxs,
  },
  mapFallbackLabel: {
    ...Typography.caption,
    opacity: 0.6,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  chip: {
    borderRadius: Radius.full,
    borderWidth: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
  },
  chipLabel: {
    ...Typography.bodySm,
    fontFamily: Typography.bodyMdStrong.fontFamily,
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
