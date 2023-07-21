import { FavoritesState } from "../features/favorites/FavoritesState";
import { LoginState } from "../features/login/LoginState";
import { PickEmotionJourneyState } from "../features/pickEmotionJourney/PickEmotionJourneyState";
import { RequestNameState } from "../features/requestName/RequestNameState";

export type FeatureAllStates = {
  login: LoginState;
  favorites: FavoritesState;
  requestName: RequestNameState;
  pickEmotionJourney: PickEmotionJourneyState;
};
