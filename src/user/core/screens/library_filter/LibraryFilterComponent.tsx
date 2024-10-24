import { ReactElement, useMemo } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { styles } from './LibraryFilterComponentStyles';
import {
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';
import {
  Callbacks,
  useWritableValueWithCallbacks,
  WritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { configurableScreenOut } from '../../lib/configurableScreenOut';
import { LibraryFilterResources } from './LibraryFilterResources';
import { LibraryFilterMappedParams } from './LibraryFilterParams';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { ScreenHeader } from '../../../../shared/components/ScreenHeader';
import {
  SurveyCheckboxGroup,
  SurveyCheckboxGroupProps,
} from '../../../../shared/components/SurveyCheckboxGroup';
import {
  convertLibraryFilterToAPI,
  LibraryFilter,
  LibraryFilterAPI,
} from '../library/lib/LibraryFilter';
import { ContentContainer } from '../../../../shared/components/ContentContainer';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { InlineOsehSpinner } from '../../../../shared/components/InlineOsehSpinner';
import { SearchPublicInstructor } from '../library/lib/SearchPublicInstructor';
import { setVWC } from '../../../../shared/lib/setVWC';
import { View, Text } from 'react-native';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';

type TakenRadioValue = 'taken' | 'not-taken';

/**
 * Allows the user to edit library filters and then, typically, return to the library
 * screen.
 */
export const LibraryFilterComponent = ({
  ctx,
  screen,
  resources,
  startPop,
  trace,
}: ScreenComponentProps<
  'library_filter',
  LibraryFilterResources,
  LibraryFilterMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);
  const windowWidthVWC = useMappedValueWithCallbacks(
    ctx.windowSizeImmediate,
    (w) => w.width
  );

  const favoritesVWC = useWritableValueWithCallbacks<'favorites'[]>(() =>
    screen.parameters.filter.favorites === 'only' ? ['favorites'] : []
  ) as SurveyCheckboxGroupProps<'favorites'>['checked'];

  const takenVWC = useWritableValueWithCallbacks<TakenRadioValue[]>(() =>
    screen.parameters.filter.taken === 'only'
      ? ['taken']
      : screen.parameters.filter.taken === 'exclude'
      ? ['not-taken']
      : []
  ) as SurveyCheckboxGroupProps<TakenRadioValue>['checked'];

  const instructorUIDSVWC = useWritableValueWithCallbacks<Set<string>>(
    () => new Set(screen.parameters.filter.instructors)
  );

  const getCurrentFilter = () => {
    const result: LibraryFilter = {
      ...screen.parameters.filter,
      favorites: favoritesVWC.get().length > 0 ? 'only' : 'ignore',
      taken:
        takenVWC.get().length === 1
          ? takenVWC.get()[0] === 'taken'
            ? 'only'
            : 'exclude'
          : 'ignore',
      instructors: Array.from(instructorUIDSVWC.get()),
    };
    return result;
  };

  const getCurrentFilterAPI = (): LibraryFilterAPI =>
    convertLibraryFilterToAPI(getCurrentFilter());

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={false}
      statusBar="light"
    >
      <GridDarkGrayBackground />
      <GridContentContainer
        contentWidthVWC={windowWidthVWC}
        left={transitionState.left}
        opacity={transitionState.opacity}
        gridSizeVWC={ctx.windowSizeImmediate}
        justifyContent="flex-start"
        scrollable
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
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
                  parameters: {
                    filter: getCurrentFilterAPI(),
                  },
                  afterDone: () => {
                    trace({ type: 'close', filter: getCurrentFilterAPI() });
                  },
                }
              );
            },
          }}
          text={screen.parameters.header}
          windowWidth={windowWidthVWC}
          contentWidth={ctx.contentWidth}
        />
        <VerticalSpacer height={20} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <Text style={styles.label}>Favorites</Text>
          <VerticalSpacer height={8} />
          <SurveyCheckboxGroup
            choices={
              [{ slug: 'favorites', element: <Text>Favorites</Text> }] as const
            }
            checked={favoritesVWC}
            variant="square"
            uncheck
          />
        </ContentContainer>
        <VerticalSpacer height={24} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <Text style={styles.label}>Taken</Text>
          <VerticalSpacer height={8} />
          <SurveyCheckboxGroup
            choices={
              [
                { slug: 'taken', element: <Text>Taken</Text> },
                { slug: 'not-taken', element: <Text>Not Taken</Text> },
              ] as const
            }
            checked={takenVWC}
            variant="round"
            uncheck
          />
        </ContentContainer>
        <VerticalSpacer height={24} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <Text style={styles.label}>Instructors</Text>
          <VerticalSpacer height={8} />
          <RenderGuardedComponent
            props={resources.instructors}
            component={(c) => {
              if (c === null) {
                return (
                  <InlineOsehSpinner
                    size={{
                      type: 'react-rerender',
                      props: {
                        width: 24,
                      },
                    }}
                  />
                );
              }

              if (c === undefined) {
                return (
                  <View style={styles.error}>
                    <Text style={styles.errorText}>
                      Cannot load the instructor list. Try again or contact
                      support by emailing hi@oseh.com
                    </Text>
                  </View>
                );
              }

              return (
                <InstructorCheckboxGroup
                  instructors={c}
                  instructorUIDSVWC={instructorUIDSVWC}
                />
              );
            }}
          />
        </ContentContainer>
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
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
                        parameters: {
                          filter: getCurrentFilterAPI(),
                        },
                        afterDone: () => {
                          trace({ type: 'cta', filter: getCurrentFilterAPI() });
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
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};

const InstructorCheckboxGroup = ({
  instructors,
  instructorUIDSVWC,
}: {
  instructors: SearchPublicInstructor[];
  instructorUIDSVWC: WritableValueWithCallbacks<Set<string>>;
}): ReactElement => {
  const choices = useMemo(() => {
    return instructors.map((i) => ({
      slug: i.uid,
      element: <>{i.name}</>,
    }));
  }, [instructors]);

  const checkedWVWC = useMemo(
    (): SurveyCheckboxGroupProps<string>['checked'] => ({
      get: () => {
        const set = instructorUIDSVWC.get();
        if (set.size === 0) {
          return instructors.map((i) => i.uid);
        }
        return Array.from(set);
      },
      set: (v) => {
        if (v.length === instructors.length) {
          setVWC(instructorUIDSVWC, new Set(), () => false);
          return;
        }

        setVWC(instructorUIDSVWC, new Set(v), () => false);
      },
      callbacks: new Callbacks(),
    }),
    [instructorUIDSVWC, instructors]
  );

  return (
    <SurveyCheckboxGroup
      choices={choices}
      checked={checkedWVWC}
      variant="square"
      uncheck
      multiple
    />
  );
};
