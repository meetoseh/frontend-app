import { ReactElement } from 'react';
import { ErrorBanner, ErrorBannerText } from '../components/ErrorBanner';
import { Text } from 'react-native';
import { OsehStyles } from '../OsehStyles';

export const describeFetchError = (): ReactElement => {
  return (
    <ErrorBanner>
      <ErrorBannerText>
        Failed to connect to server. Check your internet connection.
      </ErrorBannerText>
    </ErrorBanner>
  );
};

/**
 * makes a standard error component with the given text on web this is always
 * inline, on native it typically is a block absolutely positioned unless inline
 * is set to true
 */
export const makeTextError = (
  text: string,
  opts?: {
    inline?: boolean;
  }
) => {
  if (opts?.inline) {
    return (
      <Text
        style={[
          OsehStyles.typography.detail1,
          OsehStyles.colors.v4.experimental.lightError,
        ]}
      >
        {text}
      </Text>
    );
  }

  return (
    <ErrorBanner>
      <ErrorBannerText>{text}</ErrorBannerText>
    </ErrorBanner>
  );
};
/**
 * Guesses the best description for the given error. This works best
 * on errors that are from a fetch request.
 *
 * @param e The error to describe
 * @returns A description of the error
 */
export const describeError = async (
  e: any,
  opts?: { silent: boolean }
): Promise<ReactElement> => {
  if (e instanceof TypeError) {
    console.error('describing error:', e);
    return describeFetchError();
  } else if (e instanceof Response) {
    if (!opts?.silent) {
      console.error('describing error:', e);
      e.text()
        .then((t) => console.error('response text:', t))
        .catch((e2) => {
          console.error('failed to get response text:', e2);
        });
    }
    return (
      <ErrorBanner>
        <ErrorBannerText>
          E{e.status} - try again or contact customer support at hi@oseh.com
        </ErrorBannerText>
      </ErrorBanner>
    );
  } else if (e instanceof Error && e.message === 'not implemented') {
    console.error('describing error:', e);
    return (
      <ErrorBanner>
        <ErrorBannerText>
          This feature is not available in your current environment.
        </ErrorBannerText>
      </ErrorBanner>
    );
  } else if (e instanceof Error && e.message === 'aborted') {
    return (
      <ErrorBanner>
        <ErrorBannerText>The request was aborted - try again.</ErrorBannerText>
      </ErrorBanner>
    );
  } else {
    return (
      <ErrorBanner>
        <ErrorBannerText>
          Something went wrong - try again or contact customer support at
          hi@oseh.com
        </ErrorBannerText>
      </ErrorBanner>
    );
  }
};
