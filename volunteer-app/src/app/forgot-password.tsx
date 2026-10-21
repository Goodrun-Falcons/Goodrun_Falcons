import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthButton, AuthError, AuthField, AuthScreen, authStyles } from '@/components/auth-form';
import { BrandColors, Radius, Spacing } from '@/constants/theme';

const API_URL = 'https://goodrun-backend.onrender.com/volunteers';
type Step = 'email' | 'reset' | 'success';
type Questions = { one: string; two: string };

function asObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function errorMessage(data: unknown, fallback: string) {
  const body = asObject(data);
  if (body.error === 'IDENTITY_ERROR' || body.message === 'IDENTITY_ERROR' || data === 'IDENTITY_ERROR') {
    return 'Your security answers could not be verified. Please check both answers.';
  }
  if (typeof body.message === 'string') return body.message;
  if (typeof body.error === 'string') return body.error;
  return fallback;
}

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [questions, setQuestions] = useState<Questions | null>(null);
  const [answerOne, setAnswerOne] = useState('');
  const [answerTwo, setAnswerTwo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const requestInProgress = useRef(false);

  async function loadQuestions() {
    if (requestInProgress.current) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    requestInProgress.current = true;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/security-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(errorMessage(data, 'Unable to retrieve your security questions. Please check your email and try again.'));
        return;
      }
      // API documentation does not yet specify the response envelope.
      const body = asObject(data);
      const questionData = typeof body.security_question_one === 'string' ? body : asObject(body.data);
      const one = questionData.security_question_one;
      const two = questionData.security_question_two;
      if (typeof one !== 'string' || !one.trim() || typeof two !== 'string' || !two.trim()) {
        setError(String(body.message ?? ''));
        return;
      }
      setQuestions({ one, two });
      setStep('reset');
    } catch {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      requestInProgress.current = false;
      setIsLoading(false);
    }
  }

  async function resetPassword() {
    if (requestInProgress.current || !questions || step !== 'reset') return;
    if (!answerOne.trim() || !answerTwo.trim() || !password || !confirmPassword) {
      setError('Please answer both security questions and enter your new password twice.');
      return;
    }
    // Match the existing registration page until the backend specifies its password rules.
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    requestInProgress.current = true;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          security_answer_one: answerOne.trim(),
          security_answer_two: answerTwo.trim(),
          new_password: password,
        }),
      });
      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        setError(errorMessage(data, 'Unable to reset your password. Please check your answers and password, then try again.'));
        return;
      }
      setAnswerOne('');
      setAnswerTwo('');
      setPassword('');
      setConfirmPassword('');
      setQuestions(null);
      setStep('success');
    } catch {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      requestInProgress.current = false;
      setIsLoading(false);
    }
  }

  function changeEmail() {
    if (requestInProgress.current) return;
    setQuestions(null);
    setAnswerOne('');
    setAnswerTwo('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setStep('email');
  }

  return (
    <AuthScreen
      title={step === 'success' ? 'Password updated' : 'Reset your password'}
      subtitle={step === 'email'
        ? 'Enter your account email to retrieve your security questions.'
        : step === 'reset'
          ? 'Answer both security questions and choose a new password.'
          : 'Your password has been reset successfully. You can now log in with your new password.'}
      onBack={() => router.replace('/login')}
      backDisabled={isLoading}
    >
      {step === 'email' && (
        <AuthField
          label="Email address" placeholder="you@example.com"
          value={email} onChangeText={setEmail} keyboardType="email-address"
          autoCapitalize="none" autoCorrect={false} autoComplete="email"
          editable={!isLoading} onSubmitEditing={loadQuestions} returnKeyType="go"
        />
      )}
      {step === 'reset' && questions && (
        <>
          <View style={styles.emailCard}>
            <Text style={authStyles.label}>Resetting password for</Text>
            <Text selectable style={authStyles.body}>{email.trim()}</Text>
            <Pressable
              accessibilityRole="button" disabled={isLoading} onPress={changeEmail}
              style={({ pressed }) => [authStyles.linkButton, pressed && styles.pressed]}
            >
              <Text style={authStyles.link}>Change email</Text>
            </Pressable>
          </View>
          <View style={authStyles.section}>
            <Text accessibilityRole="header" style={authStyles.sectionTitle}>Verify your identity</Text>
            <AuthField
              label={questions.one} placeholder="Answer to security question 1"
              value={answerOne} onChangeText={setAnswerOne} secureTextEntry
              autoCapitalize="none" autoCorrect={false} editable={!isLoading}
            />
            <AuthField
              label={questions.two} placeholder="Answer to security question 2"
              value={answerTwo} onChangeText={setAnswerTwo} secureTextEntry
              autoCapitalize="none" autoCorrect={false} editable={!isLoading}
            />
          </View>
          <View style={authStyles.divider} />
          <AuthField
            label="New password" placeholder="Create a new password" hint="Use at least 8 characters."
            value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none"
            autoCorrect={false} autoComplete="new-password" editable={!isLoading}
          />
          <AuthField
            label="Confirm new password" placeholder="Re-enter your new password"
            value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry
            autoCapitalize="none" autoCorrect={false} autoComplete="new-password"
            editable={!isLoading} onSubmitEditing={resetPassword} returnKeyType="go"
          />
        </>
      )}
      {step === 'success' && (
        <View style={styles.successIcon}>
          <MaterialIcons name="check" size={40} color={BrandColors.white} />
        </View>
      )}
      <AuthError message={error} />
      {step === 'email' && <AuthButton label={isLoading ? 'Retrieving questions…' : 'Continue'} onPress={loadQuestions} loading={isLoading} />}
      {step === 'reset' && <AuthButton label={isLoading ? 'Resetting password…' : 'Reset password'} onPress={resetPassword} loading={isLoading} />}
      {step === 'success' && <AuthButton label="Back to log in" onPress={() => router.replace('/login')} />}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  emailCard: { backgroundColor: '#F5F5F7', borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.xs },
  pressed: { opacity: 0.65 },
  successIcon: {
    width: 88, height: 88, borderRadius: Radius.full, backgroundColor: BrandColors.red,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
});
