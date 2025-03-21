import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useCourses } from '../contexts/CoursesContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ArrowLeft, Link2, PlusCircle, AlertCircle, Loader2, Clock, ListVideo } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Course } from '../types';
import { formatDuration, getCourseFromPlaylist, extractPlaylistId } from '../lib/youtube';

const formSchema = z.object({
  playlistUrl: z.string()
    .url({ message: 'Please enter a valid URL' })
    .refine(
      (url) => url.includes('youtube.com') || url.includes('youtu.be'), 
      { message: 'Must be a YouTube URL' }
    )
    .refine(
      (url) => !!extractPlaylistId(url),
      { message: 'Must be a valid YouTube playlist URL with a list parameter' }
    ),
  customTitle: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function AddCourse() {
  const [_, navigate] = useLocation();
  const { addCourse } = useCourses();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coursePreview, setCoursePreview] = useState<Course | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playlistUrl: '',
      customTitle: '',
    },
  });
  
  const handleBackClick = () => {
    navigate('/');
  };
  
  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch playlist data
      const course = await getCourseFromPlaylist(data.playlistUrl, data.customTitle);
      setCoursePreview(course);
      
      // Automatically add course after preview is shown
      const success = await addCourse(course);
      if (success) {
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching playlist:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch playlist information');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <button 
          className="mr-3 text-gray-600 hover:text-primary"
          onClick={handleBackClick}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-medium">Add New Course</h2>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <p className="text-gray-600 mb-6">
            Enter a YouTube playlist URL to add it as a course. YT Courses will automatically fetch the playlist details 
            and add it to your courses library.
          </p>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="playlistUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube Playlist URL</FormLabel>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Link2 className="h-4 w-4 text-gray-400" />
                      </div>
                      <FormControl>
                        <Input 
                          placeholder="https://www.youtube.com/playlist?list=PLWKjhJtqVAbnRT_hue-3zyiuIYj0OlsyK" 
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <p className="text-sm text-gray-500">
                      Paste the full URL of a YouTube playlist
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Course Name (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Leave empty to use the original playlist title" 
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between items-center mt-6">
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={handleBackClick}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Course
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
          
          {/* Loading state */}
          {isLoading && (
            <div className="mt-6 flex items-center justify-center p-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3"></div>
              <p>Fetching playlist information...</p>
            </div>
          )}
          
          {/* Preview */}
          {coursePreview && (
            <div className="mt-6 border-t pt-6">
              <h3 className="font-medium text-lg mb-4">Course Preview</h3>
              <div className="flex">
                <img 
                  src={coursePreview.thumbnail} 
                  alt="Playlist thumbnail" 
                  className="w-24 h-16 object-cover rounded-md mr-4"
                />
                <div>
                  <h4 className="font-medium">{coursePreview.customTitle || coursePreview.title}</h4>
                  <p className="text-sm text-gray-600">by {coursePreview.channelTitle}</p>
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <ListVideo className="h-3 w-3 mr-1" />
                    <span>{coursePreview.videos.length} videos</span>
                    <span className="mx-2">•</span>
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      {formatDuration(
                        coursePreview.videos.reduce((total, video) => total + video.duration, 0)
                      )} total length
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


