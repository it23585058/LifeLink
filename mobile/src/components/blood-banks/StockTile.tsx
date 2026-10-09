import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StockItem } from '@/lib/hospitalApi';

const COMPONENT_LABELS: Record<string, string> = {
  whole_blood: '',
  platelets: 'Platelets',
  ffp: 'FFP',
};

export function StockTile({ item }: { item: StockItem }) {
  const isLow = item.status === 'low';
  const isOut = item.status === 'out';

  // Tile background and status styling
  let bg = '#F7F9FC';
  let statusText = 'Available';
  let statusColor = '#087A3E';
  let pillBg = '#D9F8E7';
  let pillColor = '#087A3E';

  if (item.component === 'whole_blood') {
    if (isLow) {
      bg = '#FFF1F4';
      statusText = 'Low Stock';
      statusColor = '#E7194F';
      pillBg = '#FFE7EE';
      pillColor = '#E7194F';
    } else if (isOut) {
      bg = '#FEF2F2';
      statusText = 'Out of Stock';
      statusColor = '#DC2626';
      pillBg = '#FEE2E2';
      pillColor = '#DC2626';
    } else if (item.bloodGroup === 'B+' || item.bloodGroup === 'AB+') {
      bg = '#FFFDF2';
      statusText = 'Available';
      statusColor = '#926102';
      pillBg = '#FEF3C7';
      pillColor = '#926102';
    } else {
      bg = '#F0FAF4';
      statusText = 'Available';
      statusColor = '#087A3E';
      pillBg = '#D9F8E7';
      pillColor = '#087A3E';
    }
  } else {
    // Platelets or FFP
    bg = '#F0FAF4';
    statusText = 'Available';
    statusColor = '#087A3E';
    pillBg = '#D9F8E7';
    pillColor = '#087A3E';
  }

  const groupDisplay =
    item.component === 'whole_blood'
      ? item.bloodGroup
      : COMPONENT_LABELS[item.component] || item.component;

  return (
    <View style={[styles.tile, { backgroundColor: bg }]}>
      <View style={styles.topRow}>
        <Text style={styles.groupText} numberOfLines={1}>
          {groupDisplay}
        </Text>
        <View style={[styles.unitsPill, { backgroundColor: pillBg }]}>
          <Text style={[styles.unitsText, { color: pillColor }]}>
            {item.units} Units
          </Text>
        </View>
      </View>
      <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 12,
    padding: 10,
    minHeight: 70,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(214, 221, 234, 0.4)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  groupText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14253B',
  },
  unitsPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unitsText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
