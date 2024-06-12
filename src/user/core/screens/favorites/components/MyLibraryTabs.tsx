import { PropsWithChildren, ReactElement } from 'react';
import { styles } from './MyLibraryTabsStyles';
import { HorizontalSpacer } from '../../../../../shared/components/HorizontalSpacer';
import { ValueWithCallbacks } from '../../../../../shared/lib/Callbacks';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { RenderGuardedComponent } from '../../../../../shared/components/RenderGuardedComponent';
import { debugView } from '../../../../../shared/lib/debugView';

/**
 * Allows the user to click between the given tabs in the My Library screen
 * (which is really a collection of 3 screens)
 */
export const MyLibraryTabs = ({
  active,
  contentWidth: contentWidthVWC,
  onFavorites,
  onHistory,
  onOwned,
}: {
  active: 'favorites' | 'history' | 'owned';
  contentWidth: ValueWithCallbacks<number>;
  onFavorites?: () => void;
  onHistory?: () => void;
  onOwned?: () => void;
}): ReactElement => {
  return (
    <RenderGuardedComponent
      props={contentWidthVWC}
      component={(width) => (
        <ScrollView
          style={{
            width,
            flexGrow: 0,
            flexShrink: 0,
          }}
          contentContainerStyle={{
            minWidth: width,
            flexGrow: 0,
            flexShrink: 0,
            justifyContent: 'center',
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Btn onClick={onFavorites} active={active === 'favorites'}>
              Favorites
            </Btn>
            <HorizontalSpacer width={24} />
            <Btn onClick={onHistory} active={active === 'history'}>
              History
            </Btn>
            <HorizontalSpacer width={24} />
            <Btn onClick={onOwned} active={active === 'owned'}>
              Owned
            </Btn>
          </View>
        </ScrollView>
      )}
    />
  );
};

const Btn = ({
  onClick,
  active,
  children,
}: PropsWithChildren<{
  onClick?: () => void;
  active: boolean;
}>): ReactElement => {
  if (onClick === undefined) {
    return (
      <View style={active ? styles.active : styles.inactive}>
        <Text style={active ? styles.activeText : styles.inactiveText}>
          {children}
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => {
        onClick?.();
      }}
      style={active ? styles.active : styles.inactive}
    >
      <Text style={active ? styles.activeText : styles.inactiveText}>
        {children}
      </Text>
    </Pressable>
  );
};
