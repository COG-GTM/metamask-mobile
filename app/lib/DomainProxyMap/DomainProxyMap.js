

export default class DomainProxyMap extends Map {
  set(key, value) {
    super.set(key, value);
    return this;
  }

  cleanInactiveDomains(activeDomains) {
    for (const domain of this.keys()) {
      if (!activeDomains.includes(domain)) {
        this.delete(domain);
      }
    }
  }

  get [Symbol.toStringTag]() {
    return 'DomainProxyMap';
  }
}