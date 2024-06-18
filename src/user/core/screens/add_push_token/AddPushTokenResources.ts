import { ScreenResources } from '../../models/Screen';
import { ValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { ReminderSettings } from '../reminder_times/lib/createReminderSettingsHandler';
import { OsehNotificationsPermission } from './lib/createNotificationPermissionsStatusHandler';
import { OsehImageExportCropped } from '../../../../shared/images/OsehImageExportCropped';

export type AddPushTokenResources = ScreenResources & {
  /** The state of the users permissions: null while loading or initializing. */
  permissions: ValueWithCallbacks<OsehNotificationsPermission | null>;

  /** The users settings by channel, or null while loading or if unavailable */
  settings: ValueWithCallbacks<ReminderSettings | null>;

  /** The image, if there is one and it has been loaded, otherwise null */
  image: ValueWithCallbacks<OsehImageExportCropped | null>;
};
