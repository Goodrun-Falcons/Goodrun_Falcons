import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Elevation, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Task, TaskUrgency } from '@/types/task';

const URGENCY_LABEL: Record<TaskUrgency, string> = {
  urgent: 'Urgent',
  soon: 'This week',
  flexible: 'Flexible',
};

function formatDueBy(dueBy: string): string {
  const due = new Date(`${dueBy}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysLeft = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) return 'Due today';
  if (daysLeft === 1) return 'Due tomorrow';
  if (daysLeft <= 6) return `Due in ${daysLeft} days`;
  return `Due ${due.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
}

export function TaskCard({ task }: { task: Task }) {
  const theme = useTheme();
  const isUrgent = task.urgency === 'urgent';

  return (
    <ThemedView type="canvas" style={[styles.card, Elevation.level1]}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.typeLabel} themeColor="ink">
          {task.type === 'pickup' ? 'Pickup' : 'Delivery'}
        </ThemedText>
        <View style={styles.urgencyRow}>
          {isUrgent && <View style={[styles.urgencyDot, { backgroundColor: theme.primary }]} />}
          <ThemedText
            style={[styles.urgencyLabel, isUrgent && styles.urgencyLabelUrgent]}
            themeColor={isUrgent ? 'primary' : 'mute'}>
            {URGENCY_LABEL[task.urgency]}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={styles.orgName} themeColor="ink">
        {task.orgName}
      </ThemedText>
      <ThemedText style={styles.itemSummary} themeColor="body">
        {task.itemSummary}
      </ThemedText>

      <View style={styles.routeSection}>
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: theme.ink }]} />
          <ThemedText style={styles.routeText} themeColor="ink" numberOfLines={1}>
            {task.pickupAddress}
          </ThemedText>
        </View>
        <View style={[styles.routeConnector, { backgroundColor: theme.surfacePressed }]} />
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, styles.routeDotOutline, { borderColor: theme.ink }]} />
          <ThemedText style={styles.routeText} themeColor="ink" numberOfLines={1}>
            {task.deliveryAddress}
          </ThemedText>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <SymbolView
            name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
            tintColor={theme.mute}
            size={14}
          />
          <ThemedText style={styles.metaText} themeColor="mute">
            {task.distanceKm.toFixed(1)} km away
          </ThemedText>
        </View>
        <View style={styles.metaItem}>
          <SymbolView
            name={{ ios: 'car.fill', android: 'directions_car', web: 'directions_car' }}
            tintColor={theme.mute}
            size={14}
          />
          <ThemedText style={styles.metaText} themeColor="mute">
            ~{task.etaMinutes} min drive
          </ThemedText>
        </View>
        <View style={styles.metaItem}>
          <SymbolView
            name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
            tintColor={theme.mute}
            size={14}
          />
          <ThemedText style={styles.metaText} themeColor="mute">
            {formatDueBy(task.dueBy)}
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeLabel: {
    ...Typography.bodySm,
    fontFamily: Typography.bodyMdStrong.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  urgencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half + 2,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  urgencyLabel: {
    ...Typography.bodySm,
  },
  urgencyLabelUrgent: {
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
  orgName: {
    ...Typography.bodyMdStrong,
    marginTop: Spacing.two,
  },
  itemSummary: {
    ...Typography.bodySm,
    marginTop: Spacing.half,
  },
  routeSection: {
    marginTop: Spacing.three,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  routeText: {
    ...Typography.bodySm,
    flex: 1,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeDotOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  routeConnector: {
    width: 1.5,
    height: Spacing.two,
    marginLeft: 3.25,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: Spacing.three,
    rowGap: Spacing.one,
    marginTop: Spacing.three,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half + 2,
  },
  metaText: {
    ...Typography.bodySm,
  },
});
