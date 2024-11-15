import { ReactElement } from 'react';
import { ValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { styles } from './ChannelSelectorStyles';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { ChannelIcon } from './ChannelIcon';
import { View, Pressable } from 'react-native';
import { useContentWidth } from '../../../../shared/lib/useContentWidth';
import { Channel } from './lib/Channel';

/**
 * Renders the specified channels with the given active channel highlighted.
 * Allows tapping on a channel icon to select it, but the selecting is done
 * via the provided callback.
 */
export const ChannelSelector = ({
  current,
  all,
  onTap,
  noTopPadding,
}: {
  current: ValueWithCallbacks<Channel>;
  all: ValueWithCallbacks<Channel[]>;
  onTap: (channel: Channel) => void;
  noTopPadding?: boolean;
}): ReactElement => {
  const contentWidth = useContentWidth();
  const useFullPadding = contentWidth >= 342;
  return (
    <View
      style={Object.assign(
        {},
        styles.channels,
        noTopPadding ? { marginTop: 0 } : undefined
      )}
    >
      <RenderGuardedComponent
        props={all}
        component={(channels) => (
          <>
            {channels.map((channel) => (
              <Pressable
                key={channel}
                style={Object.assign(
                  {},
                  styles.channelButton,
                  useFullPadding ? styles.fullPaddingChannelButton : undefined
                )}
                onPress={() => {
                  onTap(channel);
                }}
              >
                <ChannelIconAdapter channel={channel} current={current} />
              </Pressable>
            ))}
          </>
        )}
      />
    </View>
  );
};

const ChannelIconAdapter = ({
  channel,
  current,
}: {
  channel: Channel;
  current: ValueWithCallbacks<Channel>;
}): ReactElement => {
  const active = useMappedValueWithCallbacks(current, (c) => c === channel);
  return <ChannelIcon active={active} channel={channel} />;
};
