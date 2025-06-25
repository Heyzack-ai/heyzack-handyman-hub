import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  children?: React.ReactNode;
}

const Shimmer: React.FC<ShimmerProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4, 
  style,
  children 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, screenWidth],
  });

  if (children) {
    return (
      <View style={[styles.container, { width, height, borderRadius }, style]}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
        <View style={styles.content}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E1E9EE',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});

export default Shimmer; 