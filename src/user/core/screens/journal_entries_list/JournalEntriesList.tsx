import { ReactElement, useCallback, useMemo } from 'react';
import { PeekedScreen, ScreenComponentProps } from '../../models/Screen';
import { JournalEntriesListMappedParams } from './JournalEntriesListParams';
import { JournalEntriesListResources } from './JournalEntriesListResources';
import {
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import {
  useWritableValueWithCallbacks,
  ValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { ScreenHeader } from '../../../../shared/components/ScreenHeader';
import { configurableScreenOut } from '../../lib/configurableScreenOut';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { styles } from './JournalEntriesListStyles';
import { JournalEntry } from './lib/JournalEntry';
import { ScreenContext } from '../../hooks/useScreenContext';
import { useStyleVWC } from '../../../../shared/hooks/useStyleVWC';
import { setVWC } from '../../../../shared/lib/setVWC';
import { JournalEntryCard } from './components/JournalEntryCard';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import {
  InfiniteListing,
  NetworkedInfiniteListing,
  PrefixedNetworkedInfiniteListing,
} from '../../../../shared/lib/InfiniteListing';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { InfiniteList } from '../../../../shared/components/InfiniteList';
import { View, Text } from 'react-native';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';

type TooltipPlaceholder = { readonly uid: 'tooltip' };

/**
 * Shows the list of journal entries the user has written, typically in
 * descending order of canonical time.
 */
export const JournalEntriesList = ({
  ctx,
  screen,
  resources,
  startPop,
  trace,
}: ScreenComponentProps<
  'journal_entries_list',
  JournalEntriesListResources,
  JournalEntriesListMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const isErrorVWC = useMappedValueWithCallbacks(
    resources.list,
    (list) => list === undefined
  );
  useValueWithCallbacksEffect(isErrorVWC, (isError) => {
    if (isError) {
      trace({
        type: 'error',
        listUndefined: resources.list.get() === undefined,
      });
    }
    return undefined;
  });

  const windowWidthVWC = useMappedValueWithCallbacks(
    ctx.windowSizeImmediate,
    (size) => size.width
  );

  const gotoJournalEntry = useCallback(
    (journalEntry: JournalEntry) => {
      configurableScreenOut(
        workingVWC,
        startPop,
        transition,
        screen.parameters.close.exit,
        screen.parameters.journalEntryTrigger,
        {
          parameters: {
            journal_entry_uid: journalEntry.uid,
          },
        }
      );
    },
    [screen.parameters, workingVWC, startPop, transition]
  );
  const editJournalEntry = useCallback(
    (journalEntry: JournalEntry) => {
      configurableScreenOut(
        workingVWC,
        startPop,
        transition,
        screen.parameters.close.exit,
        screen.parameters.journalEntryEditTrigger,
        {
          parameters: {
            journal_entry_uid: journalEntry.uid,
          },
        }
      );
    },
    [screen.parameters, workingVWC, startPop, transition]
  );

  const boundComponent = useMemo<
    (
      item: ValueWithCallbacks<JournalEntry | TooltipPlaceholder>,
      setItem: (newItem: JournalEntry | TooltipPlaceholder) => void,
      previous: ValueWithCallbacks<JournalEntry | TooltipPlaceholder | null>,
      next: ValueWithCallbacks<JournalEntry | TooltipPlaceholder | null>
    ) => ReactElement
  >(() => {
    return (item, _setItem, _previous, next) => (
      <JournalEntryComponentWrapper
        gotoJournalEntry={gotoJournalEntry}
        editJournalEntry={editJournalEntry}
        item={item}
        ctx={ctx}
        screen={screen}
        next={next}
      />
    );
  }, [ctx, screen, gotoJournalEntry]);

  const listHeight = useMappedValuesWithCallbacks(
    [ctx.windowSizeImmediate, ctx.topBarHeight, ctx.botBarHeight],
    () =>
      ctx.windowSizeImmediate.get().height -
      ctx.topBarHeight.get() -
      54 /* screen header */ -
      32 /* avoid being too tight */
    // we purposely let the list go down to the bottom, so don't subtract ctx.botBarHeight
  );

  const mappedListVWC = useMappedValueWithCallbacks(
    resources.list,
    (list): InfiniteListing<JournalEntry | TooltipPlaceholder> | null => {
      if (list === null || list === undefined) {
        return null;
      }

      if (screen.parameters.tooltip === null) {
        return list.listing as NetworkedInfiniteListing<
          JournalEntry | TooltipPlaceholder
        >;
      }

      return new PrefixedNetworkedInfiniteListing<
        JournalEntry,
        TooltipPlaceholder
      >(list.listing, [{ uid: 'tooltip' }]) as any as NetworkedInfiniteListing<
        JournalEntry | TooltipPlaceholder
      >;
    },
    {
      inputEqualityFn: () => false,
    }
  );

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={false}
      statusBar="light"
    >
      <GridDarkGrayBackground />
      <GridContentContainer
        gridSizeVWC={ctx.windowSizeImmediate}
        contentWidthVWC={windowWidthVWC}
        left={transitionState.left}
        opacity={transitionState.opacity}
        justifyContent="flex-start"
        scrollable={false}
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(height) => <VerticalSpacer height={height} />}
        />
        <ScreenHeader
          close={{
            variant: screen.parameters.close.variant,
            onClick: () => {
              configurableScreenOut(
                workingVWC,
                startPop,
                transition,
                screen.parameters.close.exit,
                screen.parameters.close.trigger,
                {
                  afterDone: () => {
                    trace({ type: 'close' });
                  },
                }
              );
            },
          }}
          text={screen.parameters.header}
          windowWidth={windowWidthVWC}
          contentWidth={ctx.contentWidth}
        />
        <VerticalSpacer height={16} />
        <RenderGuardedComponent
          props={useMappedValuesWithCallbacks(
            [mappedListVWC, listHeight, ctx.contentWidth],
            () => ({
              list: mappedListVWC.get(),
              listHeight: listHeight.get(),
              width: ctx.contentWidth.get(),
            }),
            {
              outputEqualityFn: (a, b) =>
                Object.is(a.list, b.list) &&
                a.listHeight === b.listHeight &&
                a.width === b.width,
            }
          )}
          component={({ list, listHeight, width }) =>
            list === null ? (
              <></>
            ) : (
              <InfiniteList
                listing={list}
                component={boundComponent}
                itemComparer={compareJournalEntries}
                height={listHeight}
                gap={10}
                initialComponentHeight={292}
                emptyElement={
                  <RenderGuardedComponent
                    props={ctx.contentWidth}
                    component={(cw) => (
                      <View style={styles.emptyWrapper}>
                        <Text
                          style={Object.assign({}, styles.empty, {
                            width: cw,
                          })}
                        >
                          You haven't completed any journal entries yet.
                        </Text>
                      </View>
                    )}
                  />
                }
                width={width}
                noScrollBar
              />
            )
          }
        />
        <VerticalSpacer height={0} flexGrow={1} />
      </GridContentContainer>
      {screen.parameters.cta !== null ? (
        <GridContentContainer
          gridSizeVWC={ctx.windowSizeImmediate}
          contentWidthVWC={windowWidthVWC}
          justifyContent="flex-start"
          noPointerEvents
          scrollable={false}
        >
          <VerticalSpacer height={0} flexGrow={1} noPointerEvents />
          <View style={styles.cta}>
            <TextStyleForwarder
              component={(styleVWC) => (
                <FilledInvertedButton
                  onPress={() => {
                    const cta = screen.parameters.cta;
                    if (cta === null) {
                      return;
                    }
                    configurableScreenOut(
                      workingVWC,
                      startPop,
                      transition,
                      cta.exit,
                      cta.trigger,
                      {
                        afterDone: () => {
                          trace({ type: 'cta' });
                        },
                      }
                    );
                  }}
                  setTextStyle={(s) => setVWC(styleVWC, s)}
                >
                  <RenderGuardedComponent
                    props={styleVWC}
                    component={(s) => (
                      <Text style={s}>{screen.parameters.cta?.text}</Text>
                    )}
                  />
                </FilledInvertedButton>
              )}
            />
          </View>
          <VerticalSpacer height={32} noPointerEvents />
        </GridContentContainer>
      ) : null}
    </GridFullscreenContainer>
  );
};

