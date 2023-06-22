import { LoginState } from '../features/login/LoginState';
import { PickEmotionJourneyState } from '../features/pickEmotionJourney/PickEmotionJourneyState';
import { RequestNameState } from '../features/requestName/RequestNameState';

export type FeatureAllStates = {
  login: LoginState;
  requestName: RequestNameState;
  pickEmotionJourney: PickEmotionJourneyState;
};
