import { ReactElement, useCallback, useEffect, useRef } from "react";
import { FeatureComponentProps } from "../../models/Feature";
import { MergeAccountState, MergeProvider } from "./MergeAccountState";
import { MergeAccountResources } from "./MergeAccountResources";
import { styles } from "./MergeAccountStyles";
import { useStartSession } from "../../../../shared/hooks/useInappNotificationSession";
import { useContentWidth } from "../../../../shared/lib/useContentWidth";
import { View, Text } from "react-native";
import { SvgLinearGradientBackground } from "../../../../shared/anim/SvgLinearGradientBackground";
import { STANDARD_BLACK_GRAY_GRADIENT_SVG } from "../../../../styling/colors";
import { FullscreenView } from "../../../../shared/components/FullscreenView";
import { CloseButton } from "../../../../shared/components/CloseButton";
import { RenderGuardedComponent } from "../../../../shared/components/RenderGuardedComponent";
import { useMappedValueWithCallbacks } from "../../../../shared/hooks/useMappedValueWithCallbacks";

export const MergeAccount = ({
  resources,
  state,
}: FeatureComponentProps<
  MergeAccountState,
  MergeAccountResources
>): ReactElement => {
  useStartSession(
    {
      type: "callbacks",
      props: () => resources.get().session,
      callbacks: resources.callbacks,
    },
    {
      onStart: () => {
        resources.get().session?.storeAction("open", {
          merge_suggestions: (state.get().mergeSuggestions ?? []).map(
            (s) => s.provider
          ),
        });
      },
    }
  );

  const onCloseClick = useCallback(() => {
    resources.get().session?.storeAction("x", null);

    const s = state.get();
    s.ian?.onShown();
    s.onSuggestionsDismissed();
  }, [resources, state]);

  const onLeavingWith = useCallback(
    (provider: MergeProvider) => {
      resources
        .get()
        .session?.storeAction("continue_with_provider", { provider });

      const s = state.get();
      s.ian?.onShown();
      s.onSuggestionsDismissed();
    },
    [resources, state]
  );

  const bodyText = useMappedValueWithCallbacks(resources, (r) => {
    const parts = [
      "It looks like you have created an account with us before. Please try logging in again with ",
    ];
    const providers = new Set(
      Object.keys(r.providerUrls ?? {}).filter(
        (k) => !!(r.providerUrls as Record<string, string | null> | null)?.[k]
      )
    );
    const arr = Array.from(providers)
      .sort()
      .map(
        (p) =>
          ({
            Google: "Google",
            SignInWithApple: "Apple",
            Direct: "email",
            Dev: "dev",
          }[p])
      )
      .filter((p) => p !== undefined) as string[];

    if (arr.length === 0) {
      parts.push("any of the following:");
    } else if (arr.length === 1) {
      parts.push(arr[0]);
    } else if (arr.length === 2) {
      parts.push(arr[0], " or ", arr[1]);
    } else {
      for (let i = 0; i < arr.length; i++) {
        if (i === arr.length - 1) {
          parts.push(", or ", arr[i]);
        } else if (i === 0) {
          parts.push(arr[i]);
        } else {
          parts.push(", ", arr[i]);
        }
      }
    }
    return parts.join("");
  });

  const contentWidth = useContentWidth();

  return (
    <View style={styles.container}>
      <SvgLinearGradientBackground
        state={{
          type: "react-rerender",
          props: STANDARD_BLACK_GRAY_GRADIENT_SVG,
        }}
      >
        <FullscreenView style={styles.background}>
          <CloseButton onPress={onCloseClick} />
          <View style={{ ...styles.content, width: contentWidth }}>
            <View style={styles.header}>
              <RenderGuardedComponent
                props={useMappedValueWithCallbacks(
                  resources,
                  (r) => r.givenName
                )}
                component={(name) => (
                  <>
                    {name && name !== "Anonymous" && (
                      <Text style={styles.headerLine}>Hi, {name}!</Text>
                    )}
                  </>
                )}
              />
              <Text style={styles.headerLine}>Welcome back.</Text>
            </View>
            <RenderGuardedComponent
              props={bodyText}
              component={(txt) => <Text style={styles.body}>{txt}</Text>}
            />
            <View style={styles.providers}>
              <RenderGuardedComponent
                props={useMappedValueWithCallbacks(
                  resources,
                  (r) => r.providerUrls
                )}
                component={(urls) => ProviderUrls(onLeavingWith, urls)}
              />
            </View>
          </View>
        </FullscreenView>
      </SvgLinearGradientBackground>
    </View>
  );
};

const ProviderUrls = (
  onLeavingWith: (provider: MergeProvider) => void,
  urls: MergeAccountResources["providerUrls"]
): ReactElement => {
  const googleRef = useRef<HTMLDivElement>(null);
  const appleRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const google = googleRef.current;
    const apple = appleRef.current;
    const email = emailRef.current;

    if (google === null || apple === null || email === null) {
      return;
    }

    google.removeAttribute("style");
    apple.removeAttribute("style");
    email.removeAttribute("style");

    const googleWidth = google.offsetWidth;
    const appleWidth = apple.offsetWidth;
    const emailWidth = email.offsetWidth;

    const maxWidth = Math.max(googleWidth, appleWidth, emailWidth);

    google.style.paddingRight = `${maxWidth - googleWidth}px`;
    apple.style.paddingRight = `${maxWidth - appleWidth}px`;
    email.style.paddingRight = `${maxWidth - emailWidth}px`;
  }, []);

  return (
    <>
      {urls && urls.Google && (
        <Button
          type="button"
          variant="filled-white"
          onClick={urls.Google}
          onLinkClick={() => onLeavingWith("Google")}
        >
          <div className={loginStyles.iconAndText}>
            <div className={loginStyles.signInWithGoogleIcon}></div>
            <div ref={googleRef}>Sign in with Google</div>
          </div>
        </Button>
      )}
      {urls && urls.SignInWithApple && (
        <Button
          type="button"
          variant="filled-white"
          onClick={urls.SignInWithApple}
          onLinkClick={() => onLeavingWith("SignInWithApple")}
        >
          <div className={loginStyles.iconAndText}>
            <div className={loginStyles.signInWithAppleIcon}></div>
            <div ref={appleRef}>Sign in with Apple</div>
          </div>
        </Button>
      )}
      {urls && urls.Direct && (
        <Button
          type="button"
          variant="filled-white"
          onClick={urls.Direct}
          onLinkClick={() => onLeavingWith("Direct")}
        >
          <div className={loginStyles.iconAndText}>
            <div className={loginStyles.signInWithEmailIcon}></div>
            <div ref={emailRef}>Sign in with Email</div>
          </div>
        </Button>
      )}
      {urls && urls.Dev && (
        <Button
          type="button"
          variant="filled-white"
          onClick={urls.Dev}
          onLinkClick={() => onLeavingWith("Dev")}
        >
          <div className={loginStyles.iconAndText}>
            <div className={loginStyles.signInWithEmailIcon}></div>
            <div ref={emailRef}>Sign in with Dev</div>
          </div>
        </Button>
      )}
    </>
  );
};
