import { ReactElement } from "react";
import { ErrorBanner, ErrorBannerText } from "../components/ErrorBanner";

/**
 * Guesses the best description for the given error. This works best
 * on errors that are from a fetch request.
 *
 * @param e The error to describe
 * @returns A description of the error
 */
export const describeError = async (e: any): Promise<ReactElement> => {
  console.error("describing error:", e);
  if (e instanceof TypeError) {
    return (
      <ErrorBanner>
        <ErrorBannerText>
          Failed to connect to server. Check your internet connection.
        </ErrorBannerText>
      </ErrorBanner>
    );
  } else if (e instanceof Response) {
    e.text()
      .then((t) => console.error("response text:", t))
      .catch((e2) => {
        console.error("failed to get response text:", e2);
      });
    return (
      <ErrorBanner>
        <ErrorBannerText>
          E{e.status} - try again or contact customer support at hi@oseh.com
        </ErrorBannerText>
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
