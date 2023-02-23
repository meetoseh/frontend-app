import { StatusBar } from 'expo-status-bar';
import { ReactElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, Share, StyleProp, Text, TextStyle, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CloseButton } from '../../shared/components/CloseButton';
import { OsehImageBackgroundFromState } from '../../shared/components/OsehImageBackgroundFromState';
import { SplashScreen } from '../../splash/SplashScreen';
import { JourneyScreenProps } from '../models/JourneyScreenProps';
import { styles as sharedStyles } from '../shared/styles';
import { styles } from './JourneyShareScreenStyles';
import SoundWave from '../../shared/icons/SoundWave';
import { FilledPrimaryButton } from '../../shared/components/FilledPrimaryButton';
import { OutlineWhiteButton } from '../../shared/components/OutlineWhiteButton';
import { NewUserDailyEventInvite } from '../../shared/models/NewUserDailyEventInvite';
import { LoginContext } from '../../shared/contexts/LoginContext';
import { getDailyEventInvite } from '../../shared/lib/getDailyEventInvite';
import { describeError } from '../../shared/lib/describeError';
import { HTTP_API_URL } from '../../shared/lib/apiFetch';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type ShareVideo = {
  localFileUri: string;
  contentFileUri: string;
};

type ContentFileWebExport = {
  url: string;
  format: 'mp4';
  bandwidth: number;
  codecs: Array<'aac'>;
  fileSize: number;
  qualityParameters: any;
};

