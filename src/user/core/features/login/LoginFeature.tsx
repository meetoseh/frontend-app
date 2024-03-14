import { useContext, useEffect } from 'react';
import { Feature } from '../../models/Feature';
import { LoginResources } from './LoginResources';
import { LoginState } from './LoginState';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import { useWindowSizeValueWithCallbacks } from '../../../../shared/hooks/useWindowSize';
import { useOsehImageStateRequestHandler } from '../../../../shared/images/useOsehImageStateRequestHandler';
import { Login } from './Login';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { useOsehImageStateValueWithCallbacks } from '../../../../shared/images/useOsehImageStateValueWithCallbacks';
import { OsehImageProps } from '../../../../shared/images/OsehImageProps';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';

/**
 * Presents the user with the ability to login when they are logged out.
 */
export const LoginFeature: Feature<LoginState, LoginResources> = {
  identifier: 'login',

  useWorldState() {
    const loginContextRaw = useContext(LoginContext);
    const onboard = useWritableValueWithCallbacks<boolean>(() => false);
    const state = useWritableValueWithCallbacks<LoginState>(() => ({
      required: undefined,
      onboard: false,
      setOnboard: () => {
        throw new Error('not loaded');
      },
    }));

    useEffect(() => {
      let active = true;
      onboard.callbacks.add(update);
      loginContextRaw.value.callbacks.add(update);
      update();
      return () => {
        if (!active) {
          return;
        }
        active = false;
        onboard.callbacks.remove(update);
        loginContextRaw.value.callbacks.remove(update);
      };

      function update() {
        if (!active) {
          return;
        }
        const loginContext = loginContextRaw.value.get();
        setVWC(state, {
          required:
            loginContext.state === 'loading'
              ? undefined
              : loginContext.state !== 'logged-in',
          onboard: loginContext.state === 'loading' ? undefined : onboard.get(),
          setOnboard: (v) => {
            setVWC(onboard, v);
          },
        });
      }
    }, [loginContextRaw, onboard, state]);

    return state;
  },

  isRequired(worldState) {
    return worldState.required;
  },

  useResources(stateVWC, loadVWC) {
    const windowSizeVWC = useWindowSizeValueWithCallbacks();
    const images = useOsehImageStateRequestHandler({});
    const backgroundProps = useMappedValuesWithCallbacks(
      [windowSizeVWC, loadVWC],
      (): OsehImageProps => {
        const load = loadVWC.get();
        const windowSize = windowSizeVWC.get();

        return {
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
        };
      }
    );
    const background = useOsehImageStateValueWithCallbacks(
      {
        type: 'callbacks',
        props: () => backgroundProps.get(),
        callbacks: backgroundProps.callbacks,
      },
      images
    );

    return useMappedValuesWithCallbacks(
      [windowSizeVWC, background],
      (): LoginResources => {
        return {
          background: background.get(),
          windowSize: windowSizeVWC.get(),
          loading: background.get().loading,
        };
      }
    );
  },

  component: (state, resources) => (
    <Login state={state} resources={resources} />
  ),
};
