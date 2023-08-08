import { NotificationPermissionsStatus } from "expo-notifications";

export type NotificationPermissionsStatusWithoutStatus = Omit<
  NotificationPermissionsStatus,
  "status"
> & {
  status?: NotificationPermissionsStatus["status"];
};

/**
 * The state required to decide if we should show the request app notifications
 * dialog, plus any state we want to share with other features.
 */
export type AppNotifsState = {
  /**
   * True if we have successfully initialized our push notifications, false
   * if we tried to but an error occurred, null if we haven't tried yet.
   *
   * For android, this is referring to setNotificationChannelAsync.
   *
   * For both ios and android, this includes dismissing all active notifications
   * if the app is in the foreground.
   */
  initializedSuccessfully: boolean | null;

  /**
   * The current notification permissions status, or null if we haven't
   * checked yet (or won't check because e.g., we haven't initialized
   * successfully).
   */
  permissionsStatus: NotificationPermissionsStatusWithoutStatus | null;

  /**
   * If we have determined when we last requested permissions (which may
   * not have involved the native dialog, since we first ask them with
   * our own dialog), this is either the date of the request or null if
   * we haven't asked yet.
   *
   * This is undefined if we haven't yet loaded whether we have asked
   * before.
   *
   * Note that we don't want to coordinate this request with the server, since
   * it should be requested separately on each device. Hence there is no
   * "InappNotification" field here. However, we do want to tell the server when
   * we show the dialog, hence there _is_ an InappNotificationSession in the
   * resources.
   */
  lastRequestedLocally: Date | null | undefined;

  /**
   * The expo push token, or null if we tried to get it but it's not available,
   * or undefined if we haven't tried to fetch it (e.g., because we haven't been
   * granted permissions) or we are in the process of fetching it.
   *
   * Note that sending the expo token to our server is handled automatically
   * by this feature.
   */
  expoToken: string | null | undefined;

  /**
   * A function to request permissions using the native dialog. This will both
   * update the permissions status field as well as return the new status. If
   * this succeeds, it will also result in refetching the expo push token. This
   * will _not_ affect lastRequestedLocally - call `onDoneRequestingLocally` either
   * when this finishes or when the user skips without the native dialog.
   */
  requestUsingNativeDialog: () => Promise<NotificationPermissionsStatusWithoutStatus>;

  /**
   * Updates the lastRequestedLocally field to the current time. This should be
   * called to dismiss our dialog, whether or not the user accepted or skipped.
   */
  onDoneRequestingLocally: () => Promise<void>;
};
