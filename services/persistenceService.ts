
export const PersistenceService = {
  save: (key: string, data: any) => {
    localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
  },
  
  load: <T>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    try {
      return JSON.parse(saved) as T;
    } catch {
      return saved as unknown as T;
    }
  },

  // Debounced save for high-frequency updates (XP, Credits)
  debounceTimers: {} as Record<string, ReturnType<typeof setTimeout>>,
  saveDebounced: (key: string, data: any, delay = 1000) => {
    if (PersistenceService.debounceTimers[key]) {
      clearTimeout(PersistenceService.debounceTimers[key]);
    }
    PersistenceService.debounceTimers[key] = setTimeout(() => {
      PersistenceService.save(key, data);
      delete PersistenceService.debounceTimers[key];
    }, delay);
  }
};
