import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcon } from './AppIcon';

export type TransferStepKey =
  | 'dispatched'
  | 'arrived_at_gate'
  | 'triage_crossmatch'
  | 'completed';

interface StepConfig {
  key: TransferStepKey;
  label: string;
  subLabel?: string;
}

const STEPS: StepConfig[] = [
  { key: 'dispatched', label: 'Dispatched & En Route' },
  { key: 'arrived_at_gate', label: 'Arrived at Hospital Gate' },
  { key: 'triage_crossmatch', label: 'Triage & Serology Crossmatch' },
  { key: 'completed', label: 'Transfusion Complete', subLabel: 'FINAL STEP' },
];

const STEP_ORDER: Record<TransferStepKey, number> = {
  dispatched: 1,
  arrived_at_gate: 2,
  triage_crossmatch: 3,
  completed: 4,
};

export function TransferTimeline({
  currentStatus,
}: {
  currentStatus: string;
}) {
  const currentStepNum =
    STEP_ORDER[currentStatus as TransferStepKey] || (currentStatus === 'cancelled' ? 0 : 1);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>CLINICAL TRANSFER CHAIN</Text>
        <Text style={styles.milestoneText}>
          Active Milestone {Math.min(currentStepNum, 4)} of 4
        </Text>
      </View>

      <View style={styles.stepsList}>
        {STEPS.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = currentStepNum > stepNum || currentStatus === 'completed';
          const isCurrent = currentStepNum === stepNum && currentStatus !== 'completed' && currentStatus !== 'cancelled';
          const isPending = currentStepNum < stepNum;

          return (
            <View key={step.key} style={styles.stepItem}>
              {/* Left icon / connector */}
              <View style={styles.indicatorCol}>
                <View
                  style={[
                    styles.iconCircle,
                    isCompleted && styles.circleCompleted,
                    isCurrent && styles.circleCurrent,
                    isPending && styles.circlePending,
                  ]}
                >
                  {isCompleted ? (
                    <AppIcon name="check" size={16} tintColor="#FFFFFF" />
                  ) : isCurrent ? (
                    <AppIcon name="car" size={16} tintColor="#FFFFFF" />
                  ) : (
                    <AppIcon name="drop" size={14} tintColor="#9CA3AF" />
                  )}
                </View>
                {index < STEPS.length - 1 && (
                  <View
                    style={[
                      styles.connectorLine,
                      isCompleted && styles.connectorCompleted,
                    ]}
                  />
                )}
              </View>

              {/* Right content */}
              <View style={styles.stepContent}>
                <View style={styles.labelRow}>
                  {isCompleted && (
                    <Text style={styles.completedBadge}>COMPLETED</Text>
                  )}
                  {isCurrent && (
                    <View style={styles.currentBadgeWrap}>
                      <Text style={styles.currentBadge}>CURRENT ACTIVE</Text>
                      <View style={styles.redDot} />
                    </View>
                  )}
                  {isPending && (
                    <Text style={styles.pendingBadge}>
                      {step.subLabel || 'PENDING'}
                    </Text>
                  )}
                </View>

                <Text
                  style={[
                    styles.stepTitle,
                    isCurrent && styles.stepTitleCurrent,
                    isPending && styles.stepTitlePending,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E5EC',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#14253B',
    letterSpacing: 0.6,
  },
  milestoneText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0878A8',
  },
  stepsList: {
    paddingLeft: 4,
  },
  stepItem: {
    flexDirection: 'row',
    minHeight: 52,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 32,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: '#087A3E',
  },
  circleCurrent: {
    backgroundColor: '#E7194F',
  },
  circlePending: {
    backgroundColor: '#F0F0F3',
    borderWidth: 1,
    borderColor: '#D6DDEA',
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E5EC',
    marginVertical: 4,
  },
  connectorCompleted: {
    backgroundColor: '#087A3E',
  },
  stepContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 6,
  },
  completedBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#087A3E',
    letterSpacing: 0.4,
  },
  currentBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E7194F',
    letterSpacing: 0.4,
  },
  redDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E7194F',
  },
  pendingBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6E7180',
    letterSpacing: 0.4,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14253B',
  },
  stepTitleCurrent: {
    color: '#14253B',
  },
  stepTitlePending: {
    color: '#6E7180',
    fontWeight: '600',
  },
});
