import { ReactElement, useEffect, useMemo } from 'react';
import { InteractiveColorPrompt } from '../models/InteractivePrompt';
import { CountdownText } from './CountdownText';
import { styles } from './ColorPromptStyles';
import { useWindowSize } from '../../../shared/hooks/useWindowSize';
import { ProfilePictures } from './ProfilePictures';
import {
  WritableValueWithCallbacks,
  createWritableValueWithCallbacks,
} from '../../../shared/lib/Callbacks';
import { getColor3fFromHex } from '../../../shared/lib/BezierAnimation';
import { PromptTitle } from './PromptTitle';
import {
  VPFRRProps,
  VerticalPartlyFilledRoundedRect,
} from '../../../shared/anim/VerticalPartlyFilledRoundedRect';
import { useMappedValueWithCallbacks } from '../../../shared/hooks/useMappedValueWithCallbacks';
import { RenderGuardedComponent } from '../../../shared/components/RenderGuardedComponent';
import { PromptProps } from '../models/PromptProps';
import { PromptSettings } from '../models/PromptSettings';
import { usePromptResources } from '../hooks/usePromptResources';
import { apiFetch } from '../../../shared/lib/apiFetch';
import { Pressable, View, Text } from 'react-native';
import { CustomButtonProps } from '../../../shared/models/CustomButtonProps';
import { FilledPrimaryButton } from '../../../shared/components/FilledPrimaryButton';
import { LinkButton } from '../../../shared/components/LinkButton';
import { TextStyleForwarder } from '../../../shared/components/TextStyleForwarder';
import { setVWC } from '../../../shared/lib/setVWC';

const colorInactiveOpacity = 0.4;
const colorActiveOpacity = 1.0;

const colorForegroundOpacity = 1.0;
const colorBackgroundOpacity = 0.4;

const settings: PromptSettings<InteractiveColorPrompt, string | null> = {
  getSelectionFromIndex: (prompt, index) =>
    index ? prompt.prompt.colors[index] ?? null : null,
  getResponseDistributionFromStats: (prompt, stats) =>
    stats.colorActive ?? prompt.prompt.colors.map(() => 0),
  storeResponse: async (loginContext, prompt, time, response, index) => {
    if (index === null) {
      return;
    }

    await apiFetch(
      '/api/1/interactive_prompts/events/respond_color_prompt',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          interactive_prompt_uid: prompt.uid,
          interactive_prompt_jwt: prompt.jwt,
          session_uid: prompt.sessionUid,
          prompt_time: time / 1000,
          data: {
            index,
          },
        }),
        keepalive: true,
      },
      loginContext
    );
  },
};

/**
 * Displays an color interactive prompt, where users can select a color and
 * see what colors other users have selected.
 */
