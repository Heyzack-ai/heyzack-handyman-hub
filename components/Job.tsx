import { Dimensions, StyleSheet, Text, View, ViewStyle } from 'react-native'
import React from 'react'
import Colors from '@/constants/colors'


interface JobProps {
  title: string;
  number: string;
  style?: ViewStyle;
}

const Job = ({title, number, style}: JobProps) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.number}>{number}</Text>
    </View>
  )
}

export default Job

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        borderRadius: 8,
        backgroundColor: Colors.light.background,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.light.text,
    },
    number: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.text,
        marginTop: 8,
    }
})