import { ReactElement, useCallback, useContext, useMemo, useRef } from 'react';
import { JourneyRef, journeyRefKeyMap } from '../../journey/models/JourneyRef';
import { useWindowSize } from '../../../shared/hooks/useWindowSize';
import { LoginContext } from '../../../shared/contexts/LoginContext';
import { OsehImageStateRequestHandler } from '../../../shared/images/useOsehImageStateRequestHandler';
import { MinimalJourney } from '../lib/MinimalJourney';
import { HistoryItem } from './HistoryItem';
import { styles } from './FavoritesSharedStyles';
import { InfiniteList } from '../../../shared/components/InfiniteList';
import { RenderGuardedComponent } from '../../../shared/components/RenderGuardedComponent';
import { ValueWithCallbacks } from '../../../shared/lib/Callbacks';
import { apiFetch } from '../../../shared/lib/apiFetch';
import { convertUsingKeymap } from '../../../shared/lib/CrudFetcher';
import { View, Text } from 'react-native';
import { adaptValueWithCallbacksAsVariableStrategyProps } from '../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps';
import { useMappedValuesWithCallbacks } from '../../../shared/hooks/useMappedValuesWithCallbacks';
import { useHistoryList } from '../hooks/useHistoryList';
import { ValueWithCallbacksLike } from '../../../shared/ValueWithCallbacksLike';

export type HistoryListProps = {
  /**
   * A function which can be called to take the user to the given journey
   * then return when they are done.
   *
   * @param journey The journey to show.
   */
  showJourney: (journey: JourneyRef) => void;

  /**
   * The height of the list in logical pixels
   */
  listHeight: ValueWithCallbacks<number>;

  /**
   * The handler to use to fetch images.
   */
  imageHandler: OsehImageStateRequestHandler;
};

/**
 * Displays an infinite list of the given height, where the contents are journeys
 * the user has taken previously.
 */
export const HistoryList = ({
  showJourney,
  listHeight,
  imageHandler,
}: HistoryListProps): ReactElement => {
  const loginContextRaw = useContext(LoginContext);
  const windowSize = useWindowSize();

  const infiniteListing = useHistoryList(
    loginContextRaw,
    adaptValueWithCallbacksAsVariableStrategyProps(listHeight)
  );

  const loading = useRef<boolean>(false);
  const gotoJourneyByUID = useCallback(
    async (uid: string) => {
      if (loading.current) {
        return;
      }
      const loginContextUnch = loginContextRaw.value.get();
      if (loginContextUnch.state !== 'logged-in') {
        return;
      }
      const loginContext = loginContextUnch;

      loading.current = true;
      try {
        const response = await apiFetch(
          '/api/1/users/me/start_journey_from_history',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
              journey_uid: uid,
            }),
          },
          loginContext
        );
        if (!response.ok) {
          console.log(
            'failed to start journey from history:',
            response.status,
            await response.text()
          );
          return;
        }
        const raw = await response.json();
        const journey = convertUsingKeymap(raw, journeyRefKeyMap);
        showJourney(journey);
      } finally {
        loading.current = false;
      }
    },
    [loginContextRaw, showJourney]
  );

  const boundComponent = useMemo<
    (
      item: ValueWithCallbacks<MinimalJourney>,
      setItem: (newItem: MinimalJourney) => void,
      previous: ValueWithCallbacks<MinimalJourney | null>
    ) => ReactElement
  >(() => {
    return (item, setItem, previous) => (
      <HistoryItemComponent
        gotoJourneyByUid={gotoJourneyByUID}
        item={item}
        setItem={setItem}
        previous={previous}
        instructorImages={imageHandler}
        width={{ value: windowSize.width - 64 }}
      />
    );
  }, [gotoJourneyByUID, imageHandler, windowSize.width]);

  return (
    <RenderGuardedComponent
      props={listHeight}
      component={(listHeight) => (
        <InfiniteList
          listing={infiniteListing}
          component={boundComponent}
          itemComparer={compareHistoryItems}
          height={listHeight}
          width={windowSize.width - 64}
          gap={10}
          initialComponentHeight={75}
          emptyElement={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                You haven&rsquo;t taken any classes yet
              </Text>
            </View>
          }
        />
      )}
    />
  );
};

const compareHistoryItems = (a: MinimalJourney, b: MinimalJourney): boolean =>
  a.uid === b.uid;

const HistoryItemComponent = ({
  gotoJourneyByUid,
  item,
  setItem,
  previous,
  instructorImages,
  width,
}: {
  gotoJourneyByUid: (uid: string) => void;
  item: ValueWithCallbacks<MinimalJourney>;
  setItem: (item: MinimalJourney) => void;
  previous: ValueWithCallbacks<MinimalJourney | null>;
  instructorImages: OsehImageStateRequestHandler;
  width: ValueWithCallbacksLike<number>;
}): ReactElement => {
  const gotoJourney = useCallback(() => {
    gotoJourneyByUid(item.get().uid);
  }, [gotoJourneyByUid, item]);

  const separator = useMappedValuesWithCallbacks([item, previous], () => {
    const prev = previous.get();
    const itm = item.get();

    return (
      prev === null ||
      prev.lastTakenAt?.toLocaleDateString() !==
        itm.lastTakenAt?.toLocaleDateString()
    );
  });

  return (
    <HistoryItem
      item={item}
      setItem={setItem}
      separator={separator}
      onClick={gotoJourney}
      instructorImages={instructorImages}
      width={width}
    />
  );
};
