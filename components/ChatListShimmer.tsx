import React from 'react';
import { View, StyleSheet } from 'react-native';
import Shimmer from './Shimmer';
import Colors from '@/constants/colors';

const ChatListShimmer = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map((index) => (
        <View key={index} style={styles.chatItem}>
          {/* Avatar shimmer */}
          <Shimmer
            width={48}
            height={48}
            borderRadius={24}
            style={styles.avatar}
          />
          
          {/* Content area */}
          <View style={styles.content}>
            {/* Name shimmer */}
            <Shimmer
              width="60%"
              height={16}
              borderRadius={4}
              style={styles.name}
            />
            
            {/* Message shimmer */}
            <Shimmer
              width="80%"
              height={14}
              borderRadius={4}
              style={styles.message}
            />
          </View>
          
          {/* Unread badge shimmer (optional) */}
          <Shimmer
            width={20}
            height={20}
            borderRadius={10}
            style={styles.badge}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  avatar: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    marginBottom: 8,
  },
  message: {
    marginBottom: 4,
  },
  badge: {
    marginLeft: 8,
  },
});

export default ChatListShimmer; 