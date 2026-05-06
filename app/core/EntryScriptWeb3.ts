import Device from '../util/device';
import RNFS from 'react-native-fs';

interface EntryScriptWeb3Interface {
  entryScriptWeb3: string | null;
  init(): Promise<string>;
  get(): Promise<string>;
}

const EntryScriptWeb3: EntryScriptWeb3Interface = {
  entryScriptWeb3: null,
  // Cache InpageBridgeWeb3 so that it is immediately available
  async init(): Promise<string> {
    this.entryScriptWeb3 = Device.isIos()
      ? await RNFS.readFile(
          `${RNFS.MainBundlePath}/InpageBridgeWeb3.js`,
          'utf8',
        )
      : await RNFS.readFileAssets(`InpageBridgeWeb3.js`);

    return this.entryScriptWeb3;
  },
  async get(): Promise<string> {
    // Return from cache
    if (this.entryScriptWeb3) return this.entryScriptWeb3;

    // If for some reason it is not available, get it again
    return await this.init();
  },
};

export default EntryScriptWeb3;
