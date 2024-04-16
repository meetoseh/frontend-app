import { useCallback, useContext } from 'react';
import {
  Callbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { Feature } from '../../models/Feature';
import { setVWC } from '../../../../shared/lib/setVWC';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { SeriesPreviewShow, SeriesPreviewState } from './SeriesPreviewState';
import { SeriesPreviewResources } from './SeriesPreviewResources';
import {
  ExternalCoursePreviewable,
  externalCourseKeyMap,
  getPreviewableCourse,
} from '../../../series/lib/ExternalCourse';
import {
  defaultEqualityFn,
  useMappedValueWithCallbacks,
} from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import { SeriesPreview } from './SeriesPreview';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import { useOsehImageStateRequestHandler } from '../../../../shared/images/useOsehImageStateRequestHandler';
import { useRefreshedExternalCourse } from '../../../series/hooks/useRefreshedExternalCourse';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { convertUsingMapper } from '../../../../shared/lib/CrudFetcher';

export const SeriesPreviewFeature: Feature<
  SeriesPreviewState,
  SeriesPreviewResources
> = {
  identifier: 'seriesPreview',
  useWorldState() {
    const loginContextRaw = useContext(LoginContext);
    const tryingSeriesSlugVWC = useWritableValueWithCallbacks(
      (): string | null => null
    );
    const showVWC = useWritableValueWithCallbacks<
      SeriesPreviewShow | null | undefined
    >(() => (tryingSeriesSlugVWC.get() === null ? null : undefined));

    const setShow = useCallback(
      (show: SeriesPreviewShow | null, updateWindowHistory: boolean) => {
        if (defaultEqualityFn(show, showVWC.get())) {
          return;
        }

        if (showVWC.get() === undefined) {
          throw new Error('Cannot set show when loading');
        }

        setVWC(showVWC, show);
      },
      [showVWC]
    );

    useRefreshedExternalCourse(
      useMappedValueWithCallbacks(showVWC, (s) => s?.course ?? null),
      useCallback(
        (newItm) => {
          const previewable = getPreviewableCourse(newItm);
          if (previewable === null) {
            setShow(null, false);
            return;
          }
          setShow(
            { enter: showVWC.get()?.enter ?? 'fade', course: previewable },
            false
          );
        },
        [setShow]
      ),
      'list'
    );

    useValuesWithCallbacksEffect(
      [tryingSeriesSlugVWC, loginContextRaw.value],
      () => {
        const slugRaw = tryingSeriesSlugVWC.get();
        if (slugRaw === null) {
          if (showVWC.get() === undefined) {
            setVWC(showVWC, null);
          }
          return;
        }
        const slug = slugRaw;

        const loginContextUnch = loginContextRaw.value.get();
        if (loginContextUnch.state === 'loading') {
          return;
        } else if (loginContextUnch.state !== 'logged-in') {
          if (showVWC.get() === undefined) {
            setVWC(showVWC, null);
          }
          return;
        }
        const loginContext = loginContextUnch;

        let active = true;
        const cancelers = new Callbacks<undefined>();
        fetchSeriesBySlug();
        return () => {
          active = false;
          cancelers.call(undefined);
        };

        async function fetchSeriesBySlugInner(signal: AbortSignal | undefined) {
          const response = await apiFetch(
            '/api/1/courses/search_public?category=list',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json; charset=utf-8' },
              body: JSON.stringify({
                filters: {
                  slug: {
                    operator: 'eq',
                    value: slug,
                  },
                },
                limit: 1,
              }),
              signal,
            },
            loginContext
          );
          if (!active) {
            return;
          }
          if (!response.ok) {
            throw response;
          }

          const raw: { items: any[] } = await response.json();
          if (!active) {
            return;
          }
          if (raw.items.length === 0) {
            setVWC(showVWC, null);
            return;
          }

          const course = convertUsingMapper(raw.items[0], externalCourseKeyMap);
          const coursePreviewable = getPreviewableCourse(course);
          if (coursePreviewable === null) {
            setVWC(showVWC, null);
            return;
          }

          setVWC(showVWC, {
            enter: 'fade',
            course: coursePreviewable,
          } as const);
        }

        async function fetchSeriesBySlug() {
          const controller = new AbortController();
          const signal = controller.signal;
          const doAbort = () => controller.abort();
          cancelers.add(doAbort);
          if (!active) {
            cancelers.remove(doAbort);
            return;
          }

          try {
            await fetchSeriesBySlugInner(signal);
          } catch (e) {
            if (active) {
              console.log(e);
              setVWC(showVWC, null);
              setVWC(tryingSeriesSlugVWC, null);
            }
          } finally {
            cancelers.remove(doAbort);
          }
        }
      }
    );

    return useMappedValuesWithCallbacks(
      [showVWC],
      useCallback(
        () => ({
          show: showVWC.get(),
          setShow,
        }),
        [showVWC, setShow]
      )
    );
  },
  isRequired(state) {
    if (state.show === undefined) {
      return undefined;
    }
    return state.show !== null;
  },
  useResources(state, required, allStates) {
    const imageHandler = useOsehImageStateRequestHandler({});

    return useWritableValueWithCallbacks(() => ({
      loading: false,
      imageHandler,
      goBack() {
        allStates.get().seriesList.setForced({ enter: 'fade' }, true);
        state.get().setShow(null, false);
      },
      gotoDetails(series) {
        allStates.get().seriesDetails.setShow(series, true);
        state.get().setShow(null, false);
      },
    }));
  },
  component: (state, resources) => (
    <SeriesPreview state={state} resources={resources} />
  ),
};
