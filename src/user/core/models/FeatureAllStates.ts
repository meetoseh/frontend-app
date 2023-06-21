import { LoginState } from '../features/login/LoginState';
import { RequestNameState } from '../features/requestName/RequestNameState';

export type FeatureAllStates = {
  login: LoginState;
  requestName: RequestNameState;
};
