const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const crypto = require('crypto');

const CACHE_DIR = path.join(__dirname, '..', '..', '.cache');
const DEFAULT_TTL = 60; // seconds
const memoryCache = new Map(); // key -> { value, expires }
const tagRegistry = new Map(); // tag -> Set(keys)
const keyRegistry = new Map(); // key -> Set(tags)

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

ensureCacheDir();

const clampTtl = (ttlSeconds) => {
  if (typeof ttlSeconds !== 'number' || Number.isNaN(ttlSeconds) || ttlSeconds <= 0) {
    return DEFAULT_TTL;
  }
  return Math.min(ttlSeconds, 60 * 60 * 24); // max 24h
};

const keyToFilename = (key) => {
  const hash = crypto.createHash('sha1').update(key).digest('hex');
  return path.join(CACHE_DIR, `${hash}.json`);
};

const persistToDisk = async (key, payload) => {
  const filename = keyToFilename(key);
  try {
    await fsp.writeFile(filename, JSON.stringify(payload), 'utf8');
  } catch (error) {
    console.warn('Failed to persist cache entry:', error.message);
  }
};

const loadFromDisk = async (key) => {
  const filename = keyToFilename(key);
  try {
    const content = await fsp.readFile(filename, 'utf8');
    const payload = JSON.parse(content);
    return payload;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Failed to read cache file:', error.message);
    }
    return null;
  }
};

const removeFromDisk = async (key) => {
  const filename = keyToFilename(key);
  try {
    await fsp.unlink(filename);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Failed to delete cache file:', error.message);
    }
  }
};

const isExpired = (entry) => !entry || entry.expires <= Date.now();

const registerKeyTags = (key, tags = []) => {
  if (!tags || tags.length === 0) {
    return;
  }

  const uniqueTags = [...new Set(tags)];
  keyRegistry.set(key, new Set(uniqueTags));

  uniqueTags.forEach(tag => {
    if (!tagRegistry.has(tag)) {
      tagRegistry.set(tag, new Set());
    }
    tagRegistry.get(tag).add(key);
  });
};

const removeKeyFromRegistry = (key) => {
  const tags = keyRegistry.get(key);
  if (!tags) {
    return;
  }

  tags.forEach(tag => {
    const keys = tagRegistry.get(tag);
    if (keys) {
      keys.delete(key);
      if (keys.size === 0) {
        tagRegistry.delete(tag);
      }
    }
  });

  keyRegistry.delete(key);
};

module.exports = {
  get: async (key) => {
    const entry = memoryCache.get(key);
    if (entry && !isExpired(entry)) {
      return entry.value;
    }

    memoryCache.delete(key);

    const diskEntry = await loadFromDisk(key);
    if (diskEntry && !isExpired(diskEntry)) {
      memoryCache.set(key, diskEntry);
      return diskEntry.value;
    }

    if (diskEntry) {
      await removeFromDisk(key);
    }

    return null;
  },

  set: async (key, value, ttlSeconds, options = {}) => {
    const ttl = clampTtl(ttlSeconds);
    const payload = {
      value,
      expires: Date.now() + ttl * 1000
    };

    memoryCache.set(key, payload);
    await persistToDisk(key, payload);
    registerKeyTags(key, options.tags || []);
  },
  del: async (key) => {
    memoryCache.delete(key);
    await removeFromDisk(key);
    removeKeyFromRegistry(key);
  },
  invalidateTags: async (tags = []) => {
    const uniqueTags = [...new Set(tags)].filter(Boolean);
    await Promise.all(uniqueTags.map(async (tag) => {
      const keys = tagRegistry.get(tag);
      if (!keys || keys.size === 0) {
        return;
      }

      await Promise.all([...keys].map(async (key) => {
        memoryCache.delete(key);
        await removeFromDisk(key);
        removeKeyFromRegistry(key);
      }));

      tagRegistry.delete(tag);
    }));
  },
  reset: async () => {
    tagRegistry.clear();
    keyRegistry.clear();
    memoryCache.clear();
    try {
      const files = await fsp.readdir(CACHE_DIR);
      await Promise.all(
        files.map((file) => fsp.unlink(path.join(CACHE_DIR, file)).catch(() => {}))
      );
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('Failed to reset disk cache:', error.message);
      }
    }
  }
};

