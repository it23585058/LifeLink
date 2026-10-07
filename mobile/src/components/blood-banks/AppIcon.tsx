import { SymbolView } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

export type IconName =
  | 'back'
  | 'location'
  | 'phone'
  | 'reserve'
  | 'portal'
  | 'clock'
  | 'warning'
  | 'verified'
  | 'shield'
  | 'calendar'
  | 'plus'
  | 'minus'
  | 'check'
  | 'close'
  | 'truck'
  | 'drop'
  | 'refresh'
  | 'car'
  | 'hospital'
  | 'filter';

const ICON_MAP: Record<
  IconName,
  { ios: string; android: string; web: string }
> = {
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  location: { ios: 'location.fill', android: 'location_on', web: 'location_on' },
  phone: { ios: 'phone.fill', android: 'call', web: 'call' },
  reserve: { ios: 'cross.case.fill', android: 'medical_services', web: 'medical_services' },
  portal: { ios: 'arrow.up.right.square', android: 'open_in_new', web: 'open_in_new' },
  clock: { ios: 'clock.fill', android: 'schedule', web: 'schedule' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
  verified: { ios: 'checkmark.shield.fill', android: 'verified', web: 'verified' },
  shield: { ios: 'shield.fill', android: 'shield', web: 'shield' },
  calendar: { ios: 'calendar', android: 'event', web: 'event' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  minus: { ios: 'minus', android: 'remove', web: 'remove' },
  check: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  truck: { ios: 'box.truck.fill', android: 'local_shipping', web: 'local_shipping' },
  drop: { ios: 'drop.fill', android: 'water_drop', web: 'water_drop' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
  car: { ios: 'car.fill', android: 'directions_car', web: 'directions_car' },
  hospital: { ios: 'building.2.fill', android: 'local_hospital', web: 'local_hospital' },
  filter: { ios: 'line.3.horizontal.decrease.circle', android: 'filter_list', web: 'filter_list' },
};

export function AppIcon({
  name,
  size = 18,
  tintColor = '#14253B',
  style,
}: {
  name: IconName;
  size?: number;
  tintColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const iconDef = ICON_MAP[name] || ICON_MAP.hospital;
  return (
    <SymbolView
      name={{
        ios: iconDef.ios,
        android: iconDef.android,
        web: iconDef.web,
      }}
      size={size}
      tintColor={tintColor}
      style={style}
    />
  );
}
