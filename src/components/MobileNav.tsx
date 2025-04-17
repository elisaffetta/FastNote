
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  Home, 
  Settings, 
  FileText, 
  PlusCircle,
  HelpCircle
} from "lucide-react";

const MobileNav = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  
  const handleNavigation = (path: string) => {
    setOpen(false);
    navigate(path);
  };
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[250px] sm:w-[300px]">
        <div className="flex flex-col h-full py-6">
          <div className="mb-8 text-xl font-bold">
            <span className="text-primary">Sonic</span> Note Haven
          </div>
          
          <nav className="space-y-1 flex-1">
            <Button 
              variant="ghost" 
              className="w-full justify-start" 
              onClick={() => handleNavigation("/")}
            >
              <Home className="mr-2 h-5 w-5" />
              Home
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start" 
              onClick={() => handleNavigation("/note/new")}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              New Note
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start" 
              onClick={() => handleNavigation("/settings")}
            >
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </Button>
            
            <div className="pt-6 mt-6 border-t">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground" 
              >
                <HelpCircle className="mr-2 h-5 w-5" />
                Help & Support
              </Button>
            </div>
          </nav>
          
          <div className="pt-4 text-xs text-muted-foreground">
            Sonic Note Haven v1.0.0
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
