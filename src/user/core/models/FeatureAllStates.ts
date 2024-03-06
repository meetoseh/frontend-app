import { AppNotifsState } from '../features/appNotifs/AppNotifsState';
import { ConfirmMergeAccountState } from '../features/confirmMergeAccount/ConfirmMergeAccountState';
import { FavoritesState } from '../features/favorites/FavoritesState';
import { GoalDaysPerWeekState } from '../features/goalDaysPerWeek/GoalDaysPerWeekState';
import { LoginState } from '../features/login/LoginState';
import { MergeAccountState } from '../features/mergeAccount/MergeAccountState';
import { PickEmotionJourneyState } from '../features/pickEmotionJourney/PickEmotionJourneyState';
import { RequestNameState } from '../features/requestName/RequestNameState';
import { RequestNotificationTimeState } from '../features/requestNotificationTime/RequestNotificationTimeState';
import { RequestPhoneState } from '../features/requestPhone/RequestPhoneState';
import { SeriesListState } from '../features/seriesList/SeriesListState';
import { SettingsState } from '../features/settings/SettingsState';
import { SignupRewardState } from '../features/signupReward/SignupRewardState';

export type FeatureAllStates = {
  login: LoginState;
  favorites: FavoritesState;
  requestName: RequestNameState;
  pickEmotionJourney: PickEmotionJourneyState;
  settings: SettingsState;
  appNotifs: AppNotifsState;
  signupReward: SignupRewardState;
  goalDaysPerWeek: GoalDaysPerWeekState;
  requestPhone: RequestPhoneState;
  requestNotificationTime: RequestNotificationTimeState;
  mergeAccount: MergeAccountState;
  confirmMergeAccount: ConfirmMergeAccountState;
  seriesList: SeriesListState;
};
