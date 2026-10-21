import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Elevation, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { teamLabel } from '@/lib/teams';
import { Task, TaskUrgency } from '@/types/task';

const URGENCY_LABEL: Record<TaskUrgency, string> = {
  urgent: 'Urgent',
  soon: 'This week',
  flexible: 'Flexible',
};

type TaskCardProps = {
  task: Task;
  /** Omit to render the card without an accept action (e.g. the Home summary list). */
  onAccept?: () => void;
  accepted?: boolean;
  /** Shown on a disabled button instead of "Accept run", e.g. when the trip is full. */
  acceptBlockedReason?: string;
  /** True while this card is the target of a just-tapped map pin. */
  highlighted?: boolean;
};

export function TaskCard({
  task,
  onAccept,
  accepted,
  acceptBlockedReason,
  highlighted,
}: TaskCardProps) {
  const theme = useTheme();
  const isUrgent = task.urgency === 'urgent';
  const blocked = !accepted && acceptBlockedReason !== undefined;

  return (
    <ThemedView
      type="canvas"
      style={[styles.card, Elevation.level1, highlighted && { borderColor: theme.primary }]}
    >
      <View style={styles.headerRow}>
        <ThemedText style={styles.typeLabel} themeColor="ink">
          {task.itemType}
        </ThemedText>
        <View style={styles.urgencyRow}>
          {isUrgent && <View style={[styles.urgencyDot, { backgroundColor: theme.primary }]} />}
          <ThemedText
            style={[styles.urgencyLabel, isUrgent && styles.urgencyLabelUrgent]}
            themeColor={isUrgent ? 'primary' : 'mute'}
          >
            {URGENCY_LABEL[task.urgency]}
          </ThemedText>
        </View>
      </View>

      {task.orgName && (
        <ThemedText style={styles.orgName} themeColor="ink">
          {task.orgName}
        </ThemedText>
      )}
      <ThemedText style={styles.itemSummary} themeColor="body">
        {task.itemSummary}
      </ThemedText>
      <View style={[styles.teamTag, { backgroundColor: theme.canvasSoft }]}>
        <ThemedText style={styles.teamTagLabel} themeColor="ink">
          {teamLabel(task.team)}
        </ThemedText>
      </View>

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
            {task.dropoffAddress}
          </ThemedText>
        </View>
      </View>

      <View style={styles.metaRow}>
        {task.distanceKm !== undefined && (
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
        )}
        {task.minutesToPickup !== undefined && (
          <View style={styles.metaItem}>
            <SymbolView
              name={{ ios: 'car.fill', android: 'directions_car', web: 'directions_car' }}
              tintColor={theme.mute}
              size={14}
            />
            <ThemedText style={styles.metaText} themeColor="mute">
              ~{task.minutesToPickup} min drive
            </ThemedText>
          </View>
        )}
        {task.packageSize && (
          <View style={styles.metaItem}>
            <SymbolView
              name={{ ios: 'shippingbox', android: 'inventory_2', web: 'inventory_2' }}
              tintColor={theme.mute}
              size={14}
            />
            <ThemedText style={styles.metaText} themeColor="mute">
              {task.packageSize.charAt(0).toUpperCase() + task.packageSize.slice(1)} package
            </ThemedText>
          </View>
        )}
      </View>

      {onAccept && (
        <Pressable
          onPress={onAccept}
          disabled={accepted || blocked}
          style={[
            styles.acceptButton,
            { backgroundColor: accepted || blocked ? theme.canvasSoft : theme.primary },
          ]}
        >
          <ThemedText
            style={styles.acceptButtonLabel}
            themeColor={accepted || blocked ? 'mute' : 'primaryText'}
          >
            {accepted ? 'Added to My Route' : (acceptBlockedReason ?? 'Accept run')}
          </ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  teamTag: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    marginTop: Spacing.xs,
  },
  teamTagLabel: {
    ...Typography.caption,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
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
    gap: Spacing.xxs,
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
    marginTop: Spacing.xs,
  },
  itemSummary: {
    ...Typography.bodySm,
    marginTop: Spacing.half,
  },
  routeSection: {
    marginTop: Spacing.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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
    height: Spacing.xs,
    marginLeft: 3.25,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: Spacing.md,
    rowGap: Spacing.xxs,
    marginTop: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  metaText: {
    ...Typography.bodySm,
  },
  acceptButton: {
    marginTop: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
  },
  acceptButtonLabel: {
    ...Typography.bodySm,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
});
