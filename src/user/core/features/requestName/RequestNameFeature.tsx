import { useContext } from 'react';
import { Feature } from '../../models/Feature';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import { RequestNameState } from './RequestNameState';
import { RequestNameResources } from './RequestNameResources';
import { RequestName } from './RequestName';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';

/**
 * Glue code surrounding requesting a users name if we don't know their name.
 */
export const RequestNameFeature: Feature<
  RequestNameState,
  RequestNameResources
> = {
  identifier: 'requestName',

  useWorldState: () => {
    const loginContextRaw = useContext(LoginContext);

    return useMappedValueWithCallbacks(loginContextRaw.value, (loginRaw) => {
      if (loginRaw.state !== 'logged-in') {
        return {
          givenName: undefined,
        };
      }

      return {
        givenName: loginRaw.userAttributes.givenName,
      };
    });
  },

  useResources: () => {
    return useWritableValueWithCallbacks(
      (): RequestNameResources => ({
        loading: false,
      })
    );
  },

  isRequired: (worldState) => {
    if (worldState.givenName === undefined) {
      return undefined;
    }

    return (
      worldState.givenName === null || worldState.givenName === 'Anonymous'
    );
  },

  component: (state, resources) => (
    <RequestName state={state} resources={resources} />
  ),
};
