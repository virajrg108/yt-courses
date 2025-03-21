import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Course, VideoProgress } from '@/types';

interface YTCoursesDB extends DBSchema {
  courses: {
    key: string;
    value: Course;
    indexes: { 'by-created': string };
  };
  videoProgress: {
    key: string;
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
        const coursesStore = db.createObjectStore('courses', { keyPath: 'id' });
        coursesStore.createIndex('by-created', 'createdAt');

        // Create videoProgress store
        const progressStore = db.createObjectStore('videoProgress', { 
          keyPath: 'videoId' 
        });
        progressStore.createIndex('by-course', 'courseId');
        progressStore.createIndex('by-video', 'videoId');
      },
    });
  }

  // Courses CRUD operations
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
    await db.delete('courses', id);
    
    // Delete all related video progress
    const progressItems = await this.getVideoProgressByCourse(id);
    const tx = db.transaction('videoProgress', 'readwrite');
    for (const item of progressItems) {
      await tx.store.delete(item.videoId);
    }
    await tx.done;
  }

  async getAllCourses(): Promise<Course[]> {
    const db = await this.db;
    return db.getAllFromIndex('courses', 'by-created');
  }

  // Video progress operations
  async updateVideoProgress(progress: VideoProgress): Promise<void> {
    const db = await this.db;
    const key = progress.videoId;
    
    // Check if progress already exists
    const existingProgress = await db.get('videoProgress', key);
    
    if (existingProgress) {
      // Update existing progress
      await db.put('videoProgress', {
        ...existingProgress,
        ...progress,
        lastWatched: new Date().toISOString()
      });
    } else {
      // Create new progress entry
      await db.put('videoProgress', {
        ...progress,
        lastWatched: new Date().toISOString()
      });
    }
  }

  async getVideoProgress(videoId: string, courseId: string): Promise<VideoProgress | undefined> {
    const db = await this.db;
    return db.get('videoProgress', videoId);
  }

  async getVideoProgressByCourse(courseId: string): Promise<VideoProgress[]> {
    const db = await this.db;
    const index = db.transaction('videoProgress').store.index('by-course');
    return index.getAll(courseId);
  }

  async getAllVideoProgress(): Promise<VideoProgress[]> {
    const db = await this.db;
    return db.getAll('videoProgress');
  }
}

export const db = new Database();
