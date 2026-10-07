import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type PillVariant =
  | 'available'
  | 'low'
  | 'out'
  | 'nbts'
  | 'verified'
  | 'neutral'
  | 'dispatched'
  | 'arrived_at_gate'
  | 'triage_crossmatch'
  | 'completed'
  | 'cancelled';

const STYLES_BY_VARIANT: Record<
  PillVariant,
  { bg: string; text: string; label: string }
> = {
  available: { bg: '#D9F8E7', text: '#087A3E', label: 'Available' },
  low: { bg: '#FFE7EE', text: '#E7194F', label: 'Low Stock' },
  out: { bg: '#FEE2E2', text: '#DC2626', label: 'Out of Stock' },
  nbts: { bg: '#D9F8E7', text: '#087A3E', label: 'NBTS Accredited' },
  verified: { bg: '#E6F4FF', text: '#0878A8', label: 'Hospital Verified' },
  neutral: { bg: '#F0F0F3', text: '#60646C', label: 'Unverified' },
  dispatched: { bg: '#FEF3C7', text: '#D97706', label: 'In Transit' },
  arrived_at_gate: { bg: '#FFE7EE', text: '#E7194F', label: 'At Gate' },
  triage_crossmatch: { bg: '#E6F4FF', text: '#0878A8', label: 'In Triage' },
  completed: { bg: '#D9F8E7', text: '#087A3E', label: 'Completed' },
  cancelled: { bg: '#F0F0F3', text: '#60646C', label: 'Cancelled' },
};

export function StatusPill({
  variant,
  customLabel,
}: {
  variant: PillVariant;
  customLabel?: string;
}) {
  const config = STYLES_BY_VARIANT[variant] || STYLES_BY_VARIANT.neutral;
  const label = customLabel || config.label;

  return (
    <View style={[styles.pill, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
