import { Switch, Route } from "wouter";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import Home from "./pages/Home";
import CourseDetails from "./pages/CourseDetails";
import VideoPlayer from "./pages/VideoPlayer";
import AddCourse from "./pages/AddCourse";
import Header from "./components/Header";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/course/:id" component={CourseDetails} />
          <Route path="/course/:courseId/video/:videoId" component={VideoPlayer} />
          <Route path="/add-course" component={AddCourse} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Toaster />
    </div>
  );
}

export default App;
