
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  Loader2, 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  Check 
} from "lucide-react";
import { motion } from "framer-motion";
import { useNoteStore } from "@/store/noteStore";

type Message = {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: string;
};

// Mock responses from AI, in real app would be replaced with actual AI integration
const mockResponses = [
  "I've analyzed your note. What specific questions do you have about it?",
  "Based on your note, here are the key points: 1) Meeting planned for Friday 2) Project deadline extended to next month 3) New team member joining next week",
  "I recommend organizing your tasks by priority. Would you like me to help with that?",
  "Here's a summary of your note in bullet points:\n• Important client meeting on Friday\n• Project deadline extension approved\n• Need to prepare documentation by Thursday\n• Budget allocation pending approval",
  "I've identified these action items from your note: 1) Send agenda for Friday's meeting 2) Update project timeline 3) Prepare onboarding materials for new team member",
  "Would you like me to extract the most important dates mentioned in your note?",
];

const ChatWithNote = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getNoteById } = useNoteStore();
  const [note, setNote] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get note data
  useEffect(() => {
    if (id) {
      const foundNote = getNoteById(id);
      if (foundNote) {
        setNote(foundNote);
        // Initialize with a welcome message
        setMessages([
          {
            id: "welcome",
            content: "Hi! I'm your note assistant. How can I help you with this note?",
            sender: "ai",
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        navigate("/");
      }
    }
  }, [id, getNoteById, navigate]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: newMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      // Choose a random mock response
      const responseIndex = Math.floor(Math.random() * mockResponses.length);
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: mockResponses[responseIndex],
        sender: "ai",
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  if (!note) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col">
      <header className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(`/note/${id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Note
        </Button>
        <h1 className="text-xl font-bold">Chat with Note</h1>
        <div className="w-24"></div> {/* Spacer for centering */}
      </header>

      <div className="flex flex-col md:flex-row gap-4 flex-1">
        {/* Note content */}
        <Card className="p-4 md:w-1/3 h-[calc(100vh-8rem)] md:h-auto overflow-hidden flex flex-col">
          <h2 className="text-lg font-semibold mb-2 border-b pb-2">{note.title}</h2>
          <ScrollArea className="flex-1">
            <div className="text-sm whitespace-pre-wrap">{note.content}</div>
          </ScrollArea>
        </Card>

        {/* Chat interface */}
        <div className="flex-1 flex flex-col h-[calc(100vh-8rem)]">
          <ScrollArea className="flex-1 p-4 border rounded-lg mb-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] relative group ${
                    message.sender === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  } p-3 rounded-lg`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {/* Message actions */}
                    {message.sender === "ai" && (
                      <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => copyToClipboard(message.content, message.id)}
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted p-3 rounded-lg flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <motion.div 
                        className="w-2 h-2 bg-primary rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div 
                        className="w-2 h-2 bg-primary rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div 
                        className="w-2 h-2 bg-primary rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask about your note..."
              className="flex-1"
            />
            <Button type="submit" disabled={!newMessage.trim() || isTyping}>
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          {/* Quick suggestions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setNewMessage("Summarize this note");
                setTimeout(() => handleSubmit(new Event('') as any), 100);
              }}
            >
              Summarize
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setNewMessage("Extract action items");
                setTimeout(() => handleSubmit(new Event('') as any), 100);
              }}
            >
              Extract actions
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setNewMessage("Create a list of key points");
                setTimeout(() => handleSubmit(new Event('') as any), 100);
              }}
            >
              Key points
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWithNote;
