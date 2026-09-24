/**
 * Bounded LRU cache for identical grammar-correction inputs. Results for the
 * same normalized text are served from memory instead of re-running expensive
 * ONNX inference.
 */
export class LruCache {
  constructor({ maxEntries = 100 } = {}) {
    this.maxEntries = maxEntries;
    this.map = new Map();
  }

  get(key) {
    const value = this.map.get(key);
    if (value === undefined) return undefined;
    // Move to the most-recently-used end.
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.maxEntries) {
      // Evict the least-recently-used entry (Map preserves insertion order).
      this.map.delete(this.map.keys().next().value);
    }
  }

  has(key) {
    return this.map.has(key);
  }
}