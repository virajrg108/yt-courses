import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { BookOpen, Plus, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import CourseCard from '../components/CourseCard';
import { useCourses } from '../contexts/CoursesContext';
import { CourseWithProgress } from '../types';

export default function Home() {
  const [location, setLocation] = useLocation();
  const { courses, isLoading, refreshCourses } = useCourses();
  const [sortedCourses, setSortedCourses] = useState<CourseWithProgress[]>([]);
  
  // Sort courses by last watched (most recent first)
  useEffect(() => {
    const sorted = [...courses].sort((a, b) => {
      // If both have lastWatched, sort by date (most recent first)
      if (a.lastWatched && b.lastWatched) {
        return new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime();
      }
      
      // If only a has lastWatched, a comes first
      if (a.lastWatched) return -1;
      
      // If only b has lastWatched, b comes first
      if (b.lastWatched) return 1;
      
      // If neither has lastWatched, sort by created date (most recent first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    setSortedCourses(sorted);
  }, [courses]);
  
  // Refresh courses on component mount
  useEffect(() => {
    refreshCourses();
  }, [refreshCourses]);
  
  const handleAddCourse = () => {
    setLocation('/add-course');
  };
  
  const handleCourseClick = (courseId: string) => {
    setLocation(`/course/${courseId}`);
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 container py-6 mx-auto">
        {/* Add course button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Courses</h1>
          <button
            onClick={handleAddCourse}
            className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Course
          </button>
        </div>
        
        {/* Course grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : sortedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCourses.map(course => (
              <CourseCard 
                key={course.id} 
                course={course} 
                onClick={handleCourseClick}
              />
            ))}
          </div>
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No courses yet</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Add your first course by clicking the "Add Course" button and pasting a YouTube playlist URL.
            </p>
            <button
              onClick={handleAddCourse}
              className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Your First Course
            </button>
          </div>
        )}
      </main>
    </div>
  );
}