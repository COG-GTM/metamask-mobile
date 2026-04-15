export class FetchError extends Error {

  constructor(message, url) {
    super(message);
    this.url = url;
  }
}