const compareJournalEntries = (
  a: JournalEntry | TooltipPlaceholder,
  b: JournalEntry | TooltipPlaceholder
): boolean => a.uid === b.uid;

const JournalEntryComponentWrapper = ({
  gotoJournalEntry: gotoJournalEntryOuter,
  editJournalEntry: editJournalEntryOuter,
  item: itemVWC,
  next,
  screen,
  ctx,
}: {
  gotoJournalEntry: (journalEntry: JournalEntry) => void;
  editJournalEntry: (journalEntry: JournalEntry) => void;
  item: ValueWithCallbacks<JournalEntry | TooltipPlaceholder>;
  screen: PeekedScreen<string, JournalEntriesListMappedParams>;
  next: ValueWithCallbacks<JournalEntry | TooltipPlaceholder | null>;
  ctx: ScreenContext;
}): ReactElement => {
  const isTooltipVWC = useMappedValueWithCallbacks(
    itemVWC,
    (item) => item.uid === 'tooltip'
  );
  const padBottomVWC = useMappedValueWithCallbacks(next, (v) =>
    v === null
      ? ctx.botBarHeight.get() + 10 + (screen.parameters.cta !== null ? 80 : 0)
      : 0
  );
  return (
    <>
      <RenderGuardedComponent
        props={isTooltipVWC}
        component={(isTooltip) =>
          isTooltip ? (
            <Tooltip ctx={ctx} screen={screen} />
          ) : (
            <JournalEntryComponent
              gotoJournalEntry={gotoJournalEntryOuter}
              editJournalEntry={editJournalEntryOuter}
              item={itemVWC as ValueWithCallbacks<JournalEntry>}
              ctx={ctx}
            />
          )
        }
      />
      <RenderGuardedComponent
        props={padBottomVWC}
        component={(h) => <VerticalSpacer height={h} />}
      />
    </>
  );
};

