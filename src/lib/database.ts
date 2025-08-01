// IndexedDB wrapper for privacy-first data storage

// --- INTERFACES ---

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
  duration: number; // in milliseconds
  points: number;
}

export interface VitalityEntry {
  id:string;
  date: string; // YYYY-MM-DD format
  bonusId: string;
  completed: boolean;
}

// [NEW] Interface for daily tasks
export interface DailyTask {
  id: string;
  date: string; // YYYY-MM-DD format
  name: string;
  priority: 'High' | 'Medium' | 'Low';
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

// --- DEFAULTS ---

export const defaultCategories: ActivityCategory[] = [
  { id: 'deep-work', name: 'Deep Work', points: 3, color: '#3B82F6', description: 'Focused, cognitively demanding work' },
  { id: 'shallow-work', name: 'Shallow Work', points: 1, color: '#8B5CF6', description: 'Administrative and logistical tasks' },
  { id: 'learning', name: 'Learning', points: 2, color: '#06B6D4', description: 'Skill development and education' },
  { id: 'meetings', name: 'Meetings', points: 1, color: '#F59E0B', description: 'Collaborative discussions and calls' },
  { id: 'personal-care', name: 'Personal Care', points: 1, color: '#10B981', description: 'Health, wellness, and self-care activities' },
  { id: 'distraction', name: 'Distraction', points: -1, color: '#EF4444', description: 'Social media, mindless browsing, etc.' }
];

export const defaultVitalityBonuses: VitalityBonus[] = [
  { id: 'sleep', name: 'Quality Sleep', points: 5, description: '7+ hours of restful sleep' },
  { id: 'exercise', name: 'Exercise', points: 5, description: 'Physical activity or workout' },
  { id: 'meditation', name: 'Meditation', points: 3, description: 'Mindfulness or meditation practice' },
  { id: 'planning', name: 'Daily Planning', points: 2, description: 'Setting intentions and planning the day' }
];

// --- DATABASE MANAGER CLASS ---

class DatabaseManager {
  private dbName = 'DailyEffectivenessLogger';
  // [UPDATED] Incremented version to trigger onupgradeneeded
  private version = 2;
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

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('categories')) db.createObjectStore('categories', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('vitality')) db.createObjectStore('vitality', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('activities')) {
            const activitiesStore = db.createObjectStore('activities', { keyPath: 'id' });
            activitiesStore.createIndex('date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('vitalityEntries')) {
            const vitalityEntriesStore = db.createObjectStore('vitalityEntries', { keyPath: 'id' });
            vitalityEntriesStore.createIndex('date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('goals')) {
            const goalsStore = db.createObjectStore('goals', { keyPath: 'id' });
            goalsStore.createIndex('date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('metrics')) db.createObjectStore('metrics', { keyPath: 'date' });

        // [NEW] Create tasks object store
        if (!db.objectStoreNames.contains('tasks')) {
            const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
            tasksStore.createIndex('date', 'date', { unique: false });
        }
      };
    });
  }

  async initializeDefaultData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const categoriesCount = await this.getCount('categories');
    if (categoriesCount === 0) {
      for (const category of defaultCategories) {
        await this.addCategory(category);
      }
    }
    const vitalityCount = await this.getCount('vitality');
    if (vitalityCount === 0) {
      for (const bonus of defaultVitalityBonuses) {
        await this.addVitalityBonus(bonus);
      }
    }
  }

  private async getFromStore<T>(storeName: string): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  private async writeToStore<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
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

  private async getByDate<T>(storeName: string, date: string): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index('date');
        const request = index.getAll(date);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
  }

  private async deleteFromStore(storeName: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
  }

  // Generic Getters
  async getCategories(): Promise<ActivityCategory[]> { return this.getFromStore('categories'); }
  async getVitalityBonuses(): Promise<VitalityBonus[]> { return this.getFromStore('vitality'); }

  // Generic Adders/Updaters
  async addCategory(category: ActivityCategory): Promise<void> { await this.writeToStore('categories', category); }
  async addVitalityBonus(bonus: VitalityBonus): Promise<void> { await this.writeToStore('vitality', bonus); }
  
  // Activity Methods
  async addActivity(activity: ActivityLog): Promise<void> { await this.writeToStore('activities', activity); }
  async updateActivity(activity: ActivityLog): Promise<void> { await this.writeToStore('activities', activity); }
  async getActivitiesByDate(date: string): Promise<ActivityLog[]> { return this.getByDate('activities', date); }
  async deleteActivity(id: string): Promise<void> { await this.deleteFromStore('activities', id); }

  // Vitality Entry Methods
  async addVitalityEntry(entry: VitalityEntry): Promise<void> { await this.writeToStore('vitalityEntries', entry); }
  async updateVitalityEntry(entry: VitalityEntry): Promise<void> { await this.writeToStore('vitalityEntries', entry); }
  async getVitalityEntriesByDate(date: string): Promise<VitalityEntry[]> { return this.getByDate('vitalityEntries', date); }

  // [NEW] Task Methods
  async addTask(task: DailyTask): Promise<void> { await this.writeToStore('tasks', task); }
  async updateTask(task: DailyTask): Promise<void> { await this.writeToStore('tasks', task); }
  async getTasksByDate(date: string): Promise<DailyTask[]> { return this.getByDate('tasks', date); }
  async deleteTask(id: string): Promise<void> { await this.deleteFromStore('tasks', id); }
}

export const db = new DatabaseManager();
