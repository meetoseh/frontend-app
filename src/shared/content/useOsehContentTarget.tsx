import { useMemo } from "react";
import { OsehContentProps } from "./OsehContentProps";
import {
  ContentFileNativeExport,
  OsehContentTarget,
} from "./OsehContentTarget";
import { HTTP_API_URL } from "../lib/apiFetch";
import { Platform } from "react-native";

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
  showAs = "audio",
  presign = true,
}: OsehContentProps): OsehContentTarget => {
  return useMemo<OsehContentTarget>(() => {
    if (uid === null || jwt === null) {
      return {
        state: "loading",
        error: null,
        nativeExport: null,
        presigned: null,
        jwt: null,
      };
    }

    return {
      state: "loaded",
      error: null,
      nativeExport: getNativeExport(uid, jwt, presign),
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
  presign: boolean
): ContentFileNativeExport => {
  const path = Platform.select({
    ios: `/api/1/content_files/${uid}/ios.m3u8`,
    android: `/api/1/content_files/${uid}/android.m3u8`,
  });

  if (path === undefined) {
    throw new Error("Unsupported platform for audio content");
  }

  return {
    url: `${HTTP_API_URL}${path}` + (presign ? "?jwt=" + jwt : ""),
  };
};
