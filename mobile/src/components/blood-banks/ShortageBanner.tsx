import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcon } from './AppIcon';

export function ShortageBanner({
  shortages,
}: {
  shortages: { bloodGroup: string; totalUnits: number }[];
}) {
  if (!shortages || shortages.length === 0) {
    return null;
  }

  const groupsText = shortages.map((s) => s.bloodGroup).join(' & ');

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel={`Critical shortage alert: ${groupsText} below reserve.`}
    >
      <View style={styles.textContainer}>
        <View style={styles.badgeRow}>
          <View style={styles.indicatorDot} />
          <Text style={styles.badgeText}>CRITICAL SHORTAGE</Text>
        </View>
        <Text style={styles.titleText}>{groupsText} Below Reserve</Text>
        <Text style={styles.subtitleText}>
          4 units or fewer total available in district
        </Text>
      </View>
      <View style={styles.iconWrapper}>
        <AppIcon name="warning" size={24} tintColor="#E7194F" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF1F4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FED7E2',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E7194F',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E7194F',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B91C1C',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 12,
    color: '#E7194F',
    fontWeight: '500',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE7EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
