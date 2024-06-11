import { ReactElement } from 'react';
import { ErrorBanner, ErrorBannerText } from '../components/ErrorBanner';

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
 * Guesses the best description for the given error. This works best
 * on errors that are from a fetch request.
 *
 * @param e The error to describe
 * @returns A description of the error
 */
export const describeError = async (e: any): Promise<ReactElement> => {
  if (e instanceof TypeError) {
    console.error('describing error:', e);
    return describeFetchError();
  } else if (e instanceof Response) {
    console.error('describing error:', e);
    e.text()
      .then((t) => console.error('response text:', t))
      .catch((e2) => {
        console.error('failed to get response text:', e2);
      });
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
