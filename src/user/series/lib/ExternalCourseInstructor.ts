import { CrudFetcherMapper } from '../../../shared/lib/CrudFetcher';

export type ExternalCourseInstructor = {
  /** Primary stable external identifier for the instructor */
  uid: string;

  /** Display name for the instructor */
  name: string;
};

export const externalCourseInstructorKeyMap: CrudFetcherMapper<ExternalCourseInstructor> =
  {};
