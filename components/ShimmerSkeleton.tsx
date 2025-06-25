import React from 'react';
import { View, StyleSheet } from 'react-native';
import Shimmer from './Shimmer';
import ShimmerCard from './ShimmerCard';

const ShimmerSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Shimmer width="40%" height={20} borderRadius={4} />
          <Shimmer width="60%" height={16} borderRadius={4} />
        </View>
        <Shimmer width={40} height={40} borderRadius={20} />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Shimmer width="70%" height={16} borderRadius={4} />
            <Shimmer width="40%" height={24} borderRadius={4} style={styles.statNumber} />
          </View>
          <View style={styles.statCard}>
            <Shimmer width="70%" height={16} borderRadius={4} />
            <Shimmer width="40%" height={24} borderRadius={4} style={styles.statNumber} />
          </View>
        </View>
        <View style={styles.earningsCard}>
          <Shimmer width="70%" height={16} borderRadius={4} />
          <Shimmer width="50%" height={24} borderRadius={4} style={styles.statNumber} />
        </View>
      </View>

      {/* Calendar Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Shimmer width={20} height={20} borderRadius={10} />
          <Shimmer width="30%" height={18} borderRadius={4} />
        </View>
        <View style={styles.calendarContainer}>
          <Shimmer width="100%" height={200} borderRadius={8} />
        </View>
      </View>

      {/* Jobs Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Shimmer width={20} height={20} borderRadius={10} />
          <Shimmer width="40%" height={18} borderRadius={4} />
          <Shimmer width={24} height={24} borderRadius={12} />
        </View>
        <View style={styles.jobsContainer}>
          <ShimmerCard height={100} />
          <ShimmerCard height={100} />
          <ShimmerCard height={100} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    gap: 8,
  },
  statsContainer: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  statNumber: {
    marginTop: 4,
  },
  earningsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    height: 100,
    gap: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  calendarContainer: {
    marginBottom: 8,
  },
  jobsContainer: {
    gap: 12,
  },
});

export default ShimmerSkeleton; 