import { StyleSheet, View , ScrollView ,TextInput, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { BrandColors, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';

export default function RegisterScreen() {
    return(
        <View style = {styles.container}>
            <View style = {styles.headerview}>
                <ThemedText
                    type= 'subtitle'
                    themeColor="secondaryText"
                >
                    Sign up
                </ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style = {styles.body}>
                    <Pressable 
                        style = {styles.button}
                        onPress={() => router.push('/login')}
                    >
                        <ThemedText
                            type='smallBold'
                            themeColor="secondaryText"
                        >
                            ← Back
                        </ThemedText>
                    </Pressable>

                    <ThemedText
                        type="heading"
                        style={styles.welcomeText}
                    >
                        Welcome!{'\n'}Lets get started!
                    </ThemedText>
                </View>
                
                <View style = {styles.form}>
                    <ThemedText
                        type='smallBold'
                    >
                        Full Name
                    </ThemedText>
                    <TextInput style = {styles.input} />
                </View>

                <View style = {styles.form}>
                    <ThemedText
                        type='smallBold'
                    >
                        Email Address
                    </ThemedText>
                    <TextInput 
                        style = {styles.input} 
                        placeholder='xxx@example.com'
                    />
                </View>

                <View style = {styles.form}>
                    <ThemedText
                        type='smallBold'
                    >
                        Phone Number
                    </ThemedText>
                    <TextInput style = {styles.input} />
                </View>

                <View style = {styles.form}>
                    <ThemedText
                        type='smallBold'
                    >
                        Service Area
                    </ThemedText>
                    <TextInput 
                        style = {styles.input} 
                        placeholder='Suburb/Postcode/Area'
                    />
                </View>

                <View style = {styles.form}>
                    <ThemedText
                        type='smallBold'
                    >
                        Vehicle Type
                    </ThemedText>
                    <TextInput 
                        style = {styles.input} 
                        placeholder='Null/Bicycle/Motorbike/Car/Van'
                    />
                </View>

                <Pressable 
                    style = {styles.submit}
                    onPress={() => router.push('/register-success')}
                >
                    <ThemedText
                        type='smallBold'
                        themeColor="secondaryText"
                    >
                        Submit
                    </ThemedText>
                </Pressable>
            </ScrollView> 
        </View>
    );
}

const styles = StyleSheet.create({
    logo: {
        marginTop: Spacing.xl,
        width: 250,
        height: 70,
        resizeMode: 'contain',
    },

    container: {
        flex: 1,
        backgroundColor: BrandColors.white,
    },

    headerview: {
        backgroundColor: BrandColors.navy,
        height: 3*Spacing.xl,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    body: {
        marginTop: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.md,
    },

    input: {
        backgroundColor: BrandColors.white,
        borderWidth: 2,
        borderColor: BrandColors.navy,
        borderRadius: Radius.xl,
        height: 48,
        width: '90%',
        paddingHorizontal: Spacing.md,
    },

    button: {
        marginLeft: Spacing.lg,
        backgroundColor: BrandColors.red,
        borderRadius: Radius.xl,
        width: '23%',
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },

    form: {
        marginTop: Spacing.lg,
        marginLeft: '10%',
        alignItems: 'flex-start',
    },

    submit: {
        marginTop: Spacing.xl,
        marginRight: Spacing.lg,
        backgroundColor: BrandColors.red,
        borderRadius: Radius.xl,
        width: '23%',
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-end',
    },

    scrollContent: {
        paddingBottom: '50%',
    },

    welcomeText: {
        alignSelf: 'flex-start',
        marginLeft: '10%',
    },
})