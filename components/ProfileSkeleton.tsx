import React from "react";
import {
  StyleSheet,
  View,
  ScrollView,
} from "react-native";
import Colors from "@/constants/colors";

// Profile Skeleton Component
const ProfileSkeleton = () => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: Colors.light.gray[200] }]} />
          <View style={[styles.verifiedBadge, { backgroundColor: Colors.light.gray[200] }]}>
            <View style={{ width: 12, height: 12, backgroundColor: Colors.light.gray[300] }} />
          </View>
        </View>
        <View style={[styles.skeletonText, { width: '60%', height: 24, marginBottom: 4 }]} />
        <View style={[styles.skeletonButton, { width: 120, height: 36 }]} />
      </View>

      {/* Skills Container Skeleton */}
      <View style={[styles.skillsContainer, { backgroundColor: Colors.light.gray[200] }]}>
        <View style={styles.skillsHeader}>
          <View style={[styles.skeletonText, { width: '30%', height: 16 }]} />
          <View style={[styles.skeletonText, { width: '15%', height: 14 }]} />
        </View>
        <View style={styles.skillTags}>
          {[1, 2, 3].map((index) => (
            <View key={index} style={[styles.skeletonSkillTag, { width: 80 + (index * 20) }]} />
          ))}
        </View>
      </View>

      {/* Stats Container Skeleton */}
      <View style={[styles.statsContainer, { backgroundColor: Colors.light.gray[200] }]}>
        <View style={styles.statItem}>
          <View style={[styles.skeletonText, { width: '40%', height: 24, marginBottom: 4 }]} />
          <View style={[styles.skeletonText, { width: '60%', height: 14 }]} />
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.skeletonText, { width: '40%', height: 24, marginBottom: 4 }]} />
          <View style={[styles.skeletonText, { width: '60%', height: 14 }]} />
        </View>
      </View>

      {/* Payment Section Skeleton */}
      <View style={styles.section}>
        <View style={[styles.skeletonText, { width: '25%', height: 18, marginBottom: 12 }]} />
        {[1, 2].map((index) => (
          <View key={index} style={[styles.menuItem, { backgroundColor: Colors.light.gray[200] }]}>
            <View style={styles.menuIcon}>
              <View style={{ width: 20, height: 20, backgroundColor: Colors.light.gray[300] }} />
            </View>
            <View style={styles.menuContent}>
              <View style={[styles.skeletonText, { width: '40%', height: 16, marginBottom: 2 }]} />
              <View style={[styles.skeletonText, { width: '60%', height: 14 }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Contact Information Section Skeleton */}
      <View style={styles.section}>
        <View style={[styles.skeletonText, { width: '35%', height: 18, marginBottom: 12 }]} />
        {[1, 2].map((index) => (
          <View key={index} style={[styles.menuItem, { backgroundColor: Colors.light.gray[200] }]}>
            <View style={styles.menuIcon}>
              <View style={{ width: 20, height: 20, backgroundColor: Colors.light.gray[300] }} />
            </View>
            <View style={styles.menuContent}>
              <View style={[styles.skeletonText, { width: '30%', height: 16, marginBottom: 2 }]} />
              <View style={[styles.skeletonText, { width: '70%', height: 14 }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Work Preferences Section Skeleton */}
      <View style={styles.section}>
        <View style={[styles.skeletonText, { width: '40%', height: 18, marginBottom: 12 }]} />
        {[1, 2, 3].map((index) => (
          <View key={index} style={[styles.menuItem, { backgroundColor: Colors.light.gray[200] }]}>
            <View style={styles.menuIcon}>
              <View style={{ width: 20, height: 20, backgroundColor: Colors.light.gray[300] }} />
            </View>
            <View style={styles.menuContent}>
              <View style={[styles.skeletonText, { width: '45%', height: 16, marginBottom: 2 }]} />
              <View style={[styles.skeletonText, { width: '65%', height: 14 }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Settings Section Skeleton */}
      <View style={styles.section}>
        <View style={[styles.skeletonText, { width: '25%', height: 18, marginBottom: 12 }]} />
        {[1, 2, 3].map((index) => (
          <View key={index} style={[styles.menuItem, { backgroundColor: Colors.light.gray[200] }]}>
            <View style={styles.menuIcon}>
              <View style={{ width: 20, height: 20, backgroundColor: Colors.light.gray[300] }} />
            </View>
            <View style={styles.menuContent}>
              <View style={[styles.skeletonText, { width: '35%', height: 16, marginBottom: 2 }]} />
              <View style={[styles.skeletonText, { width: '55%', height: 14 }]} />
            </View>
          </View>
        ))}
        <View style={[styles.skeletonButton, { height: 48, marginTop: 8 }]} />
      </View>

      <View style={[styles.skeletonText, { width: '20%', height: 14, alignSelf: 'center', marginBottom: 16 }]} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.gray[200],
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  skillsContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  skillsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  skillTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
  section: {
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  // Skeleton styles
  skeletonText: {
    backgroundColor: Colors.light.gray[200],
    borderRadius: 4,
  },
  skeletonButton: {
    backgroundColor: Colors.light.gray[200],
    borderRadius: 8,
  },
  skeletonSkillTag: {
    backgroundColor: Colors.light.gray[200],
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    height: 28,
  },
});

export default ProfileSkeleton; 