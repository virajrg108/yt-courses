import { Route, Switch } from 'wouter';
import { CoursesProvider } from './contexts/CoursesContext';
import Home from './pages/Home';
import AddCourse from './pages/AddCourse';
import CourseDetails from './pages/CourseDetails';
import VideoPlayer from './pages/VideoPlayer';
import NotFound from './pages/not-found';

function App() {
  return (
    <CoursesProvider>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/add-course" component={AddCourse} />
        <Route path="/course/:id" component={CourseDetails} />
        <Route path="/course/:courseId/video/:videoId" component={VideoPlayer} />
        <Route component={NotFound} />
      </Switch>
    </CoursesProvider>
  );
}

export default App;