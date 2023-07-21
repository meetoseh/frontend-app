import { ReactElement, useCallback, useContext } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { FeatureComponentProps } from "../../models/Feature";
import { FavoritesResources } from "./FavoritesResources";
import { FavoritesState } from "./FavoritesState";
import { useOsehImageStateRequestHandler } from "../../../../shared/images/useOsehImageStateRequestHandler";
import {
  useWindowSize,
  useWindowSizeValueWithCallbacks,
} from "../../../../shared/hooks/useWindowSize";
import { useMappedValueWithCallbacks } from "../../../../shared/hooks/useMappedValueWithCallbacks";
import { useWritableValueWithCallbacks } from "../../../../shared/lib/Callbacks";
import { JourneyRef } from "../../../journey/models/JourneyRef";
import { LoginContext } from "../../../../shared/contexts/LoginContext";
import { setVWC } from "../../../../shared/lib/setVWC";
import { styles } from "./FavoritesStyles";
import { OsehImageBackgroundFromStateValueWithCallbacks } from "../../../../shared/images/OsehImageBackgroundFromStateValueWithCallbacks";
import { CloseButton } from "../../../../shared/components/CloseButton";
import { useTopBarHeight } from "../../../../shared/hooks/useTopBarHeight";
import { MyProfilePicture } from "../../../../shared/components/MyProfilePicture";
import { RenderGuardedComponent } from "../../../../shared/components/RenderGuardedComponent";
import { HistoryList } from "../../../favorites/components/HistoryList";
import { useUnwrappedValueWithCallbacks } from "../../../../shared/hooks/useUnwrappedValueWithCallbacks";
import { useMappedValuesWithCallbacks } from "../../../../shared/hooks/useMappedValuesWithCallbacks";
import { StatusBar } from "expo-status-bar";
import {
  ModalProvider,
  Modals,
} from "../../../../shared/contexts/ModalContext";

/**
 * The top-level component which shows the favorites/history/courses tabbed pane.
 *
 * @returns
 */
export const Favorites = ({
  state: stateVWC,
  resources: resourcesVWC,
}: FeatureComponentProps<FavoritesState, FavoritesResources>): ReactElement => {
  const loginContext = useContext(LoginContext);
  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const screenSize = useUnwrappedValueWithCallbacks(windowSizeVWC);
  const topBarHeight = useTopBarHeight();
  const imageHandler = useOsehImageStateRequestHandler({});
  const journeyVWC = useWritableValueWithCallbacks<JourneyRef | null>(
    () => null
  );

  const listTop = useWritableValueWithCallbacks(() => 204 + topBarHeight);

  const listHeight = useMappedValuesWithCallbacks(
    [windowSizeVWC, listTop],
    () => windowSizeVWC.get().height - listTop.get() - 32
  );

  const gotoFavorites = useCallback(() => {
    stateVWC.get().setTab("favorites", true);
  }, [stateVWC]);

  const gotoHistory = useCallback(() => {
    stateVWC.get().setTab("history", true);
  }, [stateVWC]);

  const gotoCourses = useCallback(() => {
    stateVWC.get().setTab("courses", true);
  }, [stateVWC]);

  const onJourneyFinished = useCallback(() => {
    setVWC(journeyVWC, null);
  }, [journeyVWC]);

  const setJourney = useCallback(
    (journey: JourneyRef) => {
      setVWC(journeyVWC, journey);
    },
    [journeyVWC]
  );
  const tabVWC = useMappedValueWithCallbacks(stateVWC, (s) => s.tab);
  const background = useMappedValueWithCallbacks(
    resourcesVWC,
    (r) => r.background
  );

  const onCloseClick = useCallback(() => {
    stateVWC.get().setShow(false, true);
  }, [stateVWC]);
  const innerWidth = Math.min(screenSize.width, styles.content.maxWidth) - 64;

  return (
    <View style={styles.container}>
      <OsehImageBackgroundFromStateValueWithCallbacks
        state={background}
        style={{ ...styles.innerContainer, height: screenSize.height }}
      >
        <ModalProvider>
          <CloseButton onPress={onCloseClick} />
          <View
            style={{
              ...styles.content,
              paddingTop: styles.content.paddingTop + topBarHeight,
              width: screenSize.width,
            }}
          >
            <View style={{ ...styles.profile, width: innerWidth }}>
              <MyProfilePicture
                imageHandler={imageHandler}
                style={styles.profilePicture}
              />
              <Text style={styles.profileName}>
                {loginContext.userAttributes?.name}
              </Text>
            </View>
            <RenderGuardedComponent
              props={tabVWC}
              component={(tab) => (
                <>
                  <ScrollView
                    style={{
                      width: innerWidth,
                      flexGrow: 0,
                    }}
                    contentContainerStyle={styles.tabs}
                    fadingEdgeLength={20}
                    horizontal
                  >
                    <Pressable
                      onPress={gotoFavorites}
                      style={Object.assign(
                        {},
                        styles.tab,
                        tab === "favorites" ? styles.activeTab : undefined
                      )}
                    >
                      <Text
                        style={Object.assign(
                          {},
                          styles.tabText,
                          tab === "favorites" ? styles.activeTabText : undefined
                        )}
                      >
                        Favorites
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={gotoHistory}
                      style={Object.assign(
                        {},
                        styles.tab,
                        styles.tabNotFirstChild,
                        tab === "history" ? styles.activeTab : undefined
                      )}
                    >
                      <Text
                        style={Object.assign(
                          {},
                          styles.tabText,
                          tab === "history" ? styles.activeTabText : undefined
                        )}
                      >
                        History
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={gotoCourses}
                      style={Object.assign(
                        {},
                        styles.tab,
                        styles.tabNotFirstChild,
                        tab === "courses" ? styles.activeTab : undefined
                      )}
                    >
                      <Text
                        style={Object.assign(
                          {},
                          styles.tabText,
                          tab === "courses" ? styles.activeTabText : undefined
                        )}
                      >
                        Owned
                      </Text>
                    </Pressable>
                  </ScrollView>
                  <View
                    style={Object.assign(
                      {},
                      styles.tabContent,
                      tab === "courses" ? styles.tabContentCourses : undefined
                    )}
                    onLayout={(e) => {
                      const top = e.nativeEvent?.layout?.y;
                      if (top !== undefined) {
                        setVWC(listTop, top);
                      }
                    }}
                  >
                    {tab === "history" && (
                      <HistoryList
                        showJourney={setJourney}
                        listHeight={listHeight}
                        imageHandler={imageHandler}
                      />
                    )}
                  </View>
                </>
              )}
            />
          </View>
        </ModalProvider>
      </OsehImageBackgroundFromStateValueWithCallbacks>
      <StatusBar style="light" />
    </View>
  );
};
