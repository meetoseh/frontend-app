import { useMemo } from 'react';
import { OsehContentProps } from './OsehContentProps';
import {
  ContentFileNativeExport,
  OsehContentTarget,
} from './OsehContentTarget';
import { HTTP_API_URL } from '../lib/apiFetch';
import { Platform } from 'react-native';
import { largestPhysicalPerLogical } from '../images/DisplayRatioHelper';

type OsehContentTargetPropsAudio = {
  uid: string;
  jwt: string | null;
  showAs: 'audio';
  presign: boolean;
  displayWidth?: undefined;
  displayHeight?: undefined;
};

type OsehContentTargetPropsVideo = {
  uid: string;
  jwt: string | null;
  showAs: 'video';
  presign: boolean;
  displayWidth: number;
  displayHeight: number;
};

type OsehContentTargetProps =
  | OsehContentTargetPropsAudio
  | OsehContentTargetPropsVideo;

/**
 * A hook for getting the target to download for an Oseh content file. On the
 * web simple mp4s are used and hence this downloads a json file in a custom
 * format which lists all the available targets, then selects one. On native
 * apps the m3u8 format is used which comes with bandwidth selection and hence
 * this is essentially a no-op.
 */
export const useOsehContentTarget = ({
  uid,
  jwt,
  showAs,
  presign,
  displayWidth,
  displayHeight,
}: OsehContentTargetProps): OsehContentTarget => {
  return useMemo<OsehContentTarget>(() => {
    if (uid === null || jwt === null) {
      return {
        state: 'loading',
        error: null,
        nativeExport: null,
        presigned: null,
        jwt: null,
      };
    }

    return {
      state: 'loaded',
      error: null,
      nativeExport: getNativeExport(
        uid,
        jwt,
        presign,
        showAs === 'audio'
          ? undefined
          : { width: displayWidth, height: displayHeight }
      ),
      presigned: presign,
      jwt,
    };
  }, [uid, jwt, presign]);
};

/**
 * Fetches the native export for a content file with the given uid and jwt,
 * presigning as requested.
 */
export const getNativeExport = (
  uid: string,
  jwt: string,
  presign: boolean,
  size?: { width: number; height: number }
): ContentFileNativeExport => {
  const path = Platform.select({
    ios: `/api/1/content_files/${uid}/ios.m3u8`,
    android: `/api/1/content_files/${uid}/android.m3u8`,
  });

  if (path === undefined) {
    throw new Error('Unsupported platform for audio content');
  }

  const qargs: [string, string][] = [['bmin', '90000']];
  if (presign) {
    qargs.push(['jwt', jwt]);
  }
  if (size !== undefined) {
    qargs.push(['w', size.width.toString()]);
    qargs.push(['h', size.height.toString()]);
    qargs.push(['pr', largestPhysicalPerLogical.toString()]);
  }

  return {
    url: `${HTTP_API_URL}${path}?` + new URLSearchParams(qargs).toString(),
  };
};
