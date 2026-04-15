

class URRegistryDecoder {






  constructor() {
    this.progress = 0;
    this.error = false;
    this.errorMessage = '';
    this.success = false;
    this.ur = null;
  }

  getProgress = () => this.progress;

  receivePart = (content) => {
    // eslint-disable-next-line no-empty
    if (content) {
    }
    // Implementation for receiving a part of the UR
  };

  isError = () => this.error;

  resultError = () => this.errorMessage;

  isSuccess = () => this.success;

  resultUR = () => {
    if (this.ur === null) {
      throw new Error('UR is not available');
    }
    return this.ur;
  };
}

export { URRegistryDecoder };