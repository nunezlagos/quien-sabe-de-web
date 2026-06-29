export interface FakeCookie {
  value: string;
}

export class FakeCookies {
  private store = new Map<string, FakeCookie>();

  get(name: string): FakeCookie | undefined {
    return this.store.get(name);
  }

  set(name: string, value: string, _options?: Record<string, unknown>): void {
    this.store.set(name, { value });
  }

  delete(name: string): void {
    this.store.set(name, { value: '' });
  }
}
