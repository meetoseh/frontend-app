import { ReactElement, useCallback, useMemo } from "react";
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
import { ProviderItem, ProvidersList } from "../login/components/ProvidersList";
import { styles as loginStyles } from "../login/LoginScreenStyles";
import Google from "../login/icons/Google";
import Apple from "../login/icons/Apple";
import Email from "../login/icons/Email";
import { useWritableValueWithCallbacks } from "../../../../shared/lib/Callbacks";
import { Modals, ModalsOutlet } from "../../../../shared/contexts/ModalContext";
import { StatusBar } from "expo-status-bar";
import { usePromptMergeUsingModal } from "./hooks/usePromptMergeUsingModal";
import { useErrorModal } from "../../../../shared/hooks/useErrorModal";
import { setVWC } from "../../../../shared/lib/setVWC";
import {
  ErrorBanner,
  ErrorBannerText,
} from "../../../../shared/components/ErrorBanner";
import { PromptMergeResult } from "./lib/MergeMessagePipe";
import { describeError } from "../../../../shared/lib/describeError";

export const MergeAccount = ({
  resources,
  state,
}: FeatureComponentProps<
  MergeAccountState,
  MergeAccountResources
>): ReactElement => {
  const modals = useWritableValueWithCallbacks<Modals>(() => []);

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

  const promptError = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  const onPromptMergeResult = useCallback(
    (result: PromptMergeResult) => {
      if (result.type === "success") {
        resources.get().onSecureLoginCompleted(result.mergeToken);
        const s = state.get();
        s.ian?.onShown();
        s.onSuggestionsDismissed();
      } else {
        resources.get().onSecureLoginCompleted(null);

        if (result.type === "cancel") {
          setVWC(
            promptError,
            <ErrorBanner>
              <ErrorBannerText>Merge canceled by user.</ErrorBannerText>
            </ErrorBanner>
          );
        } else if (result.type === "dismiss") {
          setVWC(
            promptError,
            <ErrorBanner>
              <ErrorBannerText>Merge dismissed by user.</ErrorBannerText>
            </ErrorBanner>
          );
        } else if (result.type === "error") {
          setVWC(
            promptError,
            <ErrorBanner>
              <ErrorBannerText>ERR: {result.error}</ErrorBannerText>
            </ErrorBanner>
          );
        } else {
          setVWC(
            promptError,
            <ErrorBanner>
              <ErrorBannerText>
                Unknown result: {result.rawType}
              </ErrorBannerText>
            </ErrorBanner>
          );
        }
      }
    },
    [promptError, resources, state]
  );
  const promptMergeUsingModal = usePromptMergeUsingModal(
    modals,
    onPromptMergeResult
  );

  useErrorModal(modals, promptError, "prompting merge");

  const onLeavingWith = useCallback(
    async (provider: MergeProvider) => {
      resources
        .get()
        .session?.storeAction("continue_with_provider", { provider });

      const url = resources.get().providerUrls?.[provider];
      if (url === null || url === undefined) {
        setVWC(
          promptError,
          <ErrorBanner>
            <ErrorBannerText>
              ERR INVARIANT: We could not connect you with the provider (url
              unavailable).
            </ErrorBannerText>
          </ErrorBanner>
        );
        return;
      }

      setVWC(promptError, null);
      resources.get().onShowingSecureLogin();
      try {
        await promptMergeUsingModal(provider, url);
      } catch (e) {
        setVWC(promptError, await describeError(e));
        resources.get().onSecureLoginCompleted(null);
      }
    },
    [resources, promptError, promptMergeUsingModal]
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
      <ModalsOutlet modals={modals} />
      <StatusBar style="light" />
    </View>
  );
};

const ProviderUrls = (
  onLeavingWith: (provider: MergeProvider) => Promise<void>,
  urls: MergeAccountResources["providerUrls"]
): ReactElement => {
  const items = useMemo(() => {
    const result: ProviderItem<MergeProvider>[] = [];
    if (urls?.Google) {
      result.push({
        key: "Google",
        name: "Sign in with Google",
        icon: <Google style={loginStyles.google} />,
      });
    }
    if (urls?.SignInWithApple) {
      result.push({
        key: "SignInWithApple",
        name: "Sign in with Apple",
        icon: <Apple style={loginStyles.apple} />,
      });
    }
    if (urls?.Direct) {
      result.push({
        key: "Direct",
        name: "Sign in with Email",
        icon: <Email style={loginStyles.email} />,
      });
    }
    if (urls?.Dev) {
      result.push({
        key: "Dev",
        name: "Sign in with Dev",
        icon: <Email style={loginStyles.email} />,
      });
    }
    return result;
  }, [urls]);

  return <ProvidersList onItemPressed={onLeavingWith} items={items} />;
};
