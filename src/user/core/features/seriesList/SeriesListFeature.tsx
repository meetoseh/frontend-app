import { useCallback } from 'react';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { Feature } from '../../models/Feature';
import { SeriesListResources } from './SeriesListResources';
import { SeriesListState } from './SeriesListState';
import { setVWC } from '../../../../shared/lib/setVWC';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { SeriesList } from './SeriesList';
import { useOsehImageStateRequestHandler } from '../../../../shared/images/useOsehImageStateRequestHandler';

export const SeriesListFeature: Feature<SeriesListState, SeriesListResources> =
  {
    identifier: 'seriesList',
    useWorldState() {
      const showVWC = useWritableValueWithCallbacks(() => false);

      const setShow = useCallback(
        (wantsSeries: boolean, updateWindowHistory: boolean) => {
          setVWC(showVWC, wantsSeries);
        },
        [showVWC]
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
      return state.show;
    },
    useResources(state, required, allStates) {
      const imageHandler = useOsehImageStateRequestHandler({});

      return useWritableValueWithCallbacks(() => ({
        loading: false,
        imageHandler,
        gotoSettings: () => {
          allStates.get().settings.setShow(true, true);
          state.get().setShow(false, false);
        },
        gotoCoursePreview: (course) => {
          // allStates.get().seriesPreview.setShow(course, true);
          state.get().setShow(false, false);
        },
      }));
    },
    component: (state, resources) => (
      <SeriesList state={state} resources={resources} />
    ),
  };
