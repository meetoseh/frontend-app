import { AppNotifsState } from "../features/appNotifs/AppNotifsState";
import { FavoritesState } from "../features/favorites/FavoritesState";
import { LoginState } from "../features/login/LoginState";
import { PickEmotionJourneyState } from "../features/pickEmotionJourney/PickEmotionJourneyState";
import { RequestNameState } from "../features/requestName/RequestNameState";
import { SettingsState } from "../features/settings/SettingsState";

export type FeatureAllStates = {
  login: LoginState;
  favorites: FavoritesState;
  requestName: RequestNameState;
  pickEmotionJourney: PickEmotionJourneyState;
  settings: SettingsState;
  appNotifs: AppNotifsState;
};
