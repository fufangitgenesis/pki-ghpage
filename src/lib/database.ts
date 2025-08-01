// IndexedDB wrapper for privacy-first data storage
export interface ActivityCategory {
  id: string;
  name: string;
  points: number;
  color: string;
  description: string;
}

export interface VitalityBonus {
  id: string;
  name: string;
  points: number;
  description: string;
}

export interface ActivityLog {
  id: string;
  name: string;
  categoryId: string;
  startTime: Date;
  endTime: Date;
  date: string; // YYYY-MM-DD format
  energyLevel: 'High' | 'Medium' | 'Low';
  duration: number; // in minutes
  points: number;
}

export interface VitalityEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  bonusId: string;
  completed: boolean;
}

export interface DailyGoal {
  id: string;
  date: string; // YYYY-MM-DD format
  categoryId: string;
  targetMinutes: number;
}

export interface DailyMetrics {
  date: string;
  totalScore: number;
  focusRatio: number;
  distractionRatio: number;
  productivityThroughput: number;
  totalTimeLogged: number;
}

// Default activity categories
export const defaultCategories: ActivityCategory[] = [
  {
    id: 'deep-work',
    name: 'Deep Work',
    points: 3,
    color: '#3B82F6', // Primary blue
    description: 'Focused, cognitively demanding work'
  },
  {
    id: 'shallow-work',
    name: 'Shallow Work',
    points: 1,
    color: '#8B5CF6', // Secondary purple
    description: 'Administrative and logistical tasks'
  },
  {
    id: 'learning',
    name: 'Learning',
    points: 2,
    color: '#06B6D4', // Accent teal
    description: 'Skill development and education'
  },
  {
    id: 'meetings',
    name: 'Meetings',
    points: 1,
    color: '#F59E0B', // Warning orange
    description: 'Collaborative discussions and calls'
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    points: 1,
    color: '#10B981', // Success green
    description: 'Health, wellness, and self-care activities'
  },
  {
    id: 'distraction',
    name: 'Distraction',
    points: -1,
    color: '#EF4444', // Destructive red
    description: 'Social media, mindless browsing, etc.'
  }
];

// Default vitality bonuses
export const defaultVitalityBonuses: VitalityBonus[] = [
  {
    id: 'sleep',
    name: 'Quality Sleep',
    points: 5,
    description: '7+ hours of restful sleep'
  },
  {
    id: 'exercise',
    name: 'Exercise',
    points: 5,
    description: 'Physical activity or workout'
  },
  {
    id: 'meditation',
    name: 'Meditation',
    points: 3,
    description: 'Mindfulness or meditation practice'
  },
  {
    id: 'planning',
    name: 'Daily Planning',
    points: 2,
    description: 'Setting intentions and planning the day'
  }
];

class DatabaseManager {
  private dbName = 'DailyEffectivenessLogger';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        const categoriesStore = db.createObjectStore('categories', { keyPath: 'id' });
        const vitalityStore = db.createObjectStore('vitality', { keyPath: 'id' });
        const activitiesStore = db.createObjectStore('activities', { keyPath: 'id' });
        const vitalityEntriesStore = db.createObjectStore('vitalityEntries', { keyPath: 'id' });
        const goalsStore = db.createObjectStore('goals', { keyPath: 'id' });
        const metricsStore = db.createObjectStore('metrics', { keyPath: 'date' });

        // Create indexes
        activitiesStore.createIndex('date', 'date', { unique: false });
        activitiesStore.createIndex('categoryId', 'categoryId', { unique: false });
        vitalityEntriesStore.createIndex('date', 'date', { unique: false });
        goalsStore.createIndex('date', 'date', { unique: false });
      };
    });
  }

  async initializeDefaultData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check if categories already exist
    const categoriesCount = await this.getCount('categories');
    if (categoriesCount === 0) {
      for (const category of defaultCategories) {
        await this.addCategory(category);
      }
    }

    // Check if vitality bonuses already exist
    const vitalityCount = await this.getCount('vitality');
    if (vitalityCount === 0) {
      for (const bonus of defaultVitalityBonuses) {
        await this.addVitalityBonus(bonus);
      }
    }
  }

  private async getCount(storeName: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Category methods
  async getCategories(): Promise<ActivityCategory[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['categories'], 'readonly');
      const store = transaction.objectStore('categories');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async addCategory(category: ActivityCategory): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['categories'], 'readwrite');
      const store = transaction.objectStore('categories');
      const request = store.add(category);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Vitality methods
  async getVitalityBonuses(): Promise<VitalityBonus[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['vitality'], 'readonly');
      const store = transaction.objectStore('vitality');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async addVitalityBonus(bonus: VitalityBonus): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['vitality'], 'readwrite');
      const store = transaction.objectStore('vitality');
      const request = store.add(bonus);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Activity methods
  async addActivity(activity: ActivityLog): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['activities'], 'readwrite');
      const store = transaction.objectStore('activities');
      const request = store.add(activity);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getActivitiesByDate(date: string): Promise<ActivityLog[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['activities'], 'readonly');
      const store = transaction.objectStore('activities');
      const index = store.index('date');
      const request = index.getAll(date);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async updateActivity(activity: ActivityLog): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['activities'], 'readwrite');
      const store = transaction.objectStore('activities');
      const request = store.put(activity);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async deleteActivity(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['activities'], 'readwrite');
      const store = transaction.objectStore('activities');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Vitality entry methods
  async addVitalityEntry(entry: VitalityEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['vitalityEntries'], 'readwrite');
      const store = transaction.objectStore('vitalityEntries');
      const request = store.add(entry);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getVitalityEntriesByDate(date: string): Promise<VitalityEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['vitalityEntries'], 'readonly');
      const store = transaction.objectStore('vitalityEntries');
      const index = store.index('date');
      const request = index.getAll(date);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async updateVitalityEntry(entry: VitalityEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['vitalityEntries'], 'readwrite');
      const store = transaction.objectStore('vitalityEntries');
      const request = store.put(entry);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Get activities in date range
  async getActivitiesInRange(startDate: string, endDate: string): Promise<ActivityLog[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['activities'], 'readonly');
      const store = transaction.objectStore('activities');
      const index = store.index('date');
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Get vitality entries in date range
  async getVitalityEntriesInRange(startDate: string, endDate: string): Promise<VitalityEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['vitalityEntries'], 'readonly');
      const store = transaction.objectStore('vitalityEntries');
      const index = store.index('date');
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Get all activities for analytics
  async getAllActivitiesForAnalytics(): Promise<ActivityLog[]> {
    return this.getAllActivities();
  }

  // Export data
  async exportData(): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const data = {
      categories: await this.getCategories(),
      vitality: await this.getVitalityBonuses(),
      activities: await this.getAllActivities(),
      vitalityEntries: await this.getAllVitalityEntries(),
      exportDate: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }

  private async getAllActivities(): Promise<ActivityLog[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['activities'], 'readonly');
      const store = transaction.objectStore('activities');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  private async getAllVitalityEntries(): Promise<VitalityEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['vitalityEntries'], 'readonly');
      const store = transaction.objectStore('vitalityEntries');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stores = ['activities', 'vitalityEntries', 'goals', 'metrics'];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(stores, 'readwrite');
      
      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === stores.length) resolve();
      };

      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = checkComplete;
      });
    });
  }
}

export const db = new DatabaseManager();