import axios, { type AxiosResponse } from 'axios';
import { getFixturesServerPortInApp } from './utils';

const FETCH_TIMEOUT = 40000; // Timeout in milliseconds

interface FixtureState {
  state?: unknown;
  asyncState?: Record<string, string>;
}

// Configure Axios with CORS headers
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
axios.defaults.headers.common['Access-Control-Allow-Methods'] =
  'GET, POST, PUT, DELETE';
axios.defaults.headers.common['Access-Control-Allow-Headers'] =
  'Origin, X-Requested-With, Content-Type, Accept';

const fetchWithTimeout = (url: string): Promise<AxiosResponse<FixtureState>> =>
  new Promise((resolve, reject) => {
    axios
      .get<FixtureState>(url)
      .then((response) => resolve(response))
      .catch((error: unknown) => reject(error));
    setTimeout(() => {
      reject(new Error('Request timeout'));
    }, FETCH_TIMEOUT);
  });

const FIXTURE_SERVER_HOST = 'localhost';
const BROWSERSTACK_LOCALHOST = 'bs-local.com';
const FIXTURE_SERVER_URL = `http://${FIXTURE_SERVER_HOST}:${getFixturesServerPortInApp()}/state.json`;

class ReadOnlyNetworkStore {
  private _initialized = false;
  private _state: unknown;
  private _asyncState?: Record<string, string>;

  // Redux Store
  async getState(): Promise<unknown> {
    await this._initIfRequired();
    return this._state;
  }

  async setState(state: unknown): Promise<void> {
    if (!state) {
      throw new Error('MetaMask - updated state is missing');
    }
    await this._initIfRequired();
    this._state = state;
  }

  // Async Storage
  async getString(key: string): Promise<string | null> {
    await this._initIfRequired();
    const value = this._getAsyncState()[key];
    return value !== undefined ? value : null;
  }

  async set(key: string, value: string): Promise<void> {
    await this._initIfRequired();
    this._getAsyncState()[key] = value;
  }

  async delete(key: string): Promise<void> {
    await this._initIfRequired();
    delete this._getAsyncState()[key];
  }

  private _getAsyncState(): Record<string, string> {
    if (!this._asyncState) {
      throw new Error('MetaMask - async state is missing');
    }
    return this._asyncState;
  }

  async clearAll(): Promise<void> {
    await this._initIfRequired();
    delete this._asyncState;
  }

  async _initIfRequired(): Promise<void> {
    if (!this._initialized) {
      await this._init();
    }
  }

  async _init(): Promise<void> {
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
        } catch (error: unknown) {
          // eslint-disable-next-line no-console
          console.debug(`Error loading network state from ${url}: '${error}'`);
          // Continue to next URL if this one failed
        }
      }
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.debug(`Error loading network state: '${error}'`);
    } finally {
      this._initialized = true;
    }
  }
}

export default new ReadOnlyNetworkStore();
