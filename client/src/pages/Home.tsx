import React from 'react';
import { useLocation } from 'wouter';
import { useCourses } from '../contexts/CoursesContext';
import CourseCard from '../components/CourseCard';
import { Skeleton } from '../components/ui/skeleton';
import { PlaySquare, PlusCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Home() {
  const { courses, isLoading } = useCourses();
  const [_, navigate] = useLocation();
  
  const handleCourseClick = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-medium mb-2">My Courses</h2>
        <p className="text-gray-600">Continue learning where you left off</p>
      </div>
      
      {isLoading ? (
        // Loading skeleton
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <Skeleton className="w-full h-48" />
              <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : courses.length > 0 ? (
        // Display courses grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard 
              key={course.id}
              course={course}
              onClick={handleCourseClick}
            />
          ))}
        </div>
      ) : (
        // Empty state
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <PlaySquare className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium mb-2">No courses yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Add your first YouTube playlist to start tracking your learning progress
          </p>
          <Button 
            onClick={() => navigate('/add-course')}
            className="bg-primary hover:bg-primary/90"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Your First Course
          </Button>
        </div>
      )}
    </div>
  );
}


