import { useEffect, useState } from 'react';
import { Keyboard , Modal , Pressable , ScrollView , StyleSheet , TextInput , View, } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

import { ThemedText } from '@/components/themed-text';
import { BrandColors, FontFamily, Radius, Spacing, } from '@/constants/theme';

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

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
  let cancelled = false;

  async function loadProfile() {
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
    } catch {
      if (!cancelled) {
        setError('Unable to connect to the server. Please try again.');
      }
    }
  }

  loadProfile();

  return () => {
    cancelled = true;
  };
}, []);

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
    if (isSaving) return;

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

    if (
      phone === profile.phone &&
      preferredPackageSize === profile.preferredPackageSize
    ) {
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
        preferredPackageSize:
          data.preferred_package_size ?? preferredPackageSize,
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
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + Spacing.lg,
              paddingLeft: Math.max(insets.left, Spacing.lg),
              paddingRight: Math.max(insets.right, Spacing.lg),
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={goBack}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.backArrow} />
            </Pressable>
          </View>

          <View style={styles.identity}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <ThemedText style={styles.initials}>
                  {initials}
                </ThemedText>
              </View>
            </View>

            <ThemedText type="heading" style={styles.name}>
              {profile.fullName}
            </ThemedText>

            <ThemedText style={styles.subtitle}>
              Active Medical Volunteer
            </ThemedText>
          </View>
        </View>

        <View
          style={[
            styles.form,
            {
              paddingBottom: insets.bottom + Spacing.xxxl,
              paddingLeft: Math.max(insets.left, Spacing.lg),
              paddingRight: Math.max(insets.right, Spacing.lg),
            },
          ]}
        >
          <View style={styles.informationCard}>
            <ThemedText type="smallBold" style={styles.label}>
              {isEditing ? 'Edit Profile' : 'My Profile'}
            </ThemedText>

            <ThemedText style={styles.informationText}>
              You can update your phone number and preferred package size.
              Your name and email address cannot be changed here.
            </ThemedText>
          </View>

          {fields.map(({ key, label }) => (
            <View key={key} style={styles.field}>
              <ThemedText type="smallBold" style={styles.label}>
                {label}
              </ThemedText>

              {key === 'preferredPackageSize' && isEditing ? (
                <View style={styles.sizeOptions}>
                  {['small', 'medium', 'large'].map((size) => (
                    <Pressable
                      key={size}
                      disabled={isSaving}
                      accessibilityRole="radio"
                      accessibilityState={{
                        checked: draft.preferredPackageSize === size,
                        disabled: isSaving,
                      }}
                      onPress={() => {
                        setDraft((previous) => ({
                          ...previous,
                          preferredPackageSize: size,
                        }));
                        setError('');
                      }}
                      style={[
                        styles.sizeOption,
                        draft.preferredPackageSize === size &&
                          styles.selectedSizeOption,
                      ]}
                    >
                      <ThemedText
                        style={{
                          color:
                            draft.preferredPackageSize === size
                              ? BrandColors.white
                              : BrandColors.navy,
                        }}
                      >
                        {size}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <TextInput
                  accessibilityLabel={label}
                  value={values[key]}
                  editable={isEditing && !isSaving && key === 'phone'}
                  onChangeText={(value) => {
                    setDraft((previous) => ({
                      ...previous,
                      [key]: value,
                    }));
                    setError('');
                  }}
                  keyboardType={key === 'phone' ? 'phone-pad' : 'default'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={BrandColors.navy}
                  underlineColorAndroid="transparent"
                  style={[
                    styles.input,
                    isEditing && key === 'phone' && styles.editableInput,
                  ]}
                />
              )}
            </View>
          ))}

          {!!error && (
            <ThemedText
              accessibilityRole="alert"
              style={styles.error}
            >
              {error}
            </ThemedText>
          )}

          {!!notice && (
            <ThemedText
              accessibilityLiveRegion="polite"
              style={styles.notice}
            >
              {notice}
            </ThemedText>
          )}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              accessibilityState={{ disabled: isSaving }}
              onPress={
                isEditing
                  ? submitProfileRequest
                  : startEditing
              }
              
              style={({ pressed }) => [
                styles.button,
                styles.primaryButton,
                isSaving && styles.disabledButton,
                pressed &&
                  !isSaving &&
                  styles.pressed,
              ]}
            >
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
              </ThemedText>
            </Pressable>

            <Pressable
              disabled={isSaving}
              accessibilityRole="button"
              onPress={
                isEditing
                  ? cancelEditing
                  : openLogoutConfirmation
              }
              style={({ pressed }) => [
                styles.button,
                styles.outlineButton,
                pressed && styles.pressed,
              ]}
            >
              <ThemedText
                type="smallBold"
                style={styles.redText}
              >
                {isEditing ? 'Cancel' : 'Log Out'}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showLogout}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogout(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={styles.modalCard}
            accessibilityViewIsModal
          >
            <ThemedText
              type="smallBold"
              style={styles.label}
            >
              Log Out
            </ThemedText>

            <ThemedText style={styles.modalMessage}>
              Are you sure you want to log out?
            </ThemedText>

            <View style={styles.confirmActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowLogout(false)}
                style={({ pressed }) => [
                  styles.confirmButton,
                  pressed && styles.pressed,
                ]}
              >
                <ThemedText
                  type="smallBold"
                  style={styles.label}
                >
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={logout}
                style={({ pressed }) => [
                  styles.confirmButton,
                  pressed && styles.pressed,
                ]}
              >
                <ThemedText
                  type="smallBold"
                  style={styles.redText}
                >
                  Log Out
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.navy,
  },

  scrollContent: {
    flexGrow: 1,
    backgroundColor: BrandColors.white,
  },

  header: {
    backgroundColor: BrandColors.navy,
    paddingBottom: Spacing.xl,
  },

  headerRow: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: {
    width: 12,
    height: 12,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: BrandColors.white,
    transform: [{ rotate: '45deg' }],
  },

  identity: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },

  avatarContainer: {
    width: 96,
    height: 96,
    marginBottom: Spacing.md,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    borderWidth: 3,
    borderColor: BrandColors.white,
    backgroundColor: BrandColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  initials: {
    fontFamily: FontFamily.bold,
    fontSize: 30,
    lineHeight: 42,
    color: BrandColors.navy,
  },

  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: BrandColors.white,
    borderWidth: 3,
    borderColor: BrandColors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cameraBody: {
    width: 19,
    height: 14,
    borderWidth: 2,
    borderColor: BrandColors.navy,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cameraTop: {
    position: 'absolute',
    top: -5,
    width: 9,
    height: 4,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: BrandColors.navy,
  },

  cameraLens: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: BrandColors.navy,
  },

  name: {
    color: BrandColors.white,
    textAlign: 'center',
  },

  subtitle: {
    color: BrandColors.white,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: Spacing.xxs,
  },

  form: {
    width: '100%',
    maxWidth: 568,
    alignSelf: 'center',
    paddingTop: Spacing.lg,
  },

  informationCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BrandColors.navy,
    borderRadius: Radius.lg,
    backgroundColor: BrandColors.white,
  },

  informationText: {
    color: BrandColors.navy,
    marginTop: Spacing.xs,
  },

  previewText: {
    color: BrandColors.navy,
    fontSize: 12,
    lineHeight: 18,
    marginTop: Spacing.sm,
  },

  field: {
    marginBottom: Spacing.md,
  },

  label: {
    color: BrandColors.navy,
  },

  input: {
    minHeight: 44,
    borderWidth: 0,
    borderColor: BrandColors.navy,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xxs,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: BrandColors.navy,
    backgroundColor: BrandColors.white,
  },

  editableInput: {
    borderWidth: 1.5,
    borderColor: BrandColors.red,
  },

  reviewCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BrandColors.navy,
    borderRadius: Radius.lg,
    backgroundColor: BrandColors.white,
  },

  requestedField: {
    marginTop: Spacing.md,
  },

  requestedText: {
    color: BrandColors.navy,
    marginTop: Spacing.xxs,
  },

  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },

  button: {
    minHeight: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },

  primaryButton: {
    backgroundColor: BrandColors.red,
  },

  outlineButton: {
    borderWidth: 1.5,
    borderColor: BrandColors.red,
  },

  whiteText: {
    color: BrandColors.white,
  },

  redText: {
    color: BrandColors.red,
  },

  disabledButton: {
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },

  error: {
    color: BrandColors.red,
    marginBottom: Spacing.xs,
  },

  notice: {
    color: BrandColors.navy,
    marginBottom: Spacing.xs,
  },

  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },

  confirmButton: {
    minHeight: 44,
    padding: Spacing.sm,
    justifyContent: 'center',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  modalCard: {
    width: '100%',
    maxWidth: 360,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    backgroundColor: BrandColors.white,
  },

  modalMessage: {
    color: BrandColors.navy,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },

  sizeOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },

  sizeOption: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BrandColors.red,
    borderRadius: Radius.full,
  },

  selectedSizeOption: {
    backgroundColor: BrandColors.red,
  },

  primaryButtonText: {
    color: BrandColors.white,
  },
});