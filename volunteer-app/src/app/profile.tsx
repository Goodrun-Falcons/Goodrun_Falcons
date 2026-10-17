import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { ThemedText } from '@/components/themed-text';
import { BrandColors, Radius, Spacing, Typography } from '@/constants/theme';

const fieldIcons = {
  fullName: 'person-outline',
  email: 'mail-outline',
  phone: 'phone',
  preferredPackageSize: 'inventory-2',
} as const;

const packageOptions = [
  { value: 'small', title: 'Small', description: 'Fits on one seat' },
  { value: 'medium', title: 'Medium', description: 'Uses the whole back seat' },
  { value: 'large', title: 'Large', description: 'Requires a truck' },
];

const PROFILE_URL = 'https://goodrun-backend.onrender.com/volunteers/me';

const PROFILE_URL = 'https://goodrun-backend.onrender.com/volunteers/me';

type Profile = {
  fullName: string;
  email: string;
  phone: string;
  preferredPackageSize: string;
};

const initialProfile: Profile = {
  fullName: '',
  email: '',
  phone: '',
  preferredPackageSize: '',
};

const fields: { key: keyof Profile; label: string }[] = [
  { key: 'fullName', label: 'Full Name' },
  { key: 'email', label: 'Email Address' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'preferredPackageSize', label: 'Preferred Package Size' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [draft, setDraft] = useState<Profile>(initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setIsLoading(true);
      setError('');

      try {
        const token = await SecureStore.getItemAsync('accessToken');
        if (cancelled) return;

        if (!token) {
          router.replace('/login');
          return;
        }

        const response = await fetch(PROFILE_URL, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (cancelled) return;

        if (response.status === 401) {
          setError('Your session has expired. Please log in again.');
          return;
        }

        if (!response.ok) {
          setError('Unable to load your profile. Please try again.');
          return;
        }

        const data = await response.json();
        if (cancelled) return;

        const loadedProfile: Profile = {
          fullName: data.full_name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          preferredPackageSize: data.preferred_package_size ?? '',
        };

        setProfile(loadedProfile);
        setDraft({ ...loadedProfile });
        setHasLoaded(true);
      } catch {
        if (!cancelled) {
          setError('Unable to connect to the server. Please try again.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [reloadVersion]);

  const values = isEditing ? draft : profile;

  //extract capitalized first letters of surname and given name
  const initials = profile.fullName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function goBack() {
    Keyboard.dismiss();

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  }

  function startEditing() {
    if (isSaving || !hasLoaded) return;

    setDraft({ ...profile });
    setError('');
    setNotice('');
    setShowLogout(false);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft({ ...profile });
    setError('');
    setNotice('');
    setIsEditing(false);
    Keyboard.dismiss();
  }

  const submitProfileRequest = async () => {
    if (isSaving) return;

    const phone = draft.phone.replace(/[\s()-]/g, '');
    const preferredPackageSize = draft.preferredPackageSize;

    setError('');
    setNotice('');

    if (!phone) {
      setError('Please enter your phone number.');
      return;
    }

    if (!/^(?:04\d{8}|\+614\d{8})$/.test(phone)) {
      setError('Please enter a valid Australian mobile number (04xxxxxxxx or +614xxxxxxxx).');
      return;
    }

    if (!['small', 'medium', 'large'].includes(preferredPackageSize)) {
      setError('Please select a preferred package size.');
      return;
    }

    if (phone === profile.phone && preferredPackageSize === profile.preferredPackageSize) {
      setError('You have not made any changes.');
      return;
    }

    setIsSaving(true);
    Keyboard.dismiss();

    try {
      const token = await SecureStore.getItemAsync('accessToken');

      if (!token) {
        setError('Your session has expired. Please log in again.');
        return;
      }

      const response = await fetch(PROFILE_URL, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          preferred_package_size: preferredPackageSize,
        }),
      });

      if (response.status === 401) {
        setError('Your session has expired. Please log in again.');
        return;
      }

      if (!response.ok) {
        setError('Unable to save your profile. Please try again.');
        return;
      }

      const data = await response.json();

      const updatedProfile: Profile = {
        ...profile,
        phone: data.phone ?? phone,
        preferredPackageSize: data.preferred_package_size ?? preferredPackageSize,
      };

      setProfile(updatedProfile);
      setDraft({ ...updatedProfile });
      setIsEditing(false);
      setNotice('Your profile has been updated.');
    } catch {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  function openLogoutConfirmation() {
    Keyboard.dismiss();
    setNotice('');
    setShowLogout(true);
  }

  async function logout() {
    setShowLogout(false);

    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');

      router.replace('/login');
    } catch (error) {
      console.error('Failed to clear authentication tokens:', error);
      setError('Unable to log out. Please try again.');
    }
  }


  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + Spacing.md,
              paddingBottom: insets.bottom + Spacing.xl,
              paddingLeft: Math.max(insets.left, Spacing.lg),
              paddingRight: Math.max(insets.right, Spacing.lg),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                disabled={isSaving}
                onPress={goBack}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              >
                <MaterialIcons name="arrow-back" size={24} color={BrandColors.navy} />
              </Pressable>
              <ThemedText accessibilityRole="header" style={styles.pageTitle}>
                My profile
              </ThemedText>
            </View>

            {isLoading ? (
              <View style={styles.loading} accessibilityLiveRegion="polite">
                <ActivityIndicator color={BrandColors.navy} />
                <ThemedText style={styles.body}>Loading your profile…</ThemedText>
              </View>
            ) : (
              <>
                {hasLoaded && (
                  <>
                    <View style={styles.identity}>
                      <View style={styles.avatar}>
                        {initials ? (
                          <ThemedText style={styles.initials}>{initials}</ThemedText>
                        ) : (
                          <MaterialIcons name="person-outline" size={36} color={BrandColors.navy} />
                        )}
                      </View>
                      <ThemedText accessibilityRole="header" style={styles.name}>
                        {profile.fullName || 'Your profile'}
                      </ThemedText>
                      <ThemedText style={styles.body}>GoodRun volunteer</ThemedText>
                    </View>

                    <View style={styles.informationCard}>
                      <MaterialIcons
                        name={isEditing ? 'edit-note' : 'info-outline'}
                        size={24}
                        color={BrandColors.navy}
                      />
                      <View style={styles.flex}>
                        <ThemedText style={styles.label}>
                          {isEditing ? 'Update your details' : 'Your volunteer details'}
                        </ThemedText>
                        <ThemedText style={styles.hint}>
                          You can update your phone number and preferred package size. Your name and
                          email are read-only.
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.detailsCard}>
                      <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
                        Personal information
                      </ThemedText>
                      {fields.map(({ key, label }, index) => (
                        <View key={key} style={[styles.field, index > 0 && styles.fieldDivider]}>
                          <View style={styles.labelRow}>
                            <MaterialIcons name={fieldIcons[key]} size={19} color="#60646C" />
                            <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
                            {isEditing && (key === 'fullName' || key === 'email') && (
                              <MaterialIcons
                                name="lock-outline"
                                size={16}
                                color="#60646C"
                                accessibilityLabel="Read-only"
                              />
                            )}
                          </View>
                          {isEditing && key === 'preferredPackageSize' ? (
                            <View style={styles.sizeOptions}>
                              {packageOptions.map((option) => {
                                const selected = draft.preferredPackageSize === option.value;
                                return (
                                  <Pressable
                                    key={option.value}
                                    disabled={isSaving}
                                    accessibilityRole="radio"
                                    accessibilityLabel={`${option.title}: ${option.description}`}
                                    accessibilityState={{ checked: selected, disabled: isSaving }}
                                    onPress={() => {
                                      setDraft((previous) => ({
                                        ...previous,
                                        preferredPackageSize: option.value,
                                      }));
                                      setError('');
                                    }}
                                    style={({ pressed }) => [
                                      styles.sizeOption,
                                      selected && styles.selectedSizeOption,
                                      pressed && styles.pressed,
                                    ]}
                                  >
                                    <View style={styles.flex}>
                                      <ThemedText style={styles.label}>{option.title}</ThemedText>
                                      <ThemedText style={styles.hint}>
                                        {option.description}
                                      </ThemedText>
                                    </View>
                                    <MaterialIcons
                                      name={
                                        selected ? 'radio-button-checked' : 'radio-button-unchecked'
                                      }
                                      size={22}
                                      color={BrandColors.navy}
                                    />
                                  </Pressable>
                                );
                              })}
                            </View>
                          ) : isEditing && key === 'phone' ? (
                            <TextInput
                              accessibilityLabel={label}
                              value={draft.phone}
                              editable={!isSaving}
                              onChangeText={(value) => {
                                setDraft((previous) => ({ ...previous, phone: value }));
                                setError('');
                              }}
                              keyboardType="phone-pad"
                              autoComplete="tel"
                              selectionColor={BrandColors.navy}
                              placeholder="04xx xxx xxx"
                              placeholderTextColor="#727581"
                              style={styles.input}
                            />
                          ) : (
                            <ThemedText selectable style={styles.value}>
                              {key === 'preferredPackageSize'
                                ? packageOptions.find((option) => option.value === values[key])
                                    ?.title ||
                                  values[key] ||
                                  'Not provided'
                                : values[key] || 'Not provided'}
                            </ThemedText>
                          )}
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {!!error && (
                  <View
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                    style={styles.message}
                  >
                    <MaterialIcons name="error-outline" size={20} color={BrandColors.navy} />
                    <ThemedText style={[styles.body, styles.flex]}>{error}</ThemedText>
                  </View>
                )}
                {!!notice && (
                  <View accessibilityLiveRegion="polite" style={styles.message}>
                    <MaterialIcons name="check-circle-outline" size={20} color={BrandColors.navy} />
                    <ThemedText style={[styles.body, styles.flex]}>{notice}</ThemedText>
                  </View>
                )}

                {hasLoaded ? (
                  <View style={styles.actions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: isSaving, busy: isSaving }}
                      disabled={isSaving}
                      onPress={isEditing ? submitProfileRequest : startEditing}
                      style={({ pressed }) => [
                        styles.button,
                        styles.primaryButton,
                        (pressed || isSaving) && styles.pressed,
                      ]}
                    >
                      {isSaving ? (
                        <ActivityIndicator color={BrandColors.white} size="small" />
                      ) : (
                        <MaterialIcons
                          name={isEditing ? 'check' : 'edit'}
                          size={20}
                          color={BrandColors.white}
                        />
                      )}
                      <ThemedText style={styles.primaryButtonText}>
                        {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Edit profile'}
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: isSaving }}
                      disabled={isSaving}
                      onPress={isEditing ? cancelEditing : openLogoutConfirmation}
                      style={({ pressed }) => [
                        styles.button,
                        styles.secondaryButton,
                        (pressed || isSaving) && styles.pressed,
                      ]}
                    >
                      {!isEditing && (
                        <MaterialIcons name="logout" size={20} color={BrandColors.navy} />
                      )}
                      <ThemedText style={styles.secondaryButtonText}>
                        {isEditing ? 'Cancel' : 'Log out'}
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setReloadVersion((version) => version + 1)}
                    style={({ pressed }) => [
                      styles.button,
                      styles.primaryButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <ThemedText style={styles.primaryButtonText}>Try again</ThemedText>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showLogout}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogout(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.modalIcon}>
              <MaterialIcons name="logout" size={28} color={BrandColors.navy} />
            </View>
            <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
              Log out of GoodRun?
            </ThemedText>
            <ThemedText style={styles.body}>You can log back in whenever you’re ready.</ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={logout}
              style={({ pressed }) => [
                styles.button,
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <ThemedText style={styles.primaryButtonText}>Log out</ThemedText>
            </Pressable>
            <Pressable
              disabled={isSaving}
              accessibilityRole="button"
              onPress={() => setShowLogout(false)}
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <ThemedText style={styles.secondaryButtonText}>Stay logged in</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.white },
  scrollContent: { flexGrow: 1 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: Spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { ...Typography.displayMd, color: BrandColors.navy, flexShrink: 1 },
  identity: { alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.md },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    backgroundColor: '#EEEFF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  initials: { ...Typography.displayXl, color: BrandColors.navy },
  name: { ...Typography.displayLg, color: BrandColors.navy, textAlign: 'center' },
  body: { ...Typography.bodyMd, color: '#4A4A4A' },
  label: { ...Typography.bodyMdStrong, color: BrandColors.navy },
  hint: { ...Typography.bodySm, color: '#60646C', marginTop: Spacing.xxs },
  flex: { flex: 1 },
  informationCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: '#F5F5F7',
    alignItems: 'flex-start',
  },
  detailsCard: {
    borderWidth: 1,
    borderColor: '#E8E8EA',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: { ...Typography.displaySm, color: BrandColors.navy, paddingVertical: Spacing.md },
  field: { paddingVertical: Spacing.md, gap: Spacing.xs },
  fieldDivider: { borderTopWidth: 1, borderTopColor: '#E8E8EA' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  fieldLabel: { ...Typography.bodySm, color: '#60646C' },
  value: { ...Typography.bodyMd, color: BrandColors.navy, flexShrink: 1 },
  input: {
    ...Typography.bodyMd,
    minHeight: 52,
    color: BrandColors.navy,
    borderWidth: 1,
    borderColor: BrandColors.navy,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  sizeOptions: { gap: Spacing.xs },
  sizeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    minHeight: 64,
    borderWidth: 1,
    borderColor: '#D5D7DF',
    borderRadius: Radius.md,
  },
  selectedSizeOption: { borderColor: BrandColors.navy, backgroundColor: '#F5F5F7' },
  actions: { gap: Spacing.sm },
  button: {
    minHeight: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  primaryButton: { backgroundColor: BrandColors.red },
  secondaryButton: {
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: BrandColors.navy,
  },
  primaryButtonText: {
    ...Typography.buttonMd,
    color: BrandColors.white,
    flexShrink: 1,
    textAlign: 'center',
  },
  secondaryButtonText: {
    ...Typography.buttonMd,
    color: BrandColors.navy,
    flexShrink: 1,
    textAlign: 'center',
  },
  pressed: { opacity: 0.65 },
  message: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: '#F5F5F7',
  },
  loading: { minHeight: 240, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: 'rgba(20,26,67,0.45)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '90%',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    backgroundColor: BrandColors.white,
    gap: Spacing.sm,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
