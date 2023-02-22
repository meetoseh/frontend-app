import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOsehContentState } from '../../shared/hooks/useOsehContent';
import { useOsehImageState } from '../../shared/hooks/useOsehImage';
import { useScreenSize } from '../../shared/hooks/useScreenSize';
import { JourneyRef } from '../models/JourneyRef';
import { JourneyShared } from '../models/JourneyShared';

/**
 * Creates the initial journey & journey start shared state
 */
export const useJourneyShared = (journey: JourneyRef | null): JourneyShared => {
  const screenSize = useScreenSize();
  const [shared, setShared] = useState<JourneyShared>({
    image: null,
    imageLoading: true,
    screenSize,
    blurredImage: null,
    blurredImageLoading: true,
    audio: null,
    audioLoading: true,
  });
  const imageProps = useMemo(
    () => ({
      uid: journey?.darkenedBackgroundImage?.uid ?? null,
      jwt: journey?.darkenedBackgroundImage?.jwt ?? null,
      displayWidth: screenSize.width,
      displayHeight: screenSize.height,
      alt: '',
    }),
    [
      journey?.darkenedBackgroundImage?.uid,
      journey?.darkenedBackgroundImage?.jwt,
      screenSize.width,
      screenSize.height,
    ]
  );
  const image = useOsehImageState(imageProps);
  const blurredImageProps = useMemo(
    () => ({
      uid: journey?.blurredBackgroundImage?.uid ?? null,
      jwt: journey?.blurredBackgroundImage?.jwt ?? null,
      displayWidth: screenSize.width,
      displayHeight: screenSize.height,
      alt: '',
    }),
    [
      journey?.blurredBackgroundImage?.uid,
      journey?.blurredBackgroundImage?.jwt,
      screenSize.width,
      screenSize.height,
    ]
  );
  const blurredImage = useOsehImageState(blurredImageProps);
  const [audioLoading, setAudioLoading] = useState(true);
  const forceReloadRef = useRef<(() => void) | null>(null);
  const setForceReloadCurrent = useCallback((val: (() => void) | null) => {
    forceReloadRef.current = val;
  }, []);
  const audio = useOsehContentState({
    type: 'audio',
    uid: journey?.audioContent?.uid ?? null,
    jwt: journey?.audioContent?.jwt ?? null,
    setLoading: setAudioLoading,
    doForceReload: setForceReloadCurrent,
  });

  const audioRef = useRef(audio);
  audioRef.current = audio;
  useEffect(() => {
    return () => {
      const val = audioRef.current;
      if (val !== null && val.sound !== null) {
        // we're probably being unmounted, so unload the audio
        val.sound.unloadAsync();
        if (forceReloadRef.current !== null) {
          // but in case we aren't being unmounted, reload the audio if
          // we're still mounted
          forceReloadRef.current();
        }
      }
    };
  }, []);

  useEffect(() => {
    setShared({
      image,
      imageLoading: image.loading,
      blurredImage,
      blurredImageLoading: blurredImage.loading,
      screenSize,
      audio,
      audioLoading,
    });
  }, [image, blurredImage, screenSize, audio, audioLoading]);

  return shared;
};
