import { useEffect, useMemo, useState } from 'react';
import { LoginContextValue } from '../contexts/LoginContext';
import { apiFetch } from '../lib/apiFetch';
import { OsehImageState } from '../images/OsehImageState';
import { OsehImageRef } from '../images/OsehImageRef';
import { useOsehImageState } from '../images/useOsehImageState';
import { useOsehImageStateRequestHandler } from '../images/useOsehImageStateRequestHandler';

type MyProfilePictureStateProps = {
  /**
   * The current login context; profile pictures are always unavailable
   * when not logged in.
   */
  loginContext: LoginContextValue;

  /**
   * Desired display width of the image
   */
  displayWidth: number;

  /**
   * Desired display height of the image
   */
  displayHeight: number;
};

export type MyProfilePictureState =
  | { state: 'loading' | 'unavailable'; image: null }
  | { state: 'available'; image: OsehImageState };

/**
 * Acts as a react hook for finding, selecting, and downloading the
 * current users profile picture.
 *
 * @returns The current state of the profile picture
 */
export const useMyProfilePictureState = ({
  loginContext,
  displayWidth,
  displayHeight,
}: MyProfilePictureStateProps): MyProfilePictureState => {
  const images = useOsehImageStateRequestHandler({});
  const [imgRef, setImgRef] = useState<{ sub: string; img: OsehImageRef } | null>(null);
  const [loadingImageRefFailed, setLoadingImageRefFailed] = useState<string | null>(null);
  const img = useOsehImageState({
    uid: imgRef?.img?.uid ?? null,
    jwt: imgRef?.img?.jwt ?? null,
    displayWidth,
    displayHeight,
    alt: 'Profile',
  }, images);

  useEffect(() => {
    if (loginContext.state !== 'logged-in' || loginContext.userAttributes === null) {
      setImgRef(null);
      return;
    }

    const userSub = loginContext.userAttributes.sub;

    if (imgRef !== null && imgRef.sub === userSub) {
      return;
    }

    if (loadingImageRefFailed !== null && loadingImageRefFailed === userSub) {
      return;
    }

    let active = true;
    getImageRef();
    return () => {
      active = false;
    };

    async function getImageRef(retryCounter = 0) {
      if (!active) {
        return;
      }

      try {
        const response = await apiFetch('/api/1/users/me/picture', {}, loginContext);
        if (!active) {
          return;
        }
        if (!response.ok) {
          if (response.status === 404) {
            if (retryCounter < 1) {
              setTimeout(getImageRef.bind(undefined, retryCounter + 1), 10000);
            } else {
              setLoadingImageRefFailed(userSub);
            }
            return;
          }

          const text = await response.text();
          if (!active) {
            return;
          }
          console.error("Couldn't fetch profile picture", response, text);
          setLoadingImageRefFailed(userSub);
          return;
        }

        const data: OsehImageRef = await response.json();
        if (!active) {
          return;
        }
        setImgRef({ sub: userSub, img: data });
      } catch (e) {
        console.error("Couldn't fetch profile picture", e);
        setImgRef(null);
        setLoadingImageRefFailed(userSub);
      }
    }
  }, [loginContext, imgRef, loadingImageRefFailed]);

  return useMemo(() => {
    if (loadingImageRefFailed) {
      return { state: 'unavailable', image: null };
    }

    if (imgRef === null || img.loading) {
      return { state: 'loading', image: null };
    }

    return { state: 'available', image: img };
  }, [imgRef, img, loadingImageRefFailed]);
};
