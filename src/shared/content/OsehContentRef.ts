export type OsehContentRef = {
  /**
   * The UID of the content file to show. If null, we will show nothing.
   */
  uid: string | null;

  /**
   * The JWT to use to access the content file. If null, we will show nothing.
   */
  jwt: string | null;
};

export type OsehContentRefLoadable = OsehContentRef & {
  uid: string;
  jwt: string;
};

export type OsehContentNativeInfo =
  | {
      showAs: 'audio';
    }
  | {
      showAs: 'video';
      displayWidth: number;
      displayHeight: number;
    };

export type OsehContentNativeMinimalRef = {
  uid: string;
} & OsehContentNativeInfo;

export type OsehContentNativeRef = OsehContentRefLoadable &
  OsehContentNativeInfo;
