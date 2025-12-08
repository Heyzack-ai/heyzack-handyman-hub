import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React from 'react'

const Splash = () => {
  return (
    <SafeAreaView style={styles.container}>
     <View style={styles.logoContainer}>
     <Image source={require('@/assets/logo/logo.png')} style={styles.logo} />
     <Text style={styles.text}>PARTNERS</Text>
     </View>
    </SafeAreaView>
  )
}

export default Splash

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white'
    },
    logoContainer: {
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        backgroundColor: 'white',
    },
    logo: {
        width: 200,
        height: 200,
        resizeMode: 'contain',
    },
    text: {
        fontSize: 20,
        fontWeight: '600',
        color: 'black',
        letterSpacing: 4,
        textAlign: 'right',
        bottom: 60,
    }
})