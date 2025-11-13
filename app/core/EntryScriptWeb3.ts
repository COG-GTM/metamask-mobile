import Device from '../util/device';
import RNFS from 'react-native-fs';

interface EntryScriptWeb3Type {
  entryScriptWeb3: string | null;
  init(): Promise<string>;
  get(): Promise<string>;
}

const EntryScriptWeb3: EntryScriptWeb3Type = {
  entryScriptWeb3: null,
  async init() {
    this.entryScriptWeb3 = Device.isIos()
      ? await RNFS.readFile(
          `${RNFS.MainBundlePath}/InpageBridgeWeb3.js`,
          'utf8',
        )
      : await RNFS.readFileAssets(`InpageBridgeWeb3.js`);

    return this.entryScriptWeb3;
  },
  async get() {
    if (this.entryScriptWeb3) return this.entryScriptWeb3;

    return await this.init();
  },
};

export default EntryScriptWeb3;
