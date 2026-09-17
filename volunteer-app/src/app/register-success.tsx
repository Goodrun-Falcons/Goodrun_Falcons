import { StyleSheet, View, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { BrandColors, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';

export default function RegisterSuccessScreen() {
    return (
        <View style={styles.container}>

            <View style={styles.headerView}>
                <ThemedText
                    type="heading"
                    themeColor="secondaryText"
                >
                    Sign up
                </ThemedText>
            </View>

            <View style={styles.content}>

                <View style={styles.successIcon}>
                    <ThemedText
                        type="subtitle"
                        themeColor="secondaryText"
                    >
                        ✓
                    </ThemedText>
                </View>

                <ThemedText
                    type="subtitle"
                    style={styles.title}
                >
                    Registration Complete
                </ThemedText>

                <ThemedText
                    type="default"
                    style={styles.message}
                >
                    Your profile has been successfully submitted.
                </ThemedText>

                <Pressable 
                    style={({ pressed }) => [styles.button, pressed && styles.pressed]}
                    onPress={() => router.replace('/login')}
                >
                    <ThemedText
                        type="heading"
                        themeColor="secondaryText"
                    >
                        Back to Log in
                    </ThemedText>
                </Pressable>
                
            </View>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: BrandColors.white,
    },

    headerView: {
        height: 3 * Spacing.xl,
        width: '100%',
        backgroundColor: BrandColors.navy,
        justifyContent: 'center',
        alignItems: 'center',
    },

    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
    },

    successIcon: {
        width: 80,
        height: 80,
        borderRadius: Radius.full,
        backgroundColor: BrandColors.red,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },

    title: {
        textAlign: 'center',
        marginBottom: Spacing.md,
    },

    message: {
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },

    button: {
        backgroundColor: BrandColors.red,
        borderRadius: Radius.xl,
        height: 48,
        paddingHorizontal: Spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },

    pressed: {
        opacity: 0.7,
    },
});