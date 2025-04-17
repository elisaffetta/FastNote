
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Mic, MicOff, Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import NoteList from "@/components/NoteList";
import VoiceRecorder from "@/components/VoiceRecorder";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Index = () => {
  const navigate = useNavigate();
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState<string | undefined>();
  
  const handleRecordingComplete = (blob: Blob, transcription?: string) => {
    console.log("Recording completed:", blob);
    console.log("Transcription:", transcription);
    
    // Store the transcription but don't navigate yet
    setCurrentTranscription(transcription);
  };
  
  // Function to create a new note with the current transcription
  const createNoteWithTranscription = () => {
    // Close the quick record sheet
    setIsQuickRecordOpen(false);
    
    // If we have a transcription, create a new note with it
    if (currentTranscription) {
      // Navigate to new note with transcription as content
      setTimeout(() => navigate("/note/new?content=" + encodeURIComponent(currentTranscription)), 500);
    } else {
      // Just navigate to new note
      setTimeout(() => navigate("/note/new"), 500);
    }
    
    // Reset the current transcription
    setCurrentTranscription(undefined);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Your Notes</h1>
          <p className="text-muted-foreground">Capture your thoughts with voice or text</p>
        </div>
        
        <NoteList />
        
        {/* Quick Record Sheet */}
        <Sheet open={isQuickRecordOpen} onOpenChange={setIsQuickRecordOpen}>
          <SheetTrigger asChild>
            <motion.div 
              className="fixed bottom-8 left-8 md:bottom-8 md:left-8"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button 
                variant="outline" 
                size="lg" 
                className="rounded-full w-14 h-14 shadow-lg bg-accent text-accent-foreground"
              >
                <Mic className="h-6 w-6" />
              </Button>
            </motion.div>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[400px] rounded-t-3xl px-0">
            <div className="flex flex-col items-center justify-center h-full p-6 space-y-6">
              <h2 className="text-2xl font-bold">Quick Voice Note</h2>
              <VoiceRecorder 
                onRecordingComplete={handleRecordingComplete}
                autoTranscribe={true}
                language="ru" // Default to Russian language
                recordingLimit={120} // 2 minutes max recording
              />
              
              {currentTranscription && (
                <div className="mt-4 w-full">
                  <div className="bg-muted/50 p-3 rounded-md mb-4 max-h-[100px] overflow-y-auto">
                    <p className="text-sm">{currentTranscription}</p>
                  </div>
                  
                  <Button 
                    onClick={createNoteWithTranscription}
                    className="w-full"
                    size="lg"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Создать заметку
                  </Button>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground max-w-md text-center">
                {!currentTranscription 
                  ? "Запишите голосовую заметку. После остановки записи вы сможете прослушать её и создать заметку."
                  : "Нажмите 'Создать заметку', чтобы сохранить транскрипцию в новой заметке."}
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
};

export default Index;
