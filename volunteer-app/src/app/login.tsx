import { StyleSheet, View , Image ,TextInput, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { BrandColors, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';

export default function LoginScreen() {

    return(
        <View style = {styles.container}>

            <Image
                source = {require('../assets/medical-pantry-logo-navy-small.png')}
                style = {styles.logo}
            />

            <View style={styles.form}>

                <View style={styles.loginForm}>
                    <ThemedText
                        type= 'smallBold'
                        themeColor="secondaryText"
                    >
                        Email Address
                    </ThemedText>

                    <TextInput 
                        placeholder='xxx@example.com'
                        keyboardType="email-address"
                        style={styles.input}
                    />
                </View>
                
                <View style={styles.loginForm}>
                    <ThemedText
                        type= 'smallBold'
                        themeColor="secondaryText"
                    >
                        Password
                    </ThemedText>

                    <TextInput 
                        secureTextEntry
                        style={styles.input}
                    />
                </View>

                <View style={styles.buttonRow}>
                    <Pressable 
                        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
                        onPress={() => router.push('/register')}
                    >
                        <ThemedText
                            type= 'smallBold'
                            themeColor="secondaryText"
                        >
                            Sign up
                        </ThemedText>
                    </Pressable>

                    <Pressable 
                        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
                        onPress={() => router.push('/home')}
                    >
                        <ThemedText
                            type= 'smallBold'
                            themeColor="secondaryText"
                        >
                            Log in
                        </ThemedText>
                    </Pressable>
                </View>
            </View>

            

            <View style = {styles.teamInfo}>
                <ThemedText
                    type= 'smallBold'
                    themeColor="secondaryText"
                >
                    Project GoodRun
                </ThemedText>
                <ThemedText
                    type= 'small'
                    themeColor="secondaryText"
                >
                    by Team Falcons
                </ThemedText>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    logo: {
        marginTop: '30%',
        width: 700,
        height: 120,
        resizeMode: 'contain',
    },

    container: {
        flex: 1,
        backgroundColor : BrandColors.navy,
        alignItems: 'center',
    },

    teamInfo: {
        marginTop: 'auto',
        alignSelf: 'flex-end',
        marginRight: Spacing.sm,
        marginBottom: Spacing.xxl,
    },

    input: {
        backgroundColor: BrandColors.white,
        borderRadius: Radius.xl,
        minHeight: 44,
        paddingHorizontal: Spacing.md,
    },

    form: {
        marginTop: Spacing.xs,
        width: '82%',
        justifyContent: 'center',
    },

    loginForm: {
        marginTop: Spacing.lg,
    },

    buttonRow: {
        flexDirection: 'row',
        gap: Spacing.xxl,
        marginTop: Spacing.sm,
    },

    button: {
        marginTop: Spacing.xl,
        backgroundColor: BrandColors.red,
        borderRadius: Radius.xl,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },

    pressed: {
        opacity: 0.7,
    },
});