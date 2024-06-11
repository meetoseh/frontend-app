import { ReactElement, useEffect, useRef } from "react";
import { useWritableValueWithCallbacks } from "../../../../../shared/lib/Callbacks";
import { StyleProp, TextStyle, Text, View } from "react-native";
import { useValuesWithCallbacksEffect } from "../../../../../shared/hooks/useValuesWithCallbacksEffect";
import { useContentWidth } from "../../../../../shared/lib/useContentWidth";
import { RenderGuardedComponent } from "../../../../../shared/components/RenderGuardedComponent";
import { styles } from "./ProvidersListStyles";
import { setVWC } from "../../../../../shared/lib/setVWC";
import { FilledInvertedButton } from "../../../../../shared/components/FilledInvertedButton";

export type ProviderItem<T extends string> = {
  key: T;
  icon: ReactElement;
  name: string;
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
  const refs = useWritableValueWithCallbacks<Map<string, Text>>(
    () => new Map()
  );
  const textStyles = useWritableValueWithCallbacks<
    Map<string, StyleProp<TextStyle>>
  >(() => new Map());

  useEffect(() => {
    const oldTextStyles = textStyles.get();
    const oldRefs = refs.get();
    const availableKeys = new Set<string>();
    for (const item of items) {
      if (availableKeys.has(item.key)) {
        throw new Error(`Duplicate key ${item.key} in providers list`);
      }
      availableKeys.add(item.key);
    }

    const badRefKeys: string[] = [];
    for (const key of oldRefs.keys()) {
      if (!availableKeys.has(key)) {
        badRefKeys.push(key);
      }
    }
    if (badRefKeys.length > 0) {
      const newRefs = new Map<string, Text>();
      const skipKeys = new Set(badRefKeys);
      for (const key of oldRefs.keys()) {
        if (!skipKeys.has(key)) {
          newRefs.set(key, oldRefs.get(key)!);
        }
      }
      setVWC(refs, newRefs);
    }

    const badStyleKeys: string[] = [];
    for (const key of oldTextStyles.keys()) {
      if (!availableKeys.has(key)) {
        badStyleKeys.push(key);
      }
    }
    if (badStyleKeys.length > 0) {
      const newTextStyles = new Map<string, StyleProp<TextStyle>>();
      const skipKeys = new Set(badStyleKeys);
      for (const key of oldTextStyles.keys()) {
        if (!skipKeys.has(key)) {
          newTextStyles.set(key, oldTextStyles.get(key)!);
        }
      }
      setVWC(textStyles, newTextStyles);
    }
  }, [items, refs, textStyles]);

  const effectRunning = useRef(false);
  useValuesWithCallbacksEffect([refs, textStyles], () => {
    let running = true;
    setTimeout(updatePaddings, 0); // break loops
    return () => {
      running = false;
    };

    async function updatePaddingsInner() {
      if (!running) {
        return;
      }

      const refsV = refs.get();
      const oldTextStyles = textStyles.get();

      let allWidthsSet = true;
      let anyWidthsSet = false;
      let sawNonzeroPadding = false;
      for (const item of items) {
        const ref = refsV.get(item.key);
        if (ref === undefined) {
          return;
        }

        const textStyle = oldTextStyles.get(item.key);
        if (!textStyle) {
          return;
        }

        const typedTextStyle = textStyle as TextStyle;
        if (typedTextStyle.paddingRight === undefined) {
          allWidthsSet = false;
        } else {
          anyWidthsSet = true;

          if (typedTextStyle.paddingRight !== 0) {
            sawNonzeroPadding = true;
          }
        }
      }

      if (allWidthsSet && sawNonzeroPadding) {
        return;
      }

      if (anyWidthsSet && sawNonzeroPadding) {
        const newTextStyles = new Map<string, StyleProp<TextStyle>>();
        for (const item of items) {
          const ref = refsV.get(item.key);
          if (ref === undefined) {
            return;
          }

          const textStyle = oldTextStyles.get(item.key);
          if (!textStyle) {
            return;
          }

          newTextStyles.set(item.key, {
            ...(textStyle as TextStyle),
            paddingRight: 0,
          });
        }
        setVWC(textStyles, newTextStyles);
        return;
      }

      while (running) {
        const measures = await Promise.all(
          items.map((item) => {
            const ref = refsV.get(item.key);
            if (ref === undefined) {
              return undefined;
            }
            return new Promise<number>((resolve) => {
              ref.measure((x, y, width) => {
                resolve(width);
              });
            });
          })
        );

        if (!running) {
          return;
        }

        let maxWidth = 0;
        let minWidth = Infinity;
        for (const measure of measures) {
          if (measure === undefined) {
            return;
          }
          maxWidth = Math.max(maxWidth, measure);
          minWidth = Math.min(minWidth, measure);
        }

        if (maxWidth <= 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }

        if (minWidth === maxWidth) {
          // The padding is still being applied
          return;
        }

        const newTextStyles = new Map<string, StyleProp<TextStyle>>();
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
          const item = items[itemIndex];
          const ref = refsV.get(item.key);
          if (ref === undefined) {
            return;
          }

          const textStyle = oldTextStyles.get(item.key);
          if (!textStyle) {
            return;
          }
          const width = measures[itemIndex];
          if (width === undefined) {
            return;
          }

          newTextStyles.set(item.key, {
            ...(textStyle as TextStyle),
            paddingRight: maxWidth - width,
          });
        }
        setVWC(textStyles, newTextStyles);
      }
    }

    async function updatePaddings() {
      while (running && effectRunning.current) {
        await new Promise((resolve) => setTimeout(resolve, 16));
      }

      effectRunning.current = true;
      try {
        await updatePaddingsInner();
      } finally {
        effectRunning.current = false;
      }
    }
  });

  const contentWidth = useContentWidth();

  return (
    <View style={styles.container}>
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
          {item.icon}
          <RenderGuardedComponent
            props={textStyles}
            component={(styles) => {
              return (
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
              );
            }}
            equalityFn={() => {
              return false;
            }}
          />
        </FilledInvertedButton>
      ))}
    </View>
  );
}
