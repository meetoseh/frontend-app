import { ReactElement } from "react";
import { useWritableValueWithCallbacks } from "../../../../../shared/lib/Callbacks";
import { StyleProp, TextStyle, Text } from "react-native";
import { useValuesWithCallbacksEffect } from "../../../../../shared/hooks/useValuesWithCallbacksEffect";
import { useContentWidth } from "../../../../../shared/lib/useContentWidth";
import { FilledInvertedButton } from "../../../../../shared/components/FilledInvertedButton";
import { RenderGuardedComponent } from "../../../../../shared/components/RenderGuardedComponent";

export type ProviderItem = {
  key: string;
  icon: ReactElement;
  name: string;
};

export type ProvidersListProps = {
  items: ProviderItem[];
  onItemPressed: (key: string) => void;
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
export const ProvidersList = ({ items, onItemPressed }: ProvidersListProps) => {
  const refs = useWritableValueWithCallbacks<Map<string, Text>>(
    () => new Map()
  );
  const textStyles = useWritableValueWithCallbacks<
    Map<string, StyleProp<TextStyle>>
  >(() => new Map());

  (() => {
    const availableKeys = new Set<string>();
    for (const item of items) {
      if (availableKeys.has(item.key)) {
        throw new Error(`Duplicate key ${item.key} in providers list`);
      }
      availableKeys.add(item.key);
    }

    const badRefKeys: string[] = [];
    for (const key of refs.get().keys()) {
      if (!availableKeys.has(key)) {
        badRefKeys.push(key);
      }
    }
    if (badRefKeys.length > 0) {
      for (const badRefKey of badRefKeys) {
        refs.get().delete(badRefKey);
      }
      refs.callbacks.call(undefined);
    }

    const badStyleKeys: string[] = [];
    for (const key of textStyles.get().keys()) {
      if (!availableKeys.has(key)) {
        badStyleKeys.push(key);
      }
    }
    if (badStyleKeys.length > 0) {
      for (const badStyleKey of badStyleKeys) {
        textStyles.get().delete(badStyleKey);
      }
      textStyles.callbacks.call(undefined);
    }
  })();

  useValuesWithCallbacksEffect([refs, textStyles], () => {
    let running = true;
    updatePaddings();
    return () => {
      running = false;
    };

    async function updatePaddings() {
      if (!running) {
        return;
      }
      // todo
    }
  });

  const contentWidth = useContentWidth();

  return (
    <>
      {items.map((item) => (
        <FilledInvertedButton
          key={item.key}
          onPress={() => onItemPressed(item.key)}
          setTextStyle={(style) => {
            textStyles.get().set(item.key, style);
            textStyles.callbacks.call(undefined);
          }}
          width={contentWidth}
        >
          <RenderGuardedComponent
            props={textStyles}
            component={(styles) => (
              <Text
                style={styles.get(item.key)}
                ref={(r) => {
                  const map = refs.get();
                  if (r === null) {
                    if (map.has(item.key)) {
                      map.delete(item.key);
                      refs.callbacks.call(undefined);
                    }
                    return;
                  }

                  if (Object.is(map.get(item.key), r)) {
                    return;
                  }
                  map.set(item.key, r);
                  refs.callbacks.call(undefined);
                }}
              >
                {item.name}
              </Text>
            )}
            equalityFn={() => false}
          />
        </FilledInvertedButton>
      ))}
    </>
  );
};
