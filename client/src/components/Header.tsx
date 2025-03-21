import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { PlusCircle, PlaySquare } from "lucide-react";

export default function Header() {
  const [location, navigate] = useLocation();
  
  const isAddCoursePage = location === "/add-course";
  
  const handleAddCourseClick = () => {
    navigate("/add-course");
  };
  
  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <PlaySquare className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-medium">YT Courses</h1>
          </div>
        </Link>
        <div>
          {!isAddCoursePage && (
            <Button 
              onClick={handleAddCourseClick}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white rounded-full"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Course
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
