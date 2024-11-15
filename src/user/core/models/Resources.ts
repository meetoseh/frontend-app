import { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import {
  OsehContentNativeMinimalRef,
  OsehContentNativeRef,
} from '../../../shared/content/OsehContentRef';
import { ContentFileNativeExport } from '../../../shared/content/OsehContentTarget';
import { LoginContextValueLoggedIn } from '../../../shared/contexts/LoginContext';
import { OsehImageExport } from '../../../shared/images/OsehImageExport';
import { OsehImageExportCropped } from '../../../shared/images/OsehImageExportCropped';
import { OsehImageExportCroppedRef } from '../../../shared/images/OsehImageExportCroppedRef';
import { OsehImageExportRef } from '../../../shared/images/OsehImageExportRef';
import { DisplaySize } from '../../../shared/images/OsehImageProps';
import { OsehImageRef } from '../../../shared/images/OsehImageRef';
import { OsehPublicImageRef } from '../../../shared/images/OsehPublicImageRef';
import { PlaylistWithJWT } from '../../../shared/images/Playlist';
import { InfiniteListing } from '../../../shared/lib/InfiniteListing';
import { Emotion } from '../../../shared/models/Emotion';
import { OnboardingVideo } from '../../../shared/models/OnboardingVideo';
import { RequestHandler } from '../../../shared/requests/RequestHandler';
import { OsehTranscript } from '../../../shared/transcripts/OsehTranscript';
import { OsehTranscriptRef } from '../../../shared/transcripts/OsehTranscriptRef';
import { CourseRef } from '../../favorites/lib/CourseRef';
import { MinimalCourseJourney } from '../../favorites/lib/MinimalCourseJourney';
import { MinimalJourney } from '../../favorites/lib/MinimalJourney';
import { StreakInfo } from '../../journey/models/StreakInfo';
import { ExpirableCourseRef } from '../../series/lib/ExpirableCourseRef';
import { ExternalCourse } from '../../series/lib/ExternalCourse';
import { CourseJourneys } from '../../series/lib/createSeriesJourneysRequestHandler';
import { CourseLikeState } from '../../series/lib/createSeriesLikeStateRequestHandler';
import { SeriesListRequest } from '../../series/lib/createSeriesListRequestHandler';
import { FavoritesListRequest } from '../screens/favorites/lib/createFavoritesListRequestHandler';
import { HistoryListRequest } from '../screens/history/lib/createHistoryListRequestHandler';
import { HomeCopy } from '../screens/home/lib/createHomeCopyRequestHandler';
import { HomeImage } from '../screens/home/lib/createHomeImageRequestHandler';
import { OptionalOsehImageRef } from '../screens/home/lib/createProfilePictureRequestHandler';
import {
  SessionStateSnapshot,
  SessionState,
} from '../screens/home/lib/createSessionStateRequestHandler';
import { ExpirableJourneyRef } from '../screens/journey_feedback/lib/ExpirableJourneyRef';
import { JourneyMinimalRef } from '../screens/journey_feedback/lib/JourneyMinimalRef';
import { JourneyShareableInfo } from '../screens/journey_feedback/lib/createIsJourneyShareableRequestHandler';
import { JourneyLikeState } from '../screens/journey_feedback/lib/createJourneyLikeStateRequestHandler';
import { JourneyShareLink } from '../screens/journey_feedback/lib/createJourneyShareLinkRequestHandler';
import { MembershipUrl } from '../screens/membership/lib/createManageMembershipUrlRequestHandler';
import { OwnedListRequest } from '../screens/owned/lib/createOwnedListRequestHandler';
import { ReminderChannelsInfo } from '../screens/reminder_times/lib/createReminderChannelsHandler';
import { ReminderSettings } from '../screens/reminder_times/lib/createReminderSettingsHandler';
import {
  Entitlement,
  EntitlementRef,
} from '../screens/settings/lib/createEntitlementRequestHandler';
import { OfferingPriceRef } from '../screens/upgrade/lib/createOfferingPriceRequestHandler';
import { RevenueCatOffering } from '../screens/upgrade/models/RevenueCatOffering';
import { AudioFileData } from '../../../shared/content/createAudioDataHandler';
import {
  OsehNotificationPermissionsRequest,
  OsehNotificationsPermission,
} from '../screens/add_push_token/lib/createNotificationPermissionsStatusHandler';
import { OsehExpoToken } from '../screens/add_push_token/lib/createExpoTokenHandler';
import {
  OsehExpoTokenSync,
  OsehExpoTokenSyncMinimalRequest,
  OsehExpoTokenSyncRequest,
} from '../screens/add_push_token/lib/createExpoTokenSyncHandler';
import {
  OsehTrackingPermission,
  OsehTrackingPermissionsRequest,
} from '../screens/app_tracking_transparency/lib/trackingPermissionHandler';
import { Identity } from '../screens/settings/hooks/useIdentities';
import {
  JournalEntryListMinimalRequest,
  JournalEntryListRequest,
  JournalEntryListState,
} from '../screens/journal_entries_list/lib/createJournalEntryListRequestHandler';
import {
  LibraryListMinimalRequest,
  LibraryListRequest,
  LibraryListState,
} from '../screens/library/lib/createLibraryListRequestHandler';
import {
  InstructorListMinimalRequest,
  InstructorListRequest,
  InstructorListState,
} from '../screens/library_filter/lib/createInstructorListRequestHandler';
import {
  VoiceNoteStateMachineMinimalRef,
  VoiceNoteStateMachineRef,
} from '../screens/journal_chat/lib/createVoiceNoteStateMachineRequestHandler';
import { VoiceNoteStateMachine } from '../screens/journal_chat/lib/createVoiceNoteStateMachine';
import {
  JournalEntryMetadata,
  JournalEntryMetadataMinimalRef,
  JournalEntryMetadataRef,
} from '../screens/journal_chat/lib/createJournalEntryMetadataRequestHandler';
import {
  JournalEntryStateMachineMinimalRef,
  JournalEntryStateMachineRef,
} from '../screens/journal_chat/lib/createJournalEntryStateMachineRequestHandler';
import { JournalEntryStateMachine } from '../screens/journal_chat/lib/createJournalEntryStateMachine';

/**
 * Contains everything that any screen might want to eagerly preload. Generally,
 * if the resource is cacheable (like an image) and might be used by more than
 * one user client screen (e.g., two instances of the same screen), it should be
 * requested and received via the Resources object.
 *
 * If a resource is either trivial (e.g., some local computation) or is extremely
 * specific, it can be loaded per-instance instead.
 */
export type Resources = {
  /**
   * Manages downloading private playlists
   */
  privatePlaylistHandler: RequestHandler<
    { uid: string },
    OsehImageRef,
    PlaylistWithJWT
  >;
  /**
   * Manages downloading public playlists
   */
  publicPlaylistHandler: RequestHandler<
    { uid: string },
    OsehPublicImageRef,
    PlaylistWithJWT
  >;
  /**
   * Manages downloading raw image assets
   */
  imageDataHandler: RequestHandler<
    { item: { uid: string } },
    OsehImageExportRef,
    OsehImageExport
  >;
  /**
   * Manages cropping downloaded image assets
   */
  imageCropHandler: RequestHandler<
    { export: { item: { uid: string } }; cropTo: DisplaySize },
    OsehImageExportCroppedRef,
    OsehImageExportCropped
  >;
  /**
   * For the web, this downloads the equivalent to an m3u8 file. On native,
   * this is just a small transformation of the input.
   */
  contentPlaylistHandler: RequestHandler<
    OsehContentNativeMinimalRef,
    OsehContentNativeRef,
    ContentFileNativeExport
  >;
  /**
   * Prepares the m3u8 file for playing by downloading the first few segments
   */
  audioDataHandler: RequestHandler<
    ContentFileNativeExport,
    ContentFileNativeExport,
    AudioFileData
  >;
  /**
   * Manages creating objects that can paginate through the list of series
   */
  seriesListHandler: RequestHandler<
    SeriesListRequest,
    SeriesListRequest,
    InfiniteListing<ExternalCourse>
  >;
  /**
   * Manages creating objects that keep track if the user has liked a series
   */
  seriesLikeStateHandler: RequestHandler<
    { course: { uid: string } },
    ExpirableCourseRef,
    CourseLikeState
  >;
  /**
   * Manages getting the journeys that are part of a series
   */
  seriesJourneysHandler: RequestHandler<
    { uid: string },
    CourseRef,
    CourseJourneys
  >;
  /**
   * Manages determining the RevenueCat representation of the offerings available
   * to the current user. Native only.
   */
  purchaseOfferingsHandler: RequestHandler<
    LoginContextValueLoggedIn,
    LoginContextValueLoggedIn,
    PurchasesOfferings
  >;
  /**
   * Determines which offering should be served to the logged in user.
   */
  offeringHandler: RequestHandler<
    LoginContextValueLoggedIn,
    LoginContextValueLoggedIn,
    RevenueCatOffering
  >;
  /**
   * Manages extracting the price of a particular product within the users
   * current offering.
   */
  priceHandler: RequestHandler<
    OfferingPriceRef,
    OfferingPriceRef,
    PurchasesPackage
  >;
  /**
   * Determines if a journey can be shared
   */
  journeyIsShareableHandler: RequestHandler<
    JourneyMinimalRef,
    JourneyMinimalRef,
    JourneyShareableInfo
  >;
  /**
   * Actually creates share links for journeys
   */
  journeyShareLinkHandler: RequestHandler<
    JourneyMinimalRef,
    JourneyMinimalRef,
    JourneyShareLink
  >;
  /**
   * Manages creating objects that keep track if the user has liked a journey
   */
  journeyLikeStateHandler: RequestHandler<
    { journey: { uid: string } },
    ExpirableJourneyRef,
    JourneyLikeState
  >;
  /**
   * Manages objects that keep track of recent activity
   */
  sessionStateHandler: RequestHandler<
    LoginContextValueLoggedIn,
    LoginContextValueLoggedIn,
    SessionState
  >;
  /**
   * Downloads the current home copy for the user
   */
  homeCopyHandler: RequestHandler<
    SessionStateSnapshot,
    SessionStateSnapshot,
    HomeCopy
  >;
  /**
   * Downloads the current home image reference for the user (can chain this to
   * privatePlaylistHandler, etc)
   */
  homeImageHandler: RequestHandler<
    SessionStateSnapshot,
    SessionStateSnapshot,
    HomeImage
  >;
  /**
   * Determines the current profile picture for the user
   */
  profilePictureHandler: RequestHandler<
    LoginContextValueLoggedIn,
    LoginContextValueLoggedIn,
    OptionalOsehImageRef
  >;
  /**
   * Determines the users streak information
   */
  streakHandler: RequestHandler<
    LoginContextValueLoggedIn,
    LoginContextValueLoggedIn,
    StreakInfo
  >;
  /**
   * Determines what emotions the user can take classes from
   */
  emotionsHandler: RequestHandler<
    LoginContextValueLoggedIn,
    LoginContextValueLoggedIn,
    Emotion[]
  >;
  /**
   * The identities the user can use to login
   */
  identitiesHandler: RequestHandler<
    LoginContextValueLoggedIn,
    LoginContextValueLoggedIn,
    Identity[]
  >;
  /**
   * Manages fetching entitlement information
   */
  entitlementsHandler: RequestHandler<
    EntitlementRef,
    EntitlementRef,
    Entitlement
  >;
  /**
   * Manages creating objects that can paginate through the list of the logged
   * in users favorite classes
   */
  favoritesListHandler: RequestHandler<
    FavoritesListRequest,
    FavoritesListRequest,
    InfiniteListing<MinimalJourney>
  >;
  /**
   * Manages creating objects that can paginate through the list of journeys the
   * logged in user has already taken
   */
  historyListHandler: RequestHandler<
    HistoryListRequest,
    HistoryListRequest,
    InfiniteListing<MinimalJourney>
  >;
  /**
   * Manages creating objects that can paginate through the list of purchased content
   * by the logged in user
   */
  ownedListHandler: RequestHandler<
    OwnedListRequest,
    OwnedListRequest,
    InfiniteListing<MinimalCourseJourney>
  >;
  /**
   * Manages getting the stripe customer portal url for the logged in user
   */
  manageMembershipUrlHandler: RequestHandler<
    LoginContextValueLoggedIn,
    LoginContextValueLoggedIn,
    MembershipUrl
  >;
  /**
   * Manages getting what channels the user can configure and which ones they have
   * already configured
   */
  reminderChannelsHandler: RequestHandler<
    LoginContextValueLoggedIn,
    LoginContextValueLoggedIn,
    ReminderChannelsInfo
  >;
  /**
   * Manages getting the users current reminder settings
   */
  reminderSettingsHandler: RequestHandler<
    LoginContextValueLoggedIn,
    LoginContextValueLoggedIn,
    ReminderSettings
  >;
  /**
   * Manages selecting the appropriate onboarding welcome video for the logged in user
   */
  onboardingVideoHandler: RequestHandler<
    LoginContextValueLoggedIn,
    LoginContextValueLoggedIn,
    OnboardingVideo
  >;
  /** Manages downloading transcripts */
  transcriptHandler: RequestHandler<
    Pick<OsehTranscriptRef, 'uid'>,
    OsehTranscriptRef,
    OsehTranscript
  >;
  /** Manages fetching the current state of notification permissions */
  notificationPermissionsHandler: RequestHandler<
    OsehNotificationPermissionsRequest,
    OsehNotificationPermissionsRequest,
    OsehNotificationsPermission
  >;
  /** Manages fetching the expo push token if we have permissions */
  expoTokenHandler: RequestHandler<
    { granted: true },
    OsehNotificationsPermission & { granted: true },
    OsehExpoToken
  >;
  /** Manages syncing an expo push token with the oseh backend */
  expoTokenSyncHandler: RequestHandler<
    OsehExpoTokenSyncMinimalRequest,
    OsehExpoTokenSyncRequest,
    OsehExpoTokenSync
  >;
  /** Manages if the user has authorized access to app-related tracking data */
  trackingPermissionHandler: RequestHandler<
    OsehTrackingPermissionsRequest,
    OsehTrackingPermissionsRequest,
    OsehTrackingPermission
  >;
  /**
   * Manages streaming journal entries
   */
  journalEntryStateMachineHandler: RequestHandler<
    JournalEntryStateMachineMinimalRef,
    JournalEntryStateMachineRef,
    JournalEntryStateMachine
  >;

  /** Manages retrieving metadata on journal entries */
  journalEntryMetadataHandler: RequestHandler<
    JournalEntryMetadataMinimalRef,
    JournalEntryMetadataRef,
    JournalEntryMetadata
  >;

  /** Manages retrieving the users journal entries listing */
  journalEntryListHandler: RequestHandler<
    JournalEntryListMinimalRequest,
    JournalEntryListRequest,
    JournalEntryListState
  >;

  /** Manages searching the journey library */
  libraryListHandler: RequestHandler<
    LibraryListMinimalRequest,
    LibraryListRequest,
    LibraryListState
  >;

  /** Manages searching what instructors should be included in the classes filter */
  instructorsListHandler: RequestHandler<
    InstructorListMinimalRequest,
    InstructorListRequest,
    InstructorListState
  >;

  /** Manages downloading voice notes */
  voiceNoteHandler: RequestHandler<
    VoiceNoteStateMachineMinimalRef,
    VoiceNoteStateMachineRef,
    VoiceNoteStateMachine
  >;
};
