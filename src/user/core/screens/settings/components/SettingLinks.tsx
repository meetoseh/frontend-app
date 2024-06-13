import { ReactElement } from 'react';
import { RenderGuardedComponent } from '../../../../../shared/components/RenderGuardedComponent';
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../../shared/lib/setVWC';
import { styles } from './SettingLinksStyles';
import {
  Linking,
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useMappedValueWithCallbacks } from '../../../../../shared/hooks/useMappedValueWithCallbacks';
import { useMappedValuesWithCallbacks } from '../../../../../shared/hooks/useMappedValuesWithCallbacks';
import { InlineOsehSpinner } from '../../../../../shared/components/InlineOsehSpinner';
import { RightCaret } from '../../fork/icons/RightCaret';

/**
 * Describes a link that can be used within a settings link block
 */
export type SettingLink = {
  /**
   * The text to display for the link
   */
  text: string;

  /**
   * If specified, displayed below the text in a smaller font, with
   * a newline between each entry
   */
  details?: string[];

  /**
   * The key for the link for rerendering purposes.
   *
   * TODO: Currently ignored for simplicity of implementation with the
   * exception that if this key changes the component will be rerendered.
   * If performance becomes an issue, this can be used to optimize rerendering
   */
  key: string;

  /**
   * The text style for the link, where normal is standard white
   * text
   */
  style?: 'normal';

  /**
   * Which icon to display on the right side of the link, if any,
   * when the spinner is not displayed.
   *
   * Defaults to 'arrow'
   */
  action?: 'arrow' | 'none';

  /**
   * If clicking the link should redirect the user to a new page,
   * i.e., it should be implemented with an anchor tag, this is the
   * URL to redirect to. Otherwise, if this is a function, it will
   * be called when the link is clicked.
   *
   * While the promise is running the link will be disabled and an animation may
   * play to indicate that the user should wait. undefined can be returned to
   * enforce that no animation is played.
   */
  onClick: string | (() => Promise<void> | undefined);

  /**
   * If onClick is a string, this may be a function that will be called before
   * the user is redirected. It may be interrupted at any point, and is typically
   * used to send beacons
   */
  onLinkClick?: () => void;

  /**
   * If true, the link will be disabled. If false, the link will not be disabled
   * even if onClick is a function returning a promise that's still running.
   * If undefined, the link is disabled while the promise is running.
   *
   * Ignored if onClick is a string.
   */
  disabled?: boolean;

  /**
   * If true, a spinner will be presented. If false, a spinner will not be
   * presented even if onClick is a function returning a promise that's still
   * running. If undefined, a spinner is presented while the promise is running.
   *
   * Ignored if onClick is a string.
   */
  spinner?: boolean;
};

export type SettingLinksProps = {
  /**
   * The links to display; null entries are skipped
   */
  links: ValueWithCallbacks<SettingLink | null>[];
};

/**
 * A block of links that can be used in a settings page
 */
export const SettingsLinks = ({ links }: SettingLinksProps): ReactElement => {
  return (
    <View style={styles.container}>
      {links.map((link, index) => {
        return (
          <SettingLinkComponent
            key={index}
            linkVWC={link}
            isFirst={index === 0}
            isLast={index === links.length - 1}
          />
        );
      })}
    </View>
  );
};

