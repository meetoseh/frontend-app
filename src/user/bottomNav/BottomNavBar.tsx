import { ReactElement } from 'react';
import { styles } from './BottomNavBarStyles';
import { Pressable, View, Text, Platform } from 'react-native';
import { useWindowSize } from '../../shared/hooks/useWindowSize';
import Home from './assets/Home';
import Account from './assets/Account';
import Series from './assets/Series';
import { useBotBarHeight } from '../../shared/hooks/useBotBarHeight';

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
 */
export const BottomNavBar = ({
  active,
  clickHandlers,
}: BottomNavBarProps): ReactElement => {
  const windowSize = useWindowSize();
  const bottom = useBotBarHeight();

  return (
    <View>
      <View
        style={Object.assign({}, styles.container, { width: windowSize.width })}
      >
        {items.map((item) => (
          <BottomNavItem
            key={item.item}
            active={active === item.item}
            item={item}
            handler={clickHandlers[item.item]}
          />
        ))}
      </View>
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
