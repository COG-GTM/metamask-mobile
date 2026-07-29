import axios, { AxiosResponse } from 'axios';
import { getFixturesServerPortInApp } from './utils';

const FETCH_TIMEOUT = 40000; // Timeout in milliseconds

// Configure Axios with CORS headers
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
axios.defaults.headers.common['Access-Control-Allow-Methods'] =
  'GET, POST, PUT, DELETE';
axios.defaults.headers.common['Access-Control-Allow-Headers'] =
  'Origin, X-Requested-With, Content-Type, Accept';

/**
 * The fixture served by the E2E fixture server.
 */
interface FixtureState {
  // The fixture holds an arbitrary preloaded Redux state; typing it as
  // `RootState` makes `configureStore`'s `preloadedState` inference blow up
  // with TS2589 in `app/store/index.ts`.
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state?: any;
  asyncState?: Record<string, string>;
}

const fetchWithTimeout = (url: string) =>
  new Promise<AxiosResponse<FixtureState>>((resolve, reject) => {
    axios
      .get<FixtureState>(url)
      .then((response) => resolve(response))
      .catch((error) => reject(error));
    setTimeout(() => {
      reject(new Error('Request timeout'));
    }, FETCH_TIMEOUT);
  });

const FIXTURE_SERVER_HOST = 'localhost';
const BROWSERSTACK_LOCALHOST = 'bs-local.com';
const FIXTURE_SERVER_URL = `http://${FIXTURE_SERVER_HOST}:${getFixturesServerPortInApp()}/state.json`;

class ReadOnlyNetworkStore {
  private _initialized: boolean;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _state?: any;
  private _asyncState?: Record<string, string>;

  constructor() {
    this._initialized = false;
    this._state = undefined;
    this._asyncState = undefined;
  }

  // Redux Store
  async getState() {
    await this._initIfRequired();
    return this._state;
  }

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async setState(state: any) {
    if (!state) {
      throw new Error('MetaMask - updated state is missing');
    }
    await this._initIfRequired();
    this._state = state;
  }

  // Async Storage
  async getString(key: string) {
    await this._initIfRequired();
    // The store is only read once the fixture has been loaded.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const value = this._asyncState![key];
    return value !== undefined ? value : null;
  }

  async set(key: string, value: string) {
    await this._initIfRequired();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this._asyncState![key] = value;
  }

  async delete(key: string) {
    await this._initIfRequired();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    delete this._asyncState![key];
  }

  async clearAll() {
    await this._initIfRequired();
    delete this._asyncState;
  }

  async _initIfRequired() {
    if (!this._initialized) {
      await this._init();
    }
  }

  async _init() {
    // List of URLs to check for Fixture Server availability.
    // Browserstack requires that the HOST is bs-local.com instead of localhost.
    const urls = [
      FIXTURE_SERVER_URL,
      FIXTURE_SERVER_URL.replace(FIXTURE_SERVER_HOST, BROWSERSTACK_LOCALHOST),
    ];

    try {
      for (const url of urls) {
        try {
          const response = await fetchWithTimeout(url);
          if (response.status === 200) {
            this._state = response.data?.state;
            this._asyncState = response.data?.asyncState;
            return;
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.debug(`Error loading network state from ${url}: '${error}'`);
          // Continue to next URL if this one failed
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.debug(`Error loading network state: '${error}'`);
    } finally {
      this._initialized = true;
    }
  }
}

export default new ReadOnlyNetworkStore();
