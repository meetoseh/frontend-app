import { ReactElement } from 'react';
import { styles } from './BottomNavBarStyles';
import { Pressable, View, Text, Platform, ViewStyle } from 'react-native';
import {
  useWindowSize,
  useWindowSizeValueWithCallbacks,
} from '../../shared/hooks/useWindowSize';
import Home from './assets/Home';
import Account from './assets/Account';
import Series from './assets/Series';
import { useBotBarHeight } from '../../shared/hooks/useBotBarHeight';
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../shared/lib/Callbacks';
import { RenderGuardedComponent } from '../../shared/components/RenderGuardedComponent';
import { useMappedValueWithCallbacks } from '../../shared/hooks/useMappedValueWithCallbacks';
import { useStyleVWC } from '../../shared/hooks/useStyleVWC';
import { setVWC } from '../../shared/lib/setVWC';
import { useMappedValuesWithCallbacks } from '../../shared/hooks/useMappedValuesWithCallbacks';
import { VerticalSpacer } from '../../shared/components/VerticalSpacer';

export type BottomNavItem = 'home' | 'series' | 'account';

type ItemInfo = {
  readonly item: BottomNavItem;
  readonly iconClass: (active: boolean) => ReactElement;
  readonly label: string;
};

const items: readonly ItemInfo[] = [
  {
    item: 'home',
    iconClass: (active) => <Home active={active} />,
    label: 'Home',
  },
  {
    item: 'series',
    iconClass: (active) => <Series active={active} />,
    label: 'Series',
  },
  {
    item: 'account',
    iconClass: (active) => <Account active={active} />,
    label: 'Account',
  },
] as const;

export type BottomNavBarProps = {
  active: BottomNavItem | null;

  clickHandlers: {
    [K in BottomNavItem]?: () => void;
  };
};

/**
 * Renders the standard bottom nav bar. This is rendered where it is
 * on the DOM and hence usually needs to have its position considered
 * by the outer component.
 * @deprecated use BottomNavBarMinimal instead
 */
export const BottomNavBar = ({
  active,
  clickHandlers,
}: BottomNavBarProps): ReactElement => {
  const windowSizeVWC = useWindowSizeValueWithCallbacks();

  return (
    <View>
      <BottomNavBarMinimal
        widthVWC={useMappedValueWithCallbacks(windowSizeVWC, (ws) => ws.width)}
        paddingBottomVWC={useWritableValueWithCallbacks(() =>
          Platform.select({
            ios: 12, // notch on iphone x
            default: 0,
          })
        )}
        active={active}
        clickHandlers={clickHandlers}
      />
    </View>
  );
};

/**
 * Renders the standard bottom nav bar at the given width, with the given
 * amount below it assumed to be ambiguously obscured (i.e., may or may
 * not actually be visible, and so we'll keep the same background color
 * but won't put anything important there).
 */
export const BottomNavBarMinimal = ({
  widthVWC,
  paddingBottomVWC,
  active,
  clickHandlers,
}: {
  widthVWC: ValueWithCallbacks<number>;
  paddingBottomVWC: ValueWithCallbacks<number>;
} & BottomNavBarProps): ReactElement => {
  const containerRef = useWritableValueWithCallbacks<View | null>(() => null);
  const containerStyleVWC = useMappedValueWithCallbacks(
    widthVWC,
    (width): ViewStyle =>
      Object.assign({}, styles.container, {
        width,
      })
  );
  useStyleVWC(containerRef, containerStyleVWC);

  return (
    <View style={containerStyleVWC.get()} ref={(r) => setVWC(containerRef, r)}>
      <View style={styles.items}>
        {items.map((item) => (
          <BottomNavItem
            key={item.item}
            active={active === item.item}
            item={item}
            handler={clickHandlers[item.item]}
          />
        ))}
      </View>
      <RenderGuardedComponent
        props={paddingBottomVWC}
        component={(height) => <VerticalSpacer height={height} />}
      />
    </View>
  );
};

const BottomNavItem = ({
  active,
  item,
  handler,
}: {
  active: boolean;
  item: ItemInfo;
  handler: (() => void) | undefined;
}): ReactElement => {
  return (
    <View
      style={Object.assign(
        {},
        styles.itemWrapper,
        active ? styles.itemWrapperActive : undefined
      )}
    >
      <Pressable
        style={styles.item}
        onPress={() => {
          handler?.();
        }}
      >
        <View style={styles.iconWrapper}>{item.iconClass(active)}</View>
        <Text
          style={Object.assign(
            {},
            styles.label,
            active ? styles.labelActive : undefined
          )}
        >
          {item.label}
        </Text>
      </Pressable>
    </View>
  );
};
