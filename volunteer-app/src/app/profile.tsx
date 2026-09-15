import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable,  ScrollView,  StyleSheet,  TextInput,  View, } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import {  BrandColors,  FontFamily,  Radius, Spacing, } from '@/constants/theme';

type Profile = {
  fullName: string;
  email: string;
  phone: string;
  serviceArea: string;
  vehicleType: string;
};

const initialProfile: Profile = {
  fullName: 'Jane Smith',
  email: 'jane.smith@medicalpantry.org',
  phone: '+64 xxxxxxxxx',
  serviceArea: 'Greater Melbourne Area',
  vehicleType: 'SUV (Spacious Cargo)',
};

const fields: { key: keyof Profile; label: string }[] = [
  { key: 'fullName', label: 'Full Name' },
  { key: 'email', label: 'Email Address' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'serviceArea', label: 'Service Area' },
  { key: 'vehicleType', label: 'Vehicle Type' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [draft, setDraft] = useState<Profile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showLogout, setShowLogout] = useState(false);

  const values = isEditing ? draft : profile;

  const initials = profile.fullName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function startEditing() {
    setDraft({ ...profile });
    setError('');
    setNotice('');
    setShowLogout(false);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft({ ...profile });
    setError('');
    setIsEditing(false);
    Keyboard.dismiss();
  }

  function saveProfile() {
    const updated: Profile = {
      fullName: draft.fullName.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      serviceArea: draft.serviceArea.trim(),
      vehicleType: draft.vehicleType.trim(),
    };

    if (Object.values(updated).some((value) => !value)) {
      setError('Please complete all fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updated.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setProfile(updated);
    setDraft(updated);
    setIsEditing(false);
    setError('');
    setNotice('Changes saved for this preview session.');
    Keyboard.dismiss();
  }

  function logout() {
    router.replace('/login');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
          

          <View style={styles.identity}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <ThemedText style={styles.initials}>
                  {initials}
                </ThemedText>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
                onPress={() =>
                  setNotice('Profile photo upload is not available yet.')
                }
                style={({ pressed }) => [
                  styles.cameraButton,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.cameraBody}>
                  <View style={styles.cameraTop} />
                  <View style={styles.cameraLens} />
                </View>
              </Pressable>
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
          {fields.map(({ key, label }) => (
            <View key={key} style={styles.field}>
              <ThemedText type="smallBold" style={styles.label}>
                {label}
              </ThemedText>

              <TextInput
                accessibilityLabel={label}
                value={values[key]}
                editable={isEditing}
                onChangeText={(value) => {
                  setDraft((previous) => ({
                    ...previous,
                    [key]: value,
                  }));
                  setError('');
                }}
                keyboardType={
                  key === 'email'
                    ? 'email-address'
                    : key === 'phone'
                      ? 'phone-pad'
                      : 'default'
                }
                autoCapitalize={key === 'email' ? 'none' : 'words'}
                autoCorrect={key !== 'email' && key !== 'phone'}
                selectionColor={BrandColors.navy}
                underlineColorAndroid="transparent"
                style={[
                  styles.input,
                  isEditing && styles.editableInput,
                ]}
              />
            </View>
          ))}

          {!!error && (
            <ThemedText accessibilityRole="alert" style={styles.error}>
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
              onPress={isEditing ? saveProfile : startEditing}
              style={({ pressed }) => [
                styles.button,
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <ThemedText type="smallBold" style={styles.whiteText}>
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </ThemedText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={
                isEditing
                  ? cancelEditing
                  : () => {
                      setShowLogout(true);
                      setNotice('');
                    }
              }
              style={({ pressed }) => [
                styles.button,
                styles.outlineButton,
                pressed && styles.pressed,
              ]}
            >
              <ThemedText type="smallBold" style={styles.redText}>
                {isEditing ? 'Cancel' : 'Log Out'}
              </ThemedText>
            </Pressable>
          </View>

          {showLogout && (
            <View style={styles.confirmation}>
              <ThemedText style={styles.label}>
                Log out and return to the login screen?
              </ThemedText>

              <View style={styles.confirmActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowLogout(false)}
                  style={styles.confirmButton}
                >
                  <ThemedText type="smallBold" style={styles.label}>
                    Stay
                  </ThemedText>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={logout}
                  style={styles.confirmButton}
                >
                  <ThemedText type="smallBold" style={styles.redText}>
                    Log Out
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
  },

  whiteText: {
    color: BrandColors.white,
  },

  redText: {
    color: BrandColors.red,
  },

  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingsIcon: {
    color: '#a1a6b6',
    fontSize: 28,
    lineHeight: 36,
    fontFamily: undefined,
  },

  identity: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },

  avatarContainer: {
    width: 104,
    height: 104,
    marginBottom: Spacing.md,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    borderWidth: 3,
    borderColor: BrandColors.white,
    backgroundColor: '#eef0f6',
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
    color: '#a1a6b6',
    textAlign: 'center',
    marginTop: Spacing.xxs,
  },

  form: {
    width: '100%',
    maxWidth: 568,
    alignSelf: 'center',
    paddingTop: Spacing.lg,
  },

  field: {
    marginBottom: Spacing.md,
  },

  label: {
    color: BrandColors.navy,
  },

  input: {
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: BrandColors.navy,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xxs,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: '#252525',
    backgroundColor: BrandColors.white,
  },

  editableInput: {
    backgroundColor: '#f5f5f7',
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

  pressed: {
    opacity: 0.7,
  },

  error: {
    color: BrandColors.red,
    marginBottom: Spacing.xs,
  },

  notice: {
    color: BrandColors.navy,
    marginBottom: Spacing.xs,
  },

  confirmation: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: '#f5f5f7',
    borderRadius: Radius.lg,
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
});