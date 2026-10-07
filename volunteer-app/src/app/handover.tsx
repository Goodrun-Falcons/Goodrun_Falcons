import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Radius, Spacing, Typography } from '@/constants/theme';
import { useTrip } from '@/context/trip-context';
import { useTheme } from '@/hooks/use-theme';

const CHECKLIST_ITEMS = ['Items match the request', 'Quantity verified', 'Items in good condition'];

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function HandoverScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { stopId } = useLocalSearchParams<{ stopId: string }>();
  const { stops, completeStop } = useTrip();
  const stop = stops.find((s) => s.id === stopId);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState<Date | null>(null);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(() =>
    CHECKLIST_ITEMS.map(() => false)
  );
  const [done, setDone] = useState(false);

  const allChecked = checkedItems.every(Boolean);
  const canConfirm = photoUri !== null && allChecked;

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Camera access needed',
        'Enable camera access in Settings to photograph items during handover.'
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled || !result.assets?.[0]) return;
    setPhotoUri(result.assets[0].uri);
    setCapturedAt(new Date());
  }

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo library access needed',
        'Enable photo library access in Settings to choose an item photo.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setPhotoUri(result.assets[0].uri);
    setCapturedAt(new Date());
  }

  function toggleChecklistItem(index: number) {
    setCheckedItems((prev) => prev.map((checked, i) => (i === index ? !checked : checked)));
  }

  function confirmHandover() {
    if (!canConfirm) return;
    if (stop) completeStop(stop.id);
    setDone(true);
  }

  if (!stop) {
    return (
      <ThemedView type="canvasSoft" style={styles.missingScreen}>
        <StatusBar style="dark" />
        <ThemedText style={styles.missingText} themeColor="mute">
          This stop is no longer in your route.
        </ThemedText>
        <Pressable
          onPress={() => router.back()}
          style={[styles.doneButton, { backgroundColor: theme.primary }]}
        >
          <ThemedText style={styles.doneButtonLabel} themeColor="primaryText">
            Back to route
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const isPickup = stop.type === 'pickup';

  if (done) {
    return (
      <ThemedView type="canvas" style={styles.doneScreen}>
        <StatusBar style="dark" />
        <View style={styles.doneIcon}>
          <SymbolView
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            tintColor="#1a8a5a"
            size={36}
          />
        </View>
        <ThemedText style={styles.doneTitle} themeColor="ink">
          {isPickup ? 'Pickup confirmed!' : 'Drop-off confirmed!'}
        </ThemedText>
        <ThemedText style={styles.doneBody} themeColor="mute">
          Photo recorded · {capturedAt ? formatTime(capturedAt) : ''}
        </ThemedText>
        <ThemedText style={styles.doneBody} themeColor="mute">
          {stop.org} has been notified.
        </ThemedText>
        <Pressable
          onPress={() => router.back()}
          style={[styles.doneButton, { backgroundColor: theme.primary }]}
        >
          <ThemedText style={styles.doneButtonLabel} themeColor="primaryText">
            Back to route
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="canvasSoft" style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              tintColor={BrandColors.white}
              size={16}
            />
          </Pressable>
          <ThemedText style={styles.headerTitle} themeColor="primaryText">
            {isPickup ? 'Confirm Pickup' : 'Confirm Drop-off'}
          </ThemedText>
        </View>
        <ThemedText style={styles.headerSubtitle} themeColor="primaryText">
          {stop.org} · {stop.item}
        </ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Pressable
          onPress={takePhoto}
          style={[styles.photoBox, photoUri !== null && styles.photoBoxCaptured]}
        >
          {photoUri ? (
            <>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <View style={styles.photoCaptionOverlay}>
                <ThemedText style={styles.photoCaptionText}>Tap to retake</ThemedText>
              </View>
              {capturedAt && (
                <View style={styles.timestampBadge}>
                  <ThemedText style={styles.timestampLabel}>
                    Auto-timestamped · {formatTime(capturedAt)}
                  </ThemedText>
                </View>
              )}
            </>
          ) : (
            <View style={styles.photoPlaceholder}>
              <View style={styles.photoPlaceholderIcon}>
                <SymbolView
                  name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
                  tintColor={theme.primary}
                  size={24}
                />
              </View>
              <ThemedText style={styles.photoPlaceholderTitle} themeColor="ink">
                Tap to take photo
              </ThemedText>
              <ThemedText style={styles.photoPlaceholderSubtitle} themeColor="mute">
                {isPickup ? 'Show items being collected' : 'Show items being dropped off'}
              </ThemedText>
            </View>
          )}
        </Pressable>

        <View style={styles.checklistCard}>
          <ThemedText style={styles.checklistTitle} themeColor="ink">
            Handover checklist
          </ThemedText>
          {CHECKLIST_ITEMS.map((item, i) => (
            <Pressable
              key={item}
              onPress={() => toggleChecklistItem(i)}
              style={[
                styles.checklistRow,
                i < CHECKLIST_ITEMS.length - 1 && styles.checklistRowBorder,
              ]}
            >
              <View
                style={[
                  styles.checklistBox,
                  checkedItems[i] && {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ]}
              >
                {checkedItems[i] && (
                  <SymbolView
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    tintColor={BrandColors.white}
                    size={11}
                  />
                )}
              </View>
              <ThemedText style={styles.checklistLabel} themeColor="ink">
                {item}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        {photoUri === null ? (
          <>
            <Pressable
              onPress={takePhoto}
              style={[styles.actionButton, { backgroundColor: BrandColors.navy }]}
            >
              <SymbolView
                name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
                tintColor={BrandColors.white}
                size={16}
              />
              <ThemedText style={styles.actionButtonLabel} themeColor="primaryText">
                Take photo
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={pickFromLibrary}
              style={[styles.secondaryActionButton, { borderColor: theme.surfacePressed }]}
            >
              <SymbolView
                name={{
                  ios: 'photo.on.rectangle',
                  android: 'photo_library',
                  web: 'photo_library',
                }}
                tintColor={theme.ink}
                size={16}
              />
              <ThemedText style={styles.secondaryActionButtonLabel} themeColor="ink">
                Choose from library
              </ThemedText>
            </Pressable>
            <ThemedText style={styles.footerHint} themeColor="mute">
              {isPickup
                ? 'A photo is required to confirm this pickup'
                : 'A photo is required to confirm this drop-off'}
            </ThemedText>
          </>
        ) : (
          <>
            <Pressable
              onPress={confirmHandover}
              disabled={!allChecked}
              style={[
                styles.actionButton,
                { backgroundColor: theme.primary, opacity: allChecked ? 1 : 0.5 },
              ]}
            >
              <ThemedText style={styles.actionButtonLabel} themeColor="primaryText">
                {isPickup ? 'Confirm pickup & continue' : 'Confirm drop-off & continue'}
              </ThemedText>
            </Pressable>
            {!allChecked && (
              <ThemedText style={styles.footerHint} themeColor="mute">
                Check off all items to confirm
              </ThemedText>
            )}
          </>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    backgroundColor: BrandColors.navy,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xxs,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.displaySm,
  },
  headerSubtitle: {
    ...Typography.bodySm,
    opacity: 0.6,
    marginLeft: 44,
  },
  body: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  photoBox: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: '#e4e6ef',
    borderStyle: 'dashed',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  photoBoxCaptured: {
    borderStyle: 'solid',
    borderColor: '#1a8a5a',
    backgroundColor: '#edf7f3',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
  },
  photoPlaceholderIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(208,35,39,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  photoPlaceholderTitle: {
    ...Typography.bodyMdStrong,
  },
  photoPlaceholderSubtitle: {
    ...Typography.caption,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoCaptionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  photoCaptionText: {
    ...Typography.bodySm,
    color: '#ffffff',
    backgroundColor: 'rgba(20,26,67,0.6)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.half,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  timestampBadge: {
    position: 'absolute',
    bottom: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: 'rgba(20,26,67,0.8)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.half,
  },
  timestampLabel: {
    ...Typography.caption,
    color: '#ffffff',
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
  checklistCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e6ef',
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  checklistTitle: {
    ...Typography.bodyMdStrong,
    marginBottom: Spacing.xs,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
  },
  checklistRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6ef',
  },
  checklistBox: {
    width: 20,
    height: 20,
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderColor: '#e4e6ef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistLabel: {
    ...Typography.bodySm,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxs,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.sm + 2,
  },
  actionButtonLabel: {
    ...Typography.buttonMd,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxs,
    borderRadius: Radius.xl,
    borderWidth: 2,
    paddingVertical: Spacing.sm,
  },
  secondaryActionButtonLabel: {
    ...Typography.bodySm,
    fontFamily: Typography.bodyMdStrong.fontFamily,
  },
  footerHint: {
    ...Typography.caption,
    textAlign: 'center',
  },
  doneScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  doneIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: '#edf7f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  doneTitle: {
    ...Typography.displayMd,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  doneBody: {
    ...Typography.bodyMd,
    textAlign: 'center',
  },
  doneButton: {
    width: '100%',
    alignItems: 'center',
    borderRadius: Radius.xl,
    paddingVertical: Spacing.sm + 2,
    marginTop: Spacing.lg,
  },
  doneButtonLabel: {
    ...Typography.buttonMd,
  },
  missingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  missingText: {
    ...Typography.bodyMd,
    textAlign: 'center',
  },
});
