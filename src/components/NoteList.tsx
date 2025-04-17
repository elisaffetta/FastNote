
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Tag,
  Calendar,
  SortAsc,
  SortDesc,
  Trash2,
  MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";
import { format, isToday, isYesterday } from "date-fns";
import { ru } from "date-fns/locale";
import { useNoteStore, type Note } from "@/store/noteStore";

// Animation variants for list items
const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
};

const NoteList = () => {
  const navigate = useNavigate();
  const { notes, searchNotes, deleteNote, getTags } = useNoteStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredNotes, setFilteredNotes] = useState<Note[]>(notes);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Update available tags
  useEffect(() => {
    setAvailableTags(getTags());
  }, [notes, getTags]);

  // Filter and sort notes
  useEffect(() => {
    let results = searchQuery ? searchNotes(searchQuery) : [...notes];
    
    // Filter by tag if selected
    if (selectedTag) {
      results = results.filter(note => note.tags.includes(selectedTag));
    }
    
    // Sort by date
    results.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredNotes(results);
  }, [searchQuery, notes, selectedTag, sortOrder, searchNotes]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Сегодня, ${format(date, "H:mm", { locale: ru })}`;
    } else if (isYesterday(date)) {
      return `Вчера, ${format(date, "H:mm", { locale: ru })}`;
    } else {
      return format(date, "d MMM yyyy", { locale: ru });
    }
  };

  // Truncate text to specified length
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Поиск заметок..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tag filters */}
      <div className="flex flex-wrap gap-2 pb-2">
        {availableTags.map(tag => (
          <Badge
            key={tag}
            variant={selectedTag === tag ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/10"
            onClick={() => handleTagSelect(tag)}
          >
            <Tag className="h-3 w-3 mr-1" />
            {tag}
          </Badge>
        ))}
        
        {selectedTag && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2"
            onClick={() => setSelectedTag(null)}
          >
            Очистить фильтр
          </Button>
        )}
      </div>

      {/* Sort control */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-muted-foreground">
          {filteredNotes.length} {filteredNotes.length === 1 ? "заметка" : 
           filteredNotes.length >= 2 && filteredNotes.length <= 4 ? "заметки" : "заметок"}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2"
          onClick={toggleSortOrder}
        >
          {sortOrder === "desc" ? (
            <SortDesc className="h-4 w-4 mr-1" />
          ) : (
            <SortAsc className="h-4 w-4 mr-1" />
          )}
          {sortOrder === "desc" ? "Новые" : "Старые"}
        </Button>
      </div>

      {/* Notes list */}
      {filteredNotes.length > 0 ? (
        <div className="space-y-3">
          {filteredNotes.map((note, index) => (
            <motion.div
              key={note.id}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={listItemVariants}
              className="note-card cursor-pointer hover:scale-[1.01] transition-transform"
              onClick={() => navigate(`/note/${note.id}`)}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{note.title}</h3>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/chat/${note.id}`);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Вы уверены, что хотите удалить эту заметку?")) {
                        deleteNote(note.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {truncateText(note.content, 150)}
              </p>
              <div className="flex justify-between items-center mt-2">
                <div className="flex flex-wrap gap-1">
                  {note.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {note.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{note.tags.length - 3}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(note.updatedAt)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Заметки не найдены</p>
          {searchQuery && (
            <Button 
              variant="link" 
              onClick={() => setSearchQuery("")}
            >
              Очистить поиск
            </Button>
          )}
        </div>
      )}

      {/* Add new note button (fixed at bottom) */}
      <motion.div 
        className="fixed bottom-8 right-8"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button 
          size="lg" 
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={() => navigate("/note/new")}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  );
};

export default NoteList;
