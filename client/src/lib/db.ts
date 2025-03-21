import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Course, VideoProgress } from '../types';

interface YTCoursesDB extends DBSchema {
  courses: {
    key: string;
    value: Course;
    indexes: { 'by-created': string };
  };
  videoProgress: {
    key: [string, string]; // Composite key: [videoId, courseId]
    value: VideoProgress;
    indexes: { 
      'by-course': string;
      'by-video': string;
    };
  };
}

class Database {
  private db: Promise<IDBPDatabase<YTCoursesDB>>;

  constructor() {
    this.db = this.initDB();
  }

  private async initDB() {
    return openDB<YTCoursesDB>('yt-courses-db', 1, {
      upgrade(db) {
        // Create courses store
        if (!db.objectStoreNames.contains('courses')) {
          const coursesStore = db.createObjectStore('courses', { keyPath: 'id' });
          coursesStore.createIndex('by-created', 'createdAt');
        }

        // Create videoProgress store
        if (!db.objectStoreNames.contains('videoProgress')) {
          const progressStore = db.createObjectStore('videoProgress', { 
            keyPath: ['videoId', 'courseId'] 
          });
          progressStore.createIndex('by-course', 'courseId');
          progressStore.createIndex('by-video', 'videoId');
        }
      }
    });
  }

  async addCourse(course: Course): Promise<void> {
    const db = await this.db;
    await db.put('courses', course);
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const db = await this.db;
    return db.get('courses', id);
  }

  async updateCourse(course: Course): Promise<void> {
    const db = await this.db;
    await db.put('courses', course);
  }

  async deleteCourse(id: string): Promise<void> {
    const db = await this.db;
    
    // Delete the course
    await db.delete('courses', id);
    
    // Delete associated video progress
    const tx = db.transaction('videoProgress', 'readwrite');
    const courseTx = await tx.store.index('by-course').getAll(id);
    
    await Promise.all(
      courseTx.map(progress => {
        // Use IDBKeyRange for composite key
        const keyRange = IDBKeyRange.only([progress.videoId, progress.courseId]);
        return tx.store.delete(keyRange);
      })
    );
    
    await tx.done;
  }

  async getAllCourses(): Promise<Course[]> {
    const db = await this.db;
    return db.getAllFromIndex('courses', 'by-created');
  }

  async updateVideoProgress(progress: VideoProgress): Promise<void> {
    const db = await this.db;
    await db.put('videoProgress', progress);
  }

  async getVideoProgress(videoId: string, courseId: string): Promise<VideoProgress | undefined> {
    const db = await this.db;
    // Use IDBKeyRange to create a composite key
    const keyRange = IDBKeyRange.only([videoId, courseId]);
    return db.get('videoProgress', keyRange);
  }

  async getVideoProgressByCourse(courseId: string): Promise<VideoProgress[]> {
    const db = await this.db;
    return db.getAllFromIndex('videoProgress', 'by-course', courseId);
  }

  async getAllVideoProgress(): Promise<VideoProgress[]> {
    const db = await this.db;
    return db.getAll('videoProgress');
  }
}

export const db = new Database();