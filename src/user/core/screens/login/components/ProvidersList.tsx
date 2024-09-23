import { Fragment, ReactElement, useEffect, useRef } from 'react';
import { useWritableValueWithCallbacks } from '../../../../../shared/lib/Callbacks';
import { StyleProp, TextStyle, Text, View } from 'react-native';
import { useValuesWithCallbacksEffect } from '../../../../../shared/hooks/useValuesWithCallbacksEffect';
import { useContentWidth } from '../../../../../shared/lib/useContentWidth';
import { RenderGuardedComponent } from '../../../../../shared/components/RenderGuardedComponent';
import { styles } from './ProvidersListStyles';
import { setVWC } from '../../../../../shared/lib/setVWC';
import { FilledInvertedButton } from '../../../../../shared/components/FilledInvertedButton';
import { TextStyleForwarder } from '../../../../../shared/components/TextStyleForwarder';
import { LinkButton } from '../../../../../shared/components/LinkButton';
import { HorizontalSpacer } from '../../../../../shared/components/HorizontalSpacer';
import { VerticalSpacer } from '../../../../../shared/components/VerticalSpacer';
import { OutlineWhiteButton } from '../../../../../shared/components/OutlineWhiteButton';

export type ProviderItem<T extends string> = {
  key: T;
  icon: ReactElement;
  name: string;
  deemphasize?: boolean;
};

export type ProvidersListProps<T extends string> = {
  items: ProviderItem<T>[];
  onItemPressed: (key: T) => void;
};

/**
 * Renders a list of providers that can be used to login. This
 * is a sequence of filled white buttons with an icon on the left
 * followed by text.
 *
 * It follows a special layout:
 *  - The width of all the icons must be the same
 *  - The width of all of the text may differ
 *  - The space between the icon and the text is constant
 *  - All icons are at the same x-offset relative to the button
 *  - The widest combined icon+text is centered within its button
 */
export function ProvidersList<T extends string>({
  items,
  onItemPressed,
}: ProvidersListProps<T>) {
  const contentWidth = useContentWidth();

  return (
    <View style={styles.container}>
      {items.map((item, idx) => (
        <Fragment key={idx}>
          {idx > 0 && <VerticalSpacer height={18} />}
          {item.deemphasize ? (
            <TextStyleForwarder
              component={(styleVWC) => (
                <OutlineWhiteButton
                  key={item.key}
                  onPress={() => onItemPressed(item.key)}
                  setTextStyle={(style) => setVWC(styleVWC, style)}
                  width={contentWidth}
                >
                  <View style={styles.row}>
                    <HorizontalSpacer width={43.5} />
                    {item.icon}
                    <RenderGuardedComponent
                      props={styleVWC}
                      component={(style) => (
                        <Text style={style}>{item.name}</Text>
                      )}
                    />
                  </View>
                </OutlineWhiteButton>
              )}
            />
          ) : (
            <>
              <TextStyleForwarder
                component={(styleVWC) => (
                  <FilledInvertedButton
                    key={item.key}
                    onPress={() => onItemPressed(item.key)}
                    setTextStyle={(style) => setVWC(styleVWC, style)}
                    width={contentWidth}
                  >
                    <View style={styles.row}>
                      {item.icon}
                      <RenderGuardedComponent
                        props={styleVWC}
                        component={(style) => (
                          <Text style={style}>{item.name}</Text>
                        )}
                      />
                    </View>
                  </FilledInvertedButton>
                )}
              />
            </>
          )}
        </Fragment>
      ))}
    </View>
  );
}