export const JourneyShareScreen = ({
  journey,
  shared,
  error,
  setError,
  onJourneyFinished,
  isOnboarding,
}: JourneyScreenProps): ReactElement => {
  const loginContext = useContext(LoginContext);
  const previewSize = useMemo(
    () => ({
      width: styles.previewContainer.width,
      height: styles.previewContainer.height,
    }),
    []
  );
  const [invite, setInvite] = useState<NewUserDailyEventInvite | null>(null);
  const [shareVideo, setShareVideo] = useState<ShareVideo | null>(null);
  const [shareVideoText, setShareVideoText] = useState('Loading');
  const [shareVideoTextStyle, setShareVideoTextStyle] = useState<StyleProp<TextStyle>>({});
  const [shareVideoHeight, setShareVideoHeight] = useState(56);
  const [shareClassLinkTextStyle, setShareClassLinkTextStyle] = useState<StyleProp<TextStyle>>({});
  const [shareClassLinkHeight, setShareClassLinkHeight] = useState(56);

  useEffect(() => {
    if (invite !== null) {
      return;
    }
    let active = true;
    fetchInvite();
    return () => {
      active = false;
    };

    async function fetchInvite() {
      setError(null);
      try {
        const invite = await getDailyEventInvite({
          loginContext,
          journeyUid: isOnboarding ? null : journey.uid,
        });
        if (!active) {
          return;
        }
        setInvite(invite);
      } catch (e) {
        if (!active) {
          return;
        }
        const err = await describeError(e);
        if (!active) {
          return;
        }
        setError(err);
      }
    }
  }, [loginContext, invite, journey.uid, setError, isOnboarding]);

  useEffect(() => {
    const sample = journey.sample;
    if (sample === null) {
      setShareVideoText('Video Unavailable');
      return;
    }

    if (shareVideo !== null) {
      return;
    }

    let active = true;
    fetchShareVideoSafe();
    return () => {
      active = false;
    };

    async function fetchShareVideo() {
      if (journey.sample === null) {
        setShareVideoText('Video Unavailable');
        return;
      }

      const response = await fetch(
        `${HTTP_API_URL}/api/1/content_files/${journey.sample.uid}/web.json?presign=0`,
        {
          method: 'GET',
          headers: {
            Authorization: `bearer ${journey.sample.jwt}`,
          },
        }
      );
      if (!active) {
        return;
      }
      if (!response.ok) {
        throw response;
      }

      const data: {
        exports: {
          url: string;
          format: string;
          bandwidth: number;
          codecs: string[];
          file_size: number;
          quality_parameters: any;
        }[];
        duration_seconds: number;
      } = await response.json();
      if (!active) {
        return;
      }

      let bestExport: ContentFileWebExport | null = null;
      let bestBandwidth = 0;
      for (const exportData of data.exports) {
        if (exportData.format !== 'mp4') {
          continue;
        }
        if (exportData.bandwidth > bestBandwidth) {
          bestExport = {
            url: exportData.url,
            format: exportData.format,
            bandwidth: exportData.bandwidth,
            codecs: exportData.codecs as Array<'aac'>,
            fileSize: exportData.file_size,
            qualityParameters: exportData.quality_parameters,
          };
          bestBandwidth = exportData.bandwidth;
        }
      }

      if (bestExport === null) {
        throw new Error('No suitable export found');
      }

      downloadExport(bestExport);
    }

    async function downloadExport(exportData: ContentFileWebExport) {
      if (journey.sample === null) {
        setShareVideoText('Video Unavailable');
        return;
      }

      const targetFolder = FileSystem.cacheDirectory + 'shareables/';
      const dirInfo = await FileSystem.getInfoAsync(targetFolder);
      if (!active) {
        return;
      }
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(targetFolder, { intermediates: true });
        if (!active) {
          return;
        }
      }

      const targetFile = targetFolder + exportData.url.split('/').pop();
      const fileInfo = await FileSystem.getInfoAsync(targetFile);
      if (!active) {
        return;
      }
      if (!fileInfo.exists) {
        try {
          await FileSystem.downloadAsync(exportData.url, targetFile, {
            headers: { Authorization: `bearer ${journey.sample.jwt}` },
          });
        } catch (e) {
          console.error('Failed to download image', e);

          await FileSystem.deleteAsync(targetFile, { idempotent: true });
          return;
        }
      }

      if (!active) {
        return;
      }

      const contentUri = await FileSystem.getContentUriAsync(targetFile);
      if (!active) {
        return;
      }

      setShareVideo({
        localFileUri: targetFile,
        contentFileUri: contentUri,
      });
      setShareVideoText('Share Video');
    }

    async function fetchShareVideoSafe() {
      try {
        await fetchShareVideo();
      } catch (e) {
        if (!active) {
          return;
        }
        const err = await describeError(e);
        if (!active) {
          return;
        }
        setError(err);
        setShareVideoText('Video Unavailable');
        setShareVideo(null);
      }
    }
  }, [loginContext, journey.sample, shareVideo, setError]);

  const onShareVideo = useCallback(async () => {
    if (shareVideo === null) {
      return;
    }

    await Sharing.shareAsync(shareVideo.localFileUri, {
      UTI: 'public.mpeg-4',
      mimeType: 'video/mp4',
    });
  }, [shareVideo]);

  const onShareClassLink = useCallback(async () => {
    if (invite === null) {
      return;
    }

    const shareData = {
      url: invite.url,
      text: `Let's do a ${journey.category.externalName.toLowerCase()} class together on Oseh.`,
    };

    await Share.share(
      Platform.select({
        ios: {
          message: shareData.text,
          url: shareData.url,
        },
        default: {
          message: `${shareData.text} ${shareData.url}`,
        },
      })
    );
  }, [invite, journey.category.externalName]);

  const shareVideoContainerStyle = useMemo(() => {
    return Object.assign({}, styles.shareVideoContainer, {
      height: shareVideoHeight,
      maxHeight: shareVideoHeight,
    });
  }, [shareVideoHeight]);

  const shareClassLinkContainerStyle = useMemo(() => {
    return Object.assign({}, styles.shareClassLinkContainer, {
      height: shareClassLinkHeight,
      maxHeight: shareClassLinkHeight,
    });
  }, [shareClassLinkHeight]);

  if (
    shared.blurredImageLoading ||
    shared.blurredImage === null ||
    shared.imageLoading ||
    shared.image === null
  ) {
    return <SplashScreen />;
  }

  return (
    <View style={sharedStyles.container}>
      {error}

      <OsehImageBackgroundFromState state={shared.blurredImage} style={sharedStyles.background}>
        <CloseButton onPress={onJourneyFinished} />
        <View style={styles.content}>
          <OsehImageBackgroundFromState
            state={shared.image}
            style={styles.previewContainer}
            imageStyle={styles.previewImageStyle}>
            <Text style={styles.previewTitle}>{journey.title}</Text>
            <Text style={styles.previewInstructor}>with {journey.instructor.name}</Text>
            <View style={styles.lineContainer}>
              <Svg width={previewSize.width} height={1} viewBox={`0 0 ${previewSize.width} 1`}>
                <Path stroke="white" strokeWidth={1} d={`M19 0.5l${previewSize.width - 38} 0`} />
              </Svg>
            </View>
            <View style={styles.soundWaveContainer}>
              <SoundWave width={67} height={32} />
            </View>
            <Text style={styles.footer}>My daily #oseh</Text>
          </OsehImageBackgroundFromState>
          <View style={shareVideoContainerStyle}>
            <FilledPrimaryButton
              onPress={onShareVideo}
              setTextStyle={setShareVideoTextStyle}
              setHeight={setShareVideoHeight}
              disabled={shareVideo === null}>
              <Text style={shareVideoTextStyle}>{shareVideoText}</Text>
            </FilledPrimaryButton>
          </View>
          <View style={shareClassLinkContainerStyle}>
            <OutlineWhiteButton
              onPress={onShareClassLink}
              setTextStyle={setShareClassLinkTextStyle}
              setHeight={setShareClassLinkHeight}
              disabled={invite === null}>
              <Text style={shareClassLinkTextStyle}>
                {isOnboarding ? 'Share Oseh with Friends' : 'Share Class Link with Friends'}
              </Text>
            </OutlineWhiteButton>
          </View>
        </View>
      </OsehImageBackgroundFromState>
      <StatusBar style="auto" />
    </View>
  );
};
