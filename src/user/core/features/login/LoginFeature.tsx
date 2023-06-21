import { useContext, useMemo, useState } from 'react';
import { Feature } from '../../models/Feature';
import { LoginResources } from './LoginResources';
import { LoginState } from './LoginState';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import { useWindowSize } from '../../../../shared/hooks/useWindowSize';
import { useOsehImageStateRequestHandler } from '../../../../shared/images/useOsehImageStateRequestHandler';
import { useOsehImageState } from '../../../../shared/images/useOsehImageState';
import { Login } from './Login';

/**
 * Presents the user with the ability to login when they are logged out.
 */
export const LoginFeature: Feature<LoginState, LoginResources> = {
  identifier: 'login',

  useWorldState() {
    const loginContext = useContext(LoginContext);
    const [onboard, setOnboard] = useState<boolean>(false);

    return useMemo(
      () => ({
        required: loginContext.state === 'loading' ? undefined : loginContext.state !== 'logged-in',
        onboard: loginContext.state === 'loading' ? undefined : onboard,
        setOnboard,
      }),
      [loginContext.state, onboard]
    );
  },

  isRequired(worldState) {
    return worldState.required;
  },

  useResources(worldState, load) {
    const windowSize = useWindowSize();
    const images = useOsehImageStateRequestHandler({});
    const background = useOsehImageState(
      {
        uid: !load
          ? null
          : windowSize.width < 450
          ? 'oseh_if_ds8R1NIo4ch3pD7vBRT2cg'
          : 'oseh_if_hH68hcmVBYHanoivLMgstg',
        jwt: null,
        displayWidth: windowSize.width,
        displayHeight: windowSize.height,
        isPublic: true,
        alt: '',
      },
      images
    );

    return useMemo(
      () => ({
        background,
        windowSize,
        loading: background.loading,
      }),
      [background, windowSize]
    );
  },

  component: (state, resources) => <Login state={state} resources={resources} />,
};