export const ColorPrompt = (
  props: PromptProps<InteractiveColorPrompt, string | null>
): ReactElement => {
  const resources = usePromptResources(props, settings);
  const hasSelectionVWC = useMappedValueWithCallbacks(
    resources.selectedIndex,
    (s) => s !== null
  );
  const screenSize = useWindowSize();

  const colorsContainerWidth = Math.min(
    390,
    Math.min(screenSize.width, 440) - 64
  );
  const colorsGapPx = 32;
  const colorsMaxWidthPx = 48;
  const colorsHeightPx = 128;

  const colorToIndex = useMemo(() => {
    const lookup = new Map<string, number>();
    const colors = resources.prompt.prompt.colors;
    for (let i = 0; i < colors.length; i++) {
      lookup.set(colors[i], i);
    }
    return lookup;
  }, [resources]);

  const colorRows: string[][] = useMemo(() => {
    const colors = resources.prompt.prompt.colors;
    if (colors.length <= 4) {
      return [colors];
    }

    const columns = Math.ceil(colors.length / 2);
    const rows: string[][] = [];
    let row: string[] = [];
    for (let i = 0; i < colors.length; i++) {
      row.push(colors[i]);
      if (row.length === columns) {
        rows.push(row);
        row = [];
      }
    }
    if (row.length > 0) {
      rows.push(row);
    }
    return rows;
  }, [resources]);

  const rowHeight =
    (colorsHeightPx - (colorRows.length - 1) * colorsGapPx) / colorRows.length;

  const itemWidth = useMemo(() => {
    let width = colorsMaxWidthPx;

    for (let rowIndex = 0; rowIndex < colorRows.length; rowIndex++) {
      const row = colorRows[rowIndex];
      const naturalWidth =
        (colorsContainerWidth - (row.length - 1) * colorsGapPx) / row.length;
      width = Math.min(naturalWidth, colorsMaxWidthPx);
    }

    return width;
  }, [colorRows, colorsContainerWidth]);

  const trueColorsWidth = useMemo(() => {
    const maxItemsPerRow = Math.max(...colorRows.map((row) => row.length));
    return maxItemsPerRow * itemWidth + (maxItemsPerRow - 1) * colorsGapPx;
  }, [colorRows, itemWidth]);

  const colorStates = useMemo(() => {
    const colors = resources.prompt.prompt.colors;
    const result: WritableValueWithCallbacks<VPFRRProps>[] = [];
    for (let outerIndex = 0; outerIndex < colors.length; outerIndex++) {
      const color = colors[outerIndex];
      result.push(
        createWritableValueWithCallbacks<VPFRRProps>({
          filledHeight: 0.5,
          borderRadius: Math.ceil(Math.min(itemWidth, rowHeight) * 0.1),
          unfilledColor: addOpacity(color, colorBackgroundOpacity),
          filledColor: addOpacity(color, colorForegroundOpacity),
          opacity: colorInactiveOpacity,
          border: { width: 2 },
        })
      );
    }
    return result;
  }, [resources, itemWidth, rowHeight]);

  // manages the opacity on the options
  useEffect(() => {
    resources.selectedIndex.callbacks.add(handleEvent);
    let highlighted: number | null = null;
    return () => {
      resources.selectedIndex.callbacks.remove(handleEvent);
      removeHighlight();
    };

    function removeHighlight() {
      if (highlighted !== null) {
        colorStates[highlighted].set(
          Object.assign({}, colorStates[highlighted].get(), {
            opacity: colorInactiveOpacity,
          })
        );
        colorStates[highlighted].callbacks.call(undefined);
        highlighted = null;
      }
    }

    function handleEvent() {
      const selected = resources.selectedIndex.get();
      if (selected === highlighted) {
        return;
      }
      removeHighlight();
      if (selected === null) {
        return;
      }

      highlighted = selected;
      colorStates[selected].set(
        Object.assign({}, colorStates[selected].get(), {
          opacity: colorActiveOpacity,
        })
      );
      colorStates[selected].callbacks.call(undefined);
    }
  }, [resources, colorStates]);

  // manages the height on the options
  useEffect(() => {
    resources.clientPredictedResponseDistribution.callbacks.add(update);
    update();
    return () => {
      resources.clientPredictedResponseDistribution.callbacks.remove(update);
    };

    function update() {
      const newCorrectedStats =
        resources.clientPredictedResponseDistribution.get();
      const total = newCorrectedStats.reduce((a, b) => a + b, 0);
      const fractionals =
        total === 0
          ? newCorrectedStats.map(() => 0)
          : newCorrectedStats.map((colAmt) => {
              return colAmt / total;
            });
      fractionals.forEach((fractional, index) => {
        const old = colorStates[index].get();

        if (old.filledHeight !== fractional) {
          colorStates[index].set(
            Object.assign({}, old, { filledHeight: fractional })
          );
          colorStates[index].callbacks.call(undefined);
        }
      });
    }
  }, [resources, colorStates]);

  const finishEarly = props.finishEarly;

  return (
    <>
      {props.countdown && (
        <CountdownText
          promptTime={resources.time}
          prompt={resources.prompt}
          {...props.countdown}
        />
      )}
      <View style={styles.prompt}>
        <PromptTitle
          text={resources.prompt.prompt.text}
          subtitle={props.subtitle}
          titleMaxWidth={props.titleMaxWidth}
        />
        <View style={styles.colors}>
          {colorRows.map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={{
                ...styles.colorRow,
                ...(rowIndex === 0 ? {} : styles.colorRowNotFirstChild),
                height: rowHeight,
              }}
            >
              {row.map((color, colIndex) => (
                <Pressable
                  key={`${color}-${colIndex}`}
                  style={{
                    ...styles.color,
                    ...(colIndex === 0 ? {} : styles.colorNotFirstChild),
                    width: itemWidth,
                  }}
                  onPress={() => {
                    const old = resources.selectedIndex.get();
                    const clicked = colorToIndex.get(color)!;
                    if (old === clicked) {
                      return;
                    }
                    resources.selectedIndex.set(clicked);
                    resources.selectedIndex.callbacks.call(undefined);
                  }}
                >
                  <VerticalPartlyFilledRoundedRect
                    props={{
                      type: 'callbacks',
                      props: () => colorStates[colorToIndex.get(color)!].get(),
                      callbacks:
                        colorStates[colorToIndex.get(color)!].callbacks,
                    }}
                    height={rowHeight}
                    width={itemWidth}
                  />
                </Pressable>
              ))}
            </View>
          ))}
        </View>
        {finishEarly && (
          <View
            style={{
              ...styles.continueContainer,
              ...(props.countdown && screenSize.height <= 750
                ? {}
                : { paddingTop: 45, paddingBottom: 60 }),
            }}
          >
            <TextStyleForwarder
              component={(styleVWC) => (
                <RenderGuardedComponent
                  props={hasSelectionVWC}
                  component={(hasSelection) => {
                    const text = hasSelection
                      ? finishEarly === true
                        ? 'Continue'
                        : finishEarly.cta
                      : 'Skip';
                    const props: CustomButtonProps = {
                      onPress: resources.onSkip,
                      setTextStyle: (s) => setVWC(styleVWC, s),
                    };

                    if (hasSelection) {
                      return (
                        <FilledPrimaryButton {...props}>
                          <RenderGuardedComponent
                            props={styleVWC}
                            component={(textStyle) => (
                              <Text style={textStyle}>{text}</Text>
                            )}
                          />
                        </FilledPrimaryButton>
                      );
                    } else {
                      return (
                        <LinkButton {...props}>
                          <RenderGuardedComponent
                            props={styleVWC}
                            component={(textStyle) => (
                              <Text style={textStyle}>{text}</Text>
                            )}
                          />
                        </LinkButton>
                      );
                    }
                  }}
                />
              )}
            />
          </View>
        )}
        <View
          style={Object.assign(
            {},
            styles.profilePictures,
            finishEarly ? null : { width: trueColorsWidth }
          )}
        >
          <ProfilePictures profilePictures={resources.profilePictures} />
        </View>
      </View>
    </>
  );
};

/**
 * Takes a hex string and converts it to [r, g, b, a] as 0-1 floats by adding
 * the given opacity
 *
 * @param hex The hex string, e.g., #ff0000
 * @param opacity The opacity, 0-1, e.g., 0.5
 * @returns [r, g, b, a] as 0-1 floats, e.g., [1, 0, 0, 0.5]
 */
const addOpacity = (
  hex: string,
  opacity: number
): [number, number, number, number] => {
  const rgb = getColor3fFromHex(hex);
  return [rgb[0], rgb[1], rgb[2], opacity];
};
