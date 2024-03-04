import { ReactElement, useContext } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';
import { View } from 'react-native';
import { styles } from './VideoTestStyles';
import { AVPlaybackSource, ResizeMode, Video } from 'expo-av';
import { HTTP_API_URL, apiFetch } from '../lib/apiFetch';
import { LoginContext } from '../contexts/LoginContext';
import { RenderGuardedComponent } from './RenderGuardedComponent';
import { Callbacks, useWritableValueWithCallbacks } from '../lib/Callbacks';
import { useValueWithCallbacksEffect } from '../hooks/useValueWithCallbacksEffect';
import { setVWC } from '../lib/setVWC';

const contentFileUid = 'oseh_cf_zWX1Mm7cMzEkW5OUfi2bDA';

export const VideoTest = (): ReactElement => {
  const windowSize = useWindowSize();
  const loginContext = useContext(LoginContext);

  const playbackSourceVWC =
    useWritableValueWithCallbacks<AVPlaybackSource | null>(() => null);

  useValueWithCallbacksEffect(loginContext.value, (loginRaw) => {
    if (loginRaw.state !== 'logged-in') {
      return undefined;
    }

    const login = loginRaw;
    const cancelers = new Callbacks<undefined>();
    const controller = new AbortController();
    cancelers.add(() => controller.abort());
    let running = true;
    fetchPlaybackSource();
    return () => {
      running = false;
      cancelers.call(undefined);
    };

    async function fetchPlaybackSource() {
      const response = await apiFetch(
        '/api/1/content_files/dev_show/' + contentFileUid,
        {
          method: 'GET',
        },
        login
      );

      if (!response.ok) {
        throw response;
      }

      const contentFileRef: { uid: string; jwt: string } =
        await response.json();
      setVWC(playbackSourceVWC, {
        uri:
          HTTP_API_URL +
          '/api/1/content_files/' +
          contentFileRef.uid +
          '/ios.m3u8',
        headers: {
          Authorization: 'bearer ' + contentFileRef.jwt,
        },
      });
    }
  });

  return (
    <View style={styles.container}>
      <RenderGuardedComponent
        props={playbackSourceVWC}
        component={(source) => {
          console.log('source:', source);
          return (
            <Video
              source={source ?? undefined}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              isLooping={false}
              style={{ width: windowSize.width, height: windowSize.height }}
            />
          );
        }}
      />
    </View>
  );
};
