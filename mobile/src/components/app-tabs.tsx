import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.tabSlot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="emergency-feed" href="/emergency-feed" asChild>
            <TabButton>Feed</TabButton>
          </TabTrigger>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Find Donors</TabButton>
          </TabTrigger>
          <TabTrigger name="request" href="/request" asChild>
            <TabButton>Request</TabButton>
          </TabTrigger>
          <TabTrigger name="hospitals" href="/hospitals" asChild>
            <TabButton>Hospitals</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton>Profile</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  children,
  isFocused,
  ...props
}: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <ThemedText
          type="small"
          numberOfLines={1}
          style={isFocused ? styles.selectedText : styles.inactiveText}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      {...props}
      style={[
        styles.tabListContainer,
        { paddingBottom: Math.max(insets.bottom, Spacing.two) },
      ]}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabSlot: {
    flex: 1,
  },
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 10,
    elevation: 10,
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  tabButton: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.7,
  },
  selectedText: {
    color: '#E7194F',
    textAlign: 'center',
  },
  inactiveText: {
    color: '#6E7180',
    textAlign: 'center',
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: 2,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
});
