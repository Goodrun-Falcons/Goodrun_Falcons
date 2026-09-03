import { StyleSheet, View , ScrollView ,TextInput, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { BrandColors, Spacing, Radius } from '@/constants/theme';

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
                    <Pressable style = {styles.button}>
                        <ThemedText
                            type='heading'
                            themeColor="secondaryText"
                        >
                            ←Back
                        </ThemedText>
                    </Pressable>

                    <ThemedText
                        type='subtitle'
                    >
                        Welcome!{'\n'}Lets get started!
                    </ThemedText>
                </View>
                
                <View style = {styles.form}>
                    <ThemedText
                        type='heading'
                    >
                        Full Name
                    </ThemedText>
                    <TextInput style = {styles.input} />
                </View>

                <View style = {styles.form}>
                    <ThemedText
                        type='heading'
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
                        type='heading'
                    >
                        Phone Number
                    </ThemedText>
                    <TextInput style = {styles.input} />
                </View>

                <View style = {styles.form}>
                    <ThemedText
                        type='heading'
                    >
                        Available Period
                    </ThemedText>
                    <TextInput 
                        style = {styles.input} 
                        placeholder='Morning/Afternoon/Evening'
                    />
                </View>

                <View style = {styles.form}>
                    <ThemedText
                        type='heading'
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
                        type='heading'
                    >
                        Vehicle Type
                    </ThemedText>
                    <TextInput 
                        style = {styles.input} 
                        placeholder='Null/Bicycle/Motorbike/BicycleCar/Van'
                    />
                </View>

                <Pressable style = {styles.submit}>
                    <ThemedText
                        type='heading'
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
        borderWidth: 5,
        borderColor: BrandColors.navy,
        borderRadius: Radius.xl,
        height: 45,
        width: '82.353%',
        paddingHorizontal: Spacing.md,
    },

    button: {
        marginLeft: Spacing.lg,
        backgroundColor: BrandColors.red,
        borderRadius: Radius.xl,
        width: 88,
        height: 40,
        justifyContent: 'center',
        alignSelf: 'flex-start',
    },

    form: {
        marginTop: Spacing.lg,
        marginLeft: '15%',
        alignItems: 'flex-start',
    },

    submit: {
        marginTop: Spacing.xl,
        marginRight: Spacing.lg,
        backgroundColor: BrandColors.red,
        borderRadius: Radius.xl,
        width: 100,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-end',
    },

    scrollContent: {
        paddingBottom: '50%',
    },
})