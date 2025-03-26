import { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import { useCourses } from '../contexts/CoursesContext';
import { getCourseFromPlaylist, extractPlaylistId } from '../lib/youtube';

// Form schema with validation
const formSchema = z.object({
  playlistUrl: z.string()
    .min(1, 'Playlist URL is required')
    .refine((url) => extractPlaylistId(url) !== null, {
      message: 'Invalid YouTube playlist URL'
    }),
  customTitle: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

export default function AddCourse() {
  const { addCourse } = useCourses();
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playlistUrl: '',
      customTitle: ''
    }
  });
  
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get course data from YouTube API
      const course = await getCourseFromPlaylist(data.playlistUrl, data.customTitle);
      
      // Add course to database
      const success = await addCourse(course);
      
      if (success) {
        // Navigate to the course page
        setLocation(`/course/${course.id}`);
      } else {
        setError('This course has already been added');
      }
    } catch (err) {
      console.error('Error adding course:', err);
      setError(err instanceof Error ? err.message : 'Failed to add course');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 container py-8 mx-auto">
        <div className="mx-auto max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold">Add New Course</h1>
            <p className="text-muted-foreground mt-2">
              Turn any YouTube playlist into a structured course
            </p>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-destructive/15 text-destructive p-4 rounded-lg mb-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Playlist URL field */}
            <div className="space-y-2">
              <label htmlFor="playlistUrl" className="text-sm font-medium leading-none">
                YouTube Playlist URL <span className="text-destructive">*</span>
              </label>
              <input
                id="playlistUrl"
                type="text"
                className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ${
                  errors.playlistUrl ? 'border-destructive' : ''
                }`}
                placeholder="https://www.youtube.com/playlist?list=PLxxxxxx"
                {...register('playlistUrl')}
              />
              {errors.playlistUrl && (
                <p className="text-sm text-destructive">{errors.playlistUrl.message}</p>
              )}
            </div>
            
            {/* Custom title field */}
            <div className="space-y-2">
              <label htmlFor="customTitle" className="text-sm font-medium leading-none">
                Custom Title (Optional)
              </label>
              <input
                id="customTitle"
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                placeholder="Enter a custom title for this course"
                {...register('customTitle')}
              />
              <p className="text-xs text-muted-foreground">
                If left empty, the original playlist title will be used
              </p>
            </div>
            
            {/* Form buttons */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="rounded-md px-4 py-2 text-sm border hover:bg-accent transition-colors"
                onClick={() => setLocation('/')}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 transition-colors flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fetching playlist...
                  </>
                ) : (
                  'Add Course'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}