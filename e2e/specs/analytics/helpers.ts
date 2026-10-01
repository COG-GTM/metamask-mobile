import { E2E_METAMETRICS_TRACK_URL } from '../../../app/util/test/utils';

interface MockedEndpoint {
  isPending(): Promise<boolean>;
  getSeenRequests(): Promise<MockedRequest[]>;
}

interface MockedRequest {
  url: string;
  body?: { getJson: () => Promise<unknown> };
}

export interface AnalyticsMockServer {
  getMockedEndpoints(): Promise<unknown[]>;
}

export interface EventPayload {
  event: string;
  properties?: Record<string, unknown>;
}

/**
 * Retrieves payloads of requests matching specified metametrics events.
 * @param {Object} mockServer - The mock server instance.
 * @param {Array<string>} [events] - Event names to filter payloads. If not provided, all events are returned.
 * @returns {Promise<Array>} Filtered request payloads.
 */
export const getEventsPayloads = async (
  mockServer: AnalyticsMockServer,
  events: string[] = [],
): Promise<EventPayload[]> => {
  const waitForPendingEndpoints = async (
    timeout = 5000,
  ): Promise<MockedEndpoint[]> => {
    const startTime = Date.now();

    const checkPendingEndpoints = async (): Promise<MockedEndpoint[]> => {
      const mockedEndpoints =
        (await mockServer.getMockedEndpoints()) as MockedEndpoint[];
      const pendingEndpoints = await Promise.all(
        mockedEndpoints.map((endpoint) => endpoint.isPending()),
      );

      if (pendingEndpoints.some((isPending) => isPending)) {
        if (Date.now() - startTime >= timeout) {
          // eslint-disable-next-line no-console
          console.warn('Timeout reached while waiting for pending endpoints.');
          console.warn(
            'Some of the requests set up in the mock server were not completed.',
          );
          return mockedEndpoints;
        }
        // eslint-disable-next-line no-console
        console.log('Waiting for pending endpoints...');
        await new Promise((resolve) => setTimeout(resolve, 2500));
        return checkPendingEndpoints();
      }

      return mockedEndpoints;
    };

    return checkPendingEndpoints();
  };

  const mockedEndpoints = await waitForPendingEndpoints();

  const requests = (
    await Promise.all(
      mockedEndpoints.map((endpoint) => endpoint.getSeenRequests()),
    )
  ).flat();

  const metametricsUrl = E2E_METAMETRICS_TRACK_URL;

  const matchingRequests = requests.filter((request) => {
    const url = new URL(request.url);
    const proxiedUrl = url.searchParams.get('url');
    return proxiedUrl?.includes(metametricsUrl);
  });

  const payloads = (
    await Promise.all(matchingRequests.map((req) => req.body?.getJson()))
  ).filter(Boolean) as EventPayload[];

  return payloads
    .filter(
      (payload) => events.length === 0 || events.includes(payload.event),
    )
    .map(({ event, properties }) => ({ event, properties }));
};
