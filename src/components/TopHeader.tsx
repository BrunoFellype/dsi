import React from 'react';
import { View, StyleSheet, Image, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

interface TopHeaderProps {
  title?: string;
  subtitle?: string;
  onProfilePress?: () => void;
}

export default function TopHeader({ title, subtitle, onProfilePress }: TopHeaderProps) {
  const handleProfile = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      router.push('/telaperfil');
    }
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftRow}>
        <Image
          source={require('../../assets/images/straremovebgpreview2.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {title ? (
          <View style={styles.titleWrapper}>
            <Text style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitleText} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <Pressable onPress={handleProfile} style={styles.profileWrapper}>
        <Image
          source={require('../../assets/images/profile.png')}
          style={styles.profileImage}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    height: 64,
    backgroundColor: '#9AD9EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#87C3D5',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logo: {
    width: 90,
    height: 42,
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2A44',
  },
  subtitleText: {
    fontSize: 11,
    color: '#275273',
    fontWeight: '600',
  },
  profileWrapper: {
    padding: 2,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
