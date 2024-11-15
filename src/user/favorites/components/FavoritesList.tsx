import { ReactElement, useCallback, useContext, useMemo, useRef } from 'react';
import { JourneyRef, journeyRefKeyMap } from '../../journey/models/JourneyRef';
import { LoginContext } from '../../../shared/contexts/LoginContext';
import { OsehImageStateRequestHandler } from '../../../shared/images/useOsehImageStateRequestHandler';
import {
  InfiniteListing,
  NetworkedInfiniteListing,
} from '../../../shared/lib/InfiniteListing';
import { MinimalJourney, minimalJourneyKeyMap } from '../lib/MinimalJourney';
import { HistoryItem } from './HistoryItem';
import { styles } from './FavoritesSharedStyles';
import { InfiniteList } from '../../../shared/components/InfiniteList';
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../shared/lib/Callbacks';
import { RenderGuardedComponent } from '../../../shared/components/RenderGuardedComponent';
import { apiFetch } from '../../../shared/lib/apiFetch';
import { useWindowSize } from '../../../shared/hooks/useWindowSize';
import { convertUsingKeymap } from '../../../shared/lib/CrudFetcher';
import { View, Text } from 'react-native';

export type FavoritesListProps = {
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
 * Displays an infinite list of the given height, where the contents are favorited
 * journeys.
 */
export const FavoritesList = ({
  showJourney,
  listHeight,
  imageHandler,
}: FavoritesListProps): ReactElement => {
  const loginContextRaw = useContext(LoginContext);
  const windowSize = useWindowSize();

  const infiniteListing = useMemo<InfiniteListing<MinimalJourney>>(() => {
    const numVisible = Math.ceil(listHeight.get() / 85) * 25;
    const result = new NetworkedInfiniteListing<MinimalJourney>(
      '/api/1/users/me/search_history',
      Math.min(numVisible * 2 + 10, 150),
      numVisible,
      10,
      {
        liked_at: {
          operator: 'neq',
          value: null,
        },
      },
      [
        {
          key: 'liked_at',
          dir: 'desc',
          before: null,
          after: null,
        },
        {
          key: 'uid',
          dir: 'asc',
          before: null,
          after: null,
        },
      ],
      (item, dir) => {
        return [
          {
            key: 'liked_at',
            dir: dir === 'before' ? 'asc' : 'desc',
            before: null,
            after: item.likedAt === null ? null : item.likedAt.getTime() / 1000,
          },
          {
            key: 'uid',
            dir: dir === 'before' ? 'desc' : 'asc',
            before: null,
            after: item.uid,
          },
        ];
      },
      minimalJourneyKeyMap,
      loginContextRaw
    );
    result.reset();
    return result;
  }, [listHeight, loginContextRaw]);

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
      setItem: (newItem: MinimalJourney) => void
    ) => ReactElement
  >(() => {
    const MyBoundComponent = (
      item: ValueWithCallbacks<MinimalJourney>,
      setItem: (newItem: MinimalJourney) => void
    ) => (
      <HistoryItemComponent
        gotoJourneyByUid={gotoJourneyByUID}
        item={item}
        setItem={setItem}
        instructorImages={imageHandler}
        width={windowSize.width - 64}
      />
    );
    return MyBoundComponent;
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
            <View
              style={{ ...styles.emptyContainer, width: windowSize.width - 64 }}
            >
              <Text style={styles.emptyText}>
                You don&rsquo;t have any favorite classes yet
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
  instructorImages,
  width,
}: {
  gotoJourneyByUid: (uid: string) => void;
  item: ValueWithCallbacks<MinimalJourney>;
  setItem: (item: MinimalJourney) => void;
  instructorImages: OsehImageStateRequestHandler;
  width: number;
}): ReactElement => {
  const gotoJourney = useCallback(() => {
    gotoJourneyByUid(item.get().uid);
  }, [gotoJourneyByUid, item]);
  const separator = useWritableValueWithCallbacks(() => false);

  return (
    <HistoryItem
      item={item}
      setItem={setItem}
      separator={separator}
      onClick={gotoJourney}
      instructorImages={instructorImages}
      width={{ value: width }}
    />
  );
};
