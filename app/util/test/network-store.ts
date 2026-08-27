import axios from 'axios';
import { getFixturesServerPortInApp } from './utils';

const FETCH_TIMEOUT = 40000; // Timeout in milliseconds

// Configure Axios with CORS headers
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
axios.defaults.headers.common['Access-Control-Allow-Methods'] =
  'GET, POST, PUT, DELETE';
axios.defaults.headers.common['Access-Control-Allow-Headers'] =
  'Origin, X-Requested-With, Content-Type, Accept';

// @ts-expect-error -- legacy JavaScript UI type boundary
const fetchWithTimeout = (url) =>
  new Promise((resolve, reject) => {
    axios
      .get(url)
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
  constructor() {
// @ts-expect-error -- legacy JavaScript UI type boundary
    this._initialized = false;
// @ts-expect-error -- legacy JavaScript UI type boundary
    this._state = undefined;
// @ts-expect-error -- legacy JavaScript UI type boundary
    this._asyncState = undefined;
  }

  // Redux Store
  async getState() {
    await this._initIfRequired();
// @ts-expect-error -- legacy JavaScript UI type boundary
    return this._state;
  }

// @ts-expect-error -- legacy JavaScript UI type boundary
  async setState(state) {
    if (!state) {
      throw new Error('MetaMask - updated state is missing');
    }
    await this._initIfRequired();
// @ts-expect-error -- legacy JavaScript UI type boundary
    this._state = state;
  }

  // Async Storage
// @ts-expect-error -- legacy JavaScript UI type boundary
  async getString(key) {
    await this._initIfRequired();
// @ts-expect-error -- legacy JavaScript UI type boundary
    const value = this._asyncState[key];
    return value !== undefined ? value : null;
  }

// @ts-expect-error -- legacy JavaScript UI type boundary
  async set(key, value) {
    await this._initIfRequired();
// @ts-expect-error -- legacy JavaScript UI type boundary
    this._asyncState[key] = value;
  }

// @ts-expect-error -- legacy JavaScript UI type boundary
  async delete(key) {
    await this._initIfRequired();
// @ts-expect-error -- legacy JavaScript UI type boundary
    delete this._asyncState[key];
  }

  async clearAll() {
    await this._initIfRequired();
// @ts-expect-error -- legacy JavaScript UI type boundary
    delete this._asyncState;
  }

  async _initIfRequired() {
// @ts-expect-error -- legacy JavaScript UI type boundary
    if (!this._initialized) {
      await this._init();
    }
  }

  async _init() {
    // List of URLs to check for Fixture Server availability.
    // Browserstack requires that the HOST is bs-local.com instead of localhost.
    const urls = [
      FIXTURE_SERVER_URL,
      FIXTURE_SERVER_URL.replace(FIXTURE_SERVER_HOST, BROWSERSTACK_LOCALHOST)
    ];

    try {
      for (const url of urls) {
        try {
          const response = await fetchWithTimeout(url);
// @ts-expect-error -- legacy JavaScript UI type boundary
          if (response.status === 200) {
// @ts-expect-error -- legacy JavaScript UI type boundary
            this._state = response.data?.state;
// @ts-expect-error -- legacy JavaScript UI type boundary
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
// @ts-expect-error -- legacy JavaScript UI type boundary
      this._initialized = true;
    }
  }
}

export default new ReadOnlyNetworkStore();
