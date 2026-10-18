import { useId, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BrandColors, Radius, Spacing, Typography } from '@/constants/theme';

export const authStyles = StyleSheet.create({
  title: { ...Typography.displayLg, color: BrandColors.navy },
  body: { ...Typography.bodyMd, color: '#4a4a4a' },
  label: { ...Typography.bodyMdStrong, color: BrandColors.navy },
  link: { ...Typography.bodySm, color: BrandColors.navy, textDecorationLine: 'underline' },
  linkButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  field: { gap: Spacing.xs },
  input: {
    ...Typography.bodyMd,
    color: BrandColors.navy,
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: '#D5D7DF',
    borderRadius: Radius.md,
    minHeight: 52,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  focused: { borderColor: BrandColors.navy },
  hint: { ...Typography.bodySm, color: '#60646C' },
  section: { gap: Spacing.lg },
  sectionTitle: { ...Typography.displaySm, color: BrandColors.navy },
  divider: { height: 1, backgroundColor: '#E8E8EA' },
});

export function AuthScreen({
  title,
  subtitle,
  children,
  header,
  onBack,
  backDisabled = false,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  header?: ReactNode;
  onBack?: () => void;
  backDisabled?: boolean;
}) {
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.content}>
            {onBack && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to login"
                accessibilityState={{ disabled: backDisabled }}
                disabled={backDisabled}
                onPress={onBack}
                style={({ pressed }) => [authStyles.linkButton, pressed && styles.pressed]}
              >
                <View style={styles.backRow}>
                  <MaterialIcons name="arrow-back" size={20} color={BrandColors.navy} />
                  <Text style={authStyles.link}>Back to login</Text>
                </View>
              </Pressable>
            )}
            {header}
            <View style={styles.heading}>
              <Text accessibilityRole="header" style={authStyles.title}>
                {title}
              </Text>
              <Text style={authStyles.body}>{subtitle}</Text>
            </View>
            <View style={styles.form}>{children}</View>
            <Text style={styles.footer}>Project GoodRun · Team Falcons</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthField({
  label,
  hint,
  secureTextEntry,
  style,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <View style={authStyles.field}>
      <Text nativeID={id} style={authStyles.label}>
        {label}
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          {...props}
          accessibilityLabel={label}
          accessibilityLabelledBy={id}
          placeholderTextColor="#727581"
          secureTextEntry={secureTextEntry && !visible}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            authStyles.input,
            focused && authStyles.focused,
            secureTextEntry && styles.passwordInput,
            style,
          ]}
        />
        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            accessibilityState={{ disabled: props.editable === false }}
            disabled={props.editable === false}
            onPress={() => setVisible(!visible)}
            style={styles.eye}
          >
            <MaterialIcons
              name={visible ? 'visibility-off' : 'visibility'}
              size={22}
              color={BrandColors.navy}
            />
          </Pressable>
        )}
      </View>
      {hint && <Text style={authStyles.hint}>{hint}</Text>}
    </View>
  );
}

export function AuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        (pressed || disabled || loading) && styles.pressed,
      ]}
    >
      {loading && (
        <ActivityIndicator size="small" color={secondary ? BrandColors.navy : BrandColors.white} />
      )}
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{label}</Text>
    </Pressable>
  );
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
      <MaterialIcons name="error-outline" size={20} color={BrandColors.navy} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.white },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl },
  content: { width: '100%', maxWidth: 440, alignSelf: 'center', flexGrow: 1 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  heading: { gap: Spacing.xs, marginBottom: Spacing.xl },
  form: { gap: Spacing.lg },
  footer: {
    ...Typography.caption,
    color: '#60646C',
    textAlign: 'center',
    marginTop: Spacing.xxl,
    paddingBottom: Spacing.md,
  },
  inputRow: { justifyContent: 'center' },
  passwordInput: { paddingRight: 56 },
  eye: {
    position: 'absolute',
    right: 4,
    minHeight: 44,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    minHeight: 52,
    backgroundColor: BrandColors.red,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.buttonMd,
    color: BrandColors.white,
    flexShrink: 1,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: BrandColors.navy,
  },
  secondaryButtonText: { color: BrandColors.navy },
  pressed: { opacity: 0.65 },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: '#F5F5F7',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  errorText: { ...Typography.bodySm, color: BrandColors.navy, flex: 1 },
});