const Tooltip = ({
  ctx,
  screen,
}: {
  ctx: ScreenContext;
  screen: PeekedScreen<string, JournalEntriesListMappedParams>;
}): ReactElement => {
  const tooltipRefVWC = useWritableValueWithCallbacks<View | null>(() => null);
  const tooltipStyleVWC = useMappedValueWithCallbacks(
    ctx.contentWidth,
    (width) => ({
      ...styles.tooltip,
      width,
    })
  );
  useStyleVWC(tooltipRefVWC, tooltipStyleVWC);
  return (
    <View style={styles.tooltipContainer}>
      <View style={tooltipStyleVWC.get()} ref={(r) => setVWC(tooltipRefVWC, r)}>
        <Text style={styles.tooltipHeader}>
          {screen.parameters.tooltip?.header ?? 'Tooltip Header'}
        </Text>
        <VerticalSpacer height={8} />
        <Text style={styles.tooltipBody}>
          {screen.parameters.tooltip?.body ?? 'Tooltip Body'}
        </Text>
      </View>
    </View>
  );
};

const JournalEntryComponent = ({
  gotoJournalEntry: gotoJournalEntryOuter,
  editJournalEntry: editJournalEntryOuter,
  item: itemVWC,
  ctx,
}: {
  gotoJournalEntry: (journalEntry: JournalEntry) => void;
  editJournalEntry: (journalEntry: JournalEntry) => void;
  item: ValueWithCallbacks<JournalEntry>;
  ctx: ScreenContext;
}): ReactElement => {
  return (
    <JournalEntryCard
      onClick={useCallback(
        () => gotoJournalEntryOuter(itemVWC.get()),
        [itemVWC]
      )}
      onEditClick={useCallback(
        () => editJournalEntryOuter(itemVWC.get()),
        [itemVWC, editJournalEntryOuter]
      )}
      journalEntry={itemVWC}
      ctx={ctx}
    />
  );
};
