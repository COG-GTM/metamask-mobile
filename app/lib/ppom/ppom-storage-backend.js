import { MMKV } from 'react-native-mmkv';


import { getArrayBufferForBlob } from 'react-native-blob-jsi-helper';








// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (window.FileReader?.prototype.readAsArrayBuffer) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.FileReader.prototype.readAsArrayBuffer = function (blob) {
    if (this.readyState === this.LOADING) throw new Error('InvalidStateError');
    this._setReadyState(this.LOADING);
    this._result = null;
    this._error = null;
    this._result = getArrayBufferForBlob(blob);
    this._setReadyState(this.DONE);
  };
}

class RNFSStorageBackend {


  constructor(basePath) {
    this.storage = new MMKV({ id: basePath });
  }

  _getDataFilePath(key) {
    return `${key.name}-${key.chainId}`;
  }

  async read(key, _checksum) {
    let data;
    try {
      data = this.storage.getBuffer(this._getDataFilePath(key));
    } catch (error) {
      throw new Error(`Error reading data: ${error}`);
    }

    if (!data) {
      throw new Error('No data found');
    }

    return data;
  }

  async write(
  key,
  data,
  _checksum)
  {
    const dataArray = new Uint8Array(data);
    this.storage.set(this._getDataFilePath(key), dataArray);
  }

  async delete(key) {
    try {
      this.storage.delete(this._getDataFilePath(key));
    } catch (error) {
      throw new Error(`Error deleting data: ${error}`);
    }
  }

  async dir() {
    const allKeys = this.storage.getAllKeys();
    const storageKeys = [];
    for (const key of allKeys) {
      const [name, chainId] = key.split('-');
      storageKeys.push({ name, chainId });
    }
    return storageKeys;
  }
}

export default RNFSStorageBackend;