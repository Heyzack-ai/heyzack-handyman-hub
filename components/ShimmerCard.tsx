import React from 'react';
import { View, StyleSheet } from 'react-native';
import Shimmer from './Shimmer';
import Colors from '@/constants/colors';

interface ShimmerCardProps {
  height?: number;
}

const ShimmerCard: React.FC<ShimmerCardProps> = ({ height = 120 }) => {
  return (
    <View style={[styles.card, { height }]}>
      <View style={styles.header}>
        <Shimmer width="60%" height={16} borderRadius={4} />
        <Shimmer width="30%" height={12} borderRadius={4} />
      </View>
      <View style={styles.content}>
        <Shimmer width="80%" height={14} borderRadius={4} style={styles.line} />
        <Shimmer width="70%" height={14} borderRadius={4} style={styles.line} />
        <Shimmer width="50%" height={14} borderRadius={4} style={styles.line} />
      </View>
      <View style={styles.footer}>
        <Shimmer width="40%" height={12} borderRadius={4} />
        <Shimmer width="20%" height={24} borderRadius={12} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  header: {
    marginBottom: 12,
    gap: 8,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  line: {
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
});

export default ShimmerCard; 