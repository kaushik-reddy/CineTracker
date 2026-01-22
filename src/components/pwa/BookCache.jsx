// IndexedDB Book Cache Manager
const DB_NAME = 'CineTrackerBooks';
const DB_VERSION = 1;
const STORE_NAME = 'books';

class BookCacheManager {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async cacheBook(bookData) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const bookCache = {
        id: bookData.id,
        title: bookData.title,
        author: bookData.author,
        total_pages: bookData.total_pages,
        poster_url: bookData.poster_url,
        pdf_url: bookData.pdf_url,
        pages_read: bookData.pages_read,
        page_illustrations: bookData.page_illustrations || [],
        cached_at: Date.now(),
        last_accessed: Date.now()
      };

      const request = store.put(bookCache);
      request.onsuccess = () => resolve(bookCache);
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedBook(bookId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(bookId);

      request.onsuccess = () => {
        if (request.result) {
          // Update last accessed time
          this.updateLastAccessed(bookId);
        }
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateLastAccessed(bookId) {
    await this.init();
    const book = await this.getCachedBook(bookId);
    if (book) {
      book.last_accessed = Date.now();
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(book);
    }
  }

  async updateReadingProgress(bookId, pagesRead) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(bookId);

      request.onsuccess = () => {
        const book = request.result;
        if (book) {
          book.pages_read = pagesRead;
          book.last_accessed = Date.now();
          const updateRequest = store.put(book);
          updateRequest.onsuccess = () => resolve(book);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Book not found in cache'));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCachedBooks() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async isCached(bookId) {
    const book = await this.getCachedBook(bookId);
    return !!book;
  }

  async removeCachedBook(bookId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(bookId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearCache() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const bookCache = new BookCacheManager();

// React Hook for book cache
import React from 'react';

export function useBookCache(bookId) {
  const [cached, setCached] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (bookId) {
      checkCache();
    }
  }, [bookId]);

  const checkCache = async () => {
    try {
      const isCached = await bookCache.isCached(bookId);
      setCached(isCached);
    } catch (error) {
      console.error('Cache check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const cacheBook = async (bookData) => {
    try {
      await bookCache.cacheBook(bookData);
      setCached(true);
      return true;
    } catch (error) {
      console.error('Failed to cache book:', error);
      return false;
    }
  };

  const removeFromCache = async () => {
    try {
      await bookCache.removeCachedBook(bookId);
      setCached(false);
      return true;
    } catch (error) {
      console.error('Failed to remove from cache:', error);
      return false;
    }
  };

  return { cached, loading, cacheBook, removeFromCache };
}