const SettingLinkComponent = ({
  linkVWC,
  isFirst,
  isLast,
}: {
  linkVWC: ValueWithCallbacks<SettingLink | null>;
  isFirst: boolean;
  isLast: boolean;
}): ReactElement => {
  const runningVWC = useWritableValueWithCallbacks(() => false);
  const pressingVWC = useWritableValueWithCallbacks(() => false);

  const disabledVWC = useMappedValuesWithCallbacks(
    [linkVWC, runningVWC],
    () => {
      const link = linkVWC.get();
      const running = runningVWC.get();

      if (link === null) {
        return true;
      }

      return link.disabled || (link.disabled === undefined && running);
    }
  );

  const spinnerVWC = useMappedValuesWithCallbacks([linkVWC, runningVWC], () => {
    const link = linkVWC.get();
    const running = runningVWC.get();

    if (link === null) {
      return false;
    }

    return link.spinner || (link.spinner === undefined && running);
  });

  const buttonStylesUnmerged = useMappedValuesWithCallbacks(
    [linkVWC, runningVWC, pressingVWC],
    (): StyleProp<ViewStyle>[] => {
      const link = linkVWC.get();
      const running = runningVWC.get();
      const pressing = pressingVWC.get();

      if (link === null) {
        return [];
      }

      const isDisabled =
        link.disabled || (link.disabled === undefined && running);
      const isSpinner = link.spinner || (link.spinner === undefined && running);

      return [
        styles.item,
        isFirst ? styles.itemFirst : undefined,
        !isFirst ? styles.itemNotFirst : undefined,
        isLast ? styles.itemLast : undefined,
        isSpinner ? styles.itemSpinner : undefined,
        isDisabled ? styles.itemDisabled : undefined,
        pressing ? styles.itemPressed : undefined,
        (styles as any)['item_' + (link.style || 'normal')],
      ];
    },
    {
      outputEqualityFn: (a, b) =>
        a.length === b.length &&
        a.every((value, index) => Object.is(value, b[index])),
    }
  );

  const buttonStyle = useMappedValueWithCallbacks(
    buttonStylesUnmerged,
    (styles): StyleProp<ViewStyle> => {
      return Object.assign({}, ...styles);
    }
  );

  const textStylesUnmerged = useMappedValuesWithCallbacks(
    [linkVWC, runningVWC],
    (): StyleProp<TextStyle>[] => {
      const link = linkVWC.get();
      const running = runningVWC.get();

      if (link === null) {
        return [];
      }

      const isDisabled =
        link.disabled || (link.disabled === undefined && running);

      return [
        styles.text,
        isDisabled ? styles.textDisabled : undefined,
        (styles as any)['text_' + (link.style || 'normal')],
      ];
    }
  );

  const textStyle = useMappedValueWithCallbacks(
    textStylesUnmerged,
    (styles): StyleProp<TextStyle> => {
      return Object.assign({}, ...styles);
    }
  );

  const textVWC = useMappedValueWithCallbacks(
    linkVWC,
    (link) => link?.text || '',
    { outputEqualityFn: Object.is }
  );

  const detailsVWC = useMappedValueWithCallbacks(
    linkVWC,
    (link) => link?.details,
    {
      outputEqualityFn: (a, b) =>
        (a === undefined && b === undefined) ||
        (a !== undefined &&
          b !== undefined &&
          a.length === b.length &&
          a.every((value, index) => value === b[index])),
    }
  );

  const linkAvailableVWC = useMappedValueWithCallbacks(
    linkVWC,
    (link) => link !== null,
    { outputEqualityFn: Object.is }
  );

  const actionVWC = useMappedValueWithCallbacks(
    linkVWC,
    (link): 'arrow' | 'none' => link?.action || 'arrow',
    { outputEqualityFn: Object.is }
  );

  const renderProps = useMappedValuesWithCallbacks(
    [
      buttonStyle,
      textStyle,
      disabledVWC,
      spinnerVWC,
      textVWC,
      detailsVWC,
      linkAvailableVWC,
      actionVWC,
    ],
    () => ({
      buttonStyle: buttonStyle.get(),
      textStyle: textStyle.get(),
      disabled: disabledVWC.get(),
      spinner: spinnerVWC.get(),
      text: textVWC.get(),
      details: detailsVWC.get(),
      linkAvailable: linkAvailableVWC.get(),
      action: actionVWC.get(),
    })
  );

  return (
    <RenderGuardedComponent
      props={renderProps}
      component={(args) => {
        if (!args.linkAvailable) {
          return <></>;
        }
        return (
          <Pressable
            style={args.buttonStyle}
            onPress={async () => {
              if (args.disabled) {
                return;
              }

              setVWC(runningVWC, true);
              try {
                const handler = linkVWC.get()?.onClick;
                if (handler === undefined) {
                  return;
                }

                if (typeof handler === 'function') {
                  await handler();
                } else {
                  await Linking.openURL(handler);
                }
              } finally {
                setVWC(runningVWC, false);
              }
            }}
            onPressIn={() => {
              setVWC(pressingVWC, true);
            }}
            onPressOut={() => {
              setVWC(pressingVWC, false);
            }}
          >
            <View style={styles.content}>
              <Text style={args.textStyle}>{args.text}</Text>
              {args.details !== undefined && (
                <View style={styles.details}>
                  {args.details.map((detail, index) => (
                    <Text key={`${index}--${detail}`} style={styles.detail}>
                      {detail}
                    </Text>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.actionContainer}>
              {args.spinner ? (
                <InlineOsehSpinner
                  size={{
                    type: 'react-rerender',
                    props: {
                      height: 16,
                    },
                  }}
                />
              ) : (
                args.action === 'arrow' && <RightCaret />
              )}
            </View>
          </Pressable>
        );
      }}
    />
  );
};
