import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React from 'react'

const Splash = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Image source={require('@/assets/logo/logo.png')} style={styles.logo} />
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
    logo: {
        width: 100,
        height: 100,
        resizeMode: 'contain'
    }
})