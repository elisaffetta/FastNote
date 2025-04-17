import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useSpeechRecognition } from "react-speech-recognition";
import { motion } from "framer-motion";
import { transcribeAudio } from "@/lib/whisperService";
import { 
  Mic, 
  MicOff, 
  Save,
  Tag, 
  MessageSquare, 
  Loader2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  Undo,
  Redo,
  Code,
  Quote,
  Heading1,
  Heading2,
  CheckSquare,
  Link,
  Eye,
  EyeOff
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useNoteStore } from "@/store/noteStore";
import { toast } from "@/hooks/use-toast";

const EditNote = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getNoteById, createNote, updateNote } = useNoteStore();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [initialContent, setInitialContent] = useState("");
  const [initialTitle, setInitialTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    if (id && id !== "new") {
      const note = getNoteById(id);
      if (note) {
        setTitle(note.title);
        setInitialTitle(note.title);
        setContent(note.content);
        setInitialContent(note.content);
        setTags(note.tags || []);
        
        // Initialize history with the original content
        setHistory([note.content]);
        setHistoryIndex(0);
      }
    } else {
      // Check if we have content from Whisper transcription in URL params
      const contentFromWhisper = searchParams.get('content');
      if (contentFromWhisper) {
        // Decode the URL-encoded content
        const decodedContent = decodeURIComponent(contentFromWhisper);
        setContent(decodedContent);
        setTitle('Новая голосовая заметка');
        
        toast({
          title: "Транскрипция получена",
          description: "Текст был преобразован из вашей голосовой записи с помощью Лизиных ИИ-агентов",
          duration: 3000
        });
      } else {
        // Check for auto-saved content
        const savedData = localStorage.getItem('autoSave');
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            if (parsed.id === 'new' || !parsed.id) {
              setTitle(parsed.title || '');
              setContent(parsed.content || '');
              if (parsed.tags) setTags(parsed.tags);
              
              toast({
                title: "Восстановлено",
                description: "Загружен черновик из автосохранения",
                duration: 3000
              });
            }
          } catch (e) {
            console.error("Error parsing auto-saved data", e);
          }
        }
      }
    }
  }, [id, getNoteById]);

  useEffect(() => {
    if (transcript) {
      setContent(prev => {
        if (prev) return `${prev} ${transcript}`;
        return transcript;
      });
    }
  }, [transcript]);

  useEffect(() => {
    let interval: number | undefined;
    
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Refs for audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      resetTranscript();
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        console.log('Stopping recording in EditNote...');
        
        // Запрашиваем последние данные перед остановкой
        if (mediaRecorderRef.current.state === 'recording') {
          console.log('Requesting final data chunk in EditNote');
          mediaRecorderRef.current.requestData();
        }
        
        // Небольшая задержка перед остановкой, чтобы успеть получить последние данные
        setTimeout(() => {
          console.log(`Collected ${audioChunksRef.current.length} chunks before stopping in EditNote`);
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
          }
        }, 500); // Увеличиваем задержку до 500мс
      }
    } else {
      try {
        // Очищаем предыдущие данные записи
        audioChunksRef.current = [];
        
        // Start recording with Whisper
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        
        // Проверяем поддерживаемые форматы
        let mimeType = 'audio/webm;codecs=opus';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else {
          mimeType = '';
        }
        
        // Создаем рекордер с указанными настройками
        const recorder = new MediaRecorder(stream, {
          mimeType: mimeType || undefined,
          audioBitsPerSecond: 128000
        });
        
        console.log('Using MIME type in EditNote:', recorder.mimeType);
        mediaRecorderRef.current = recorder;
        
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            console.log(`Got data chunk in EditNote: ${e.data.size} bytes`);
            audioChunksRef.current.push(e.data);
          }
        };
        
        recorder.onstop = async () => {
          try {
            console.log(`Recording stopped in EditNote, chunks: ${audioChunksRef.current.length}`);
            
            // Проверяем, есть ли данные для создания блоба
            if (audioChunksRef.current.length === 0) {
              console.error('No audio chunks recorded in EditNote');
              setIsLoading(false);
              return;
            }
            
            // Create audio blob с правильным MIME типом
            const audioBlob = new Blob(audioChunksRef.current, { 
              type: recorder.mimeType || 'audio/webm;codecs=opus' 
            });
            
            console.log(`Created blob in EditNote: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
            
            // Проверяем размер блоба
            if (audioBlob.size === 0) {
              console.error('Created audio blob is empty in EditNote');
              setIsLoading(false);
              return;
            }
            
            // Show loading state
            setIsLoading(true);
            toast({
              title: "Обработка аудио",
              description: "Отправка аудио Лизиным ИИ-ассистентам...",
              duration: 5000
            });
            
            // Transcribe with Whisper API
            const transcription = await transcribeAudio(audioBlob, 'ru');
            
            // Add transcription to content
            setContent(prev => {
              if (prev.trim()) {
                return `${prev}\n\n${transcription}`;
              }
              return transcription;
            });
            
            toast({
              title: "Транскрипция завершена",
              description: "Текст успешно добавлен в заметку",
              duration: 3000
            });
          } catch (error) {
            console.error('Error transcribing audio:', error);
            toast({
              title: "Ошибка",
              description: "Не удалось транскрибировать аудио. Пожалуйста, попробуйте еще раз.",
              duration: 5000,
              variant: "destructive"
            });
          } finally {
            setIsLoading(false);
            
            // Stop all tracks on the stream to release the microphone
            if (audioStreamRef.current) {
              audioStreamRef.current.getTracks().forEach(track => track.stop());
              audioStreamRef.current = null;
            }
          }
        };
        
        // Запускаем запись с небольшой задержкой
        setIsRecording(true);
        resetTranscript();
        
        // Запускаем запись с небольшой задержкой, чтобы состояние успело обновиться
        setTimeout(() => {
          // Запрашиваем данные каждые 100мс
          recorder.start(100);
          console.log('Recording started in EditNote');
          
          // Принудительно запрашиваем данные через короткий промежуток времени
          setTimeout(() => {
            if (recorder.state === 'recording') {
              console.log('Requesting initial data chunk in EditNote');
              recorder.requestData();
            }
          }, 500);
          
          // Запрашиваем данные регулярно
          const dataInterval = setInterval(() => {
            if (recorder.state === 'recording') {
              console.log('Requesting regular data chunk in EditNote');
              recorder.requestData();
            } else {
              clearInterval(dataInterval);
            }
          }, 1000);
        }, 100);
        
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Не удалось получить доступ к микрофону. Пожалуйста, проверьте разрешения устройства.");
      }
    }
  };

  // Add content to history when it changes
  useEffect(() => {
    if (content !== '' && (history.length === 0 || content !== history[historyIndex])) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(content);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [content]);
  
  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (title && content && (title !== initialTitle || content !== initialContent)) {
        // Save to local storage for recovery
        localStorage.setItem('autoSave', JSON.stringify({
          id,
          title,
          content,
          tags
        }));
        
        setLastSavedAt(new Date());
      }
    }, 30000); // Auto-save every 30 seconds
    
    return () => clearInterval(autoSaveInterval);
  }, [title, content, tags, id, initialTitle, initialContent]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if inside an input field that's not the textarea
      if (e.target instanceof HTMLInputElement) return;
      
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            applyFormat('bold');
            break;
          case 'i':
            e.preventDefault();
            applyFormat('italic');
            break;
          case 'u':
            e.preventDefault();
            applyFormat('underline');
            break;
          case 'l':
            e.preventDefault();
            applyFormat('list');
            break;
          case 'k':
            e.preventDefault();
            applyFormat('link');
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'z':
            e.preventDefault();
            undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
        }
      }
      
      // Ctrl+Shift combinations
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'l':
            e.preventDefault();
            applyFormat('ordered-list');
            break;
          case '1':
            e.preventDefault();
            applyFormat('heading1');
            break;
          case '2':
            e.preventDefault();
            applyFormat('heading2');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [content]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setContent(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setContent(history[historyIndex + 1]);
    }
  }, [historyIndex, history]);

  const applyFormat = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let newText = content;
    let cursorOffset = 0;
    let selectionStart = start;
    let selectionEnd = end;

    switch (format) {
      case 'bold':
        newText = content.substring(0, start) + `**${selectedText}**` + content.substring(end);
        cursorOffset = 4; // Length of ** + **
        break;
      case 'italic':
        newText = content.substring(0, start) + `_${selectedText}_` + content.substring(end);
        cursorOffset = 2; // Length of _ + _
        break;
      case 'underline':
        newText = content.substring(0, start) + `~${selectedText}~` + content.substring(end);
        cursorOffset = 2; // Length of ~ + ~
        break;
      case 'list':
        // If at start of line or text, don't add newline
        if (start === 0 || content[start-1] === '\n') {
          newText = content.substring(0, start) + `- ${selectedText}` + content.substring(end);
          cursorOffset = 2; // Length of - 
        } else {
          newText = content.substring(0, start) + `\n- ${selectedText}` + content.substring(end);
          cursorOffset = 3; // Length of \n- 
        }
        break;
      case 'ordered-list':
        // If at start of line or text, don't add newline
        if (start === 0 || content[start-1] === '\n') {
          newText = content.substring(0, start) + `1. ${selectedText}` + content.substring(end);
          cursorOffset = 3; // Length of 1. 
        } else {
          newText = content.substring(0, start) + `\n1. ${selectedText}` + content.substring(end);
          cursorOffset = 4; // Length of \n1. 
        }
        break;
      case 'heading1':
        // If at start of line or text, don't add newline
        if (start === 0 || content[start-1] === '\n') {
          newText = content.substring(0, start) + `# ${selectedText}` + content.substring(end);
          cursorOffset = 2; // Length of # 
        } else {
          newText = content.substring(0, start) + `\n# ${selectedText}` + content.substring(end);
          cursorOffset = 3; // Length of \n# 
        }
        break;
      case 'heading2':
        // If at start of line or text, don't add newline
        if (start === 0 || content[start-1] === '\n') {
          newText = content.substring(0, start) + `## ${selectedText}` + content.substring(end);
          cursorOffset = 3; // Length of ## 
        } else {
          newText = content.substring(0, start) + `\n## ${selectedText}` + content.substring(end);
          cursorOffset = 4; // Length of \n## 
        }
        break;
      case 'quote':
        // If at start of line or text, don't add newline
        if (start === 0 || content[start-1] === '\n') {
          newText = content.substring(0, start) + `> ${selectedText}` + content.substring(end);
          cursorOffset = 2; // Length of > 
        } else {
          newText = content.substring(0, start) + `\n> ${selectedText}` + content.substring(end);
          cursorOffset = 3; // Length of \n> 
        }
        break;
      case 'code':
        newText = content.substring(0, start) + `\`${selectedText}\`` + content.substring(end);
        cursorOffset = 2; // Length of ` + `
        break;
      case 'link':
        newText = content.substring(0, start) + `[${selectedText}](url)` + content.substring(end);
        cursorOffset = 6; // Length of [](url)
        selectionStart = start + selectedText.length + 3; // Position cursor at 'url'
        selectionEnd = start + selectedText.length + 6; // Select 'url'
        break;
      case 'checkbox':
        // If at start of line or text, don't add newline
        if (start === 0 || content[start-1] === '\n') {
          newText = content.substring(0, start) + `- [ ] ${selectedText}` + content.substring(end);
          cursorOffset = 6; // Length of - [ ] 
        } else {
          newText = content.substring(0, start) + `\n- [ ] ${selectedText}` + content.substring(end);
          cursorOffset = 7; // Length of \n- [ ] 
        }
        break;
    }
    
    setContent(newText);
    
    // Set cursor position after state update
    setTimeout(() => {
      textarea.focus();
      if (format === 'link') {
        textarea.setSelectionRange(selectionStart, selectionEnd);
      } else if (start === end) {
        // If no selection, place cursor after the formatting
        textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
      } else {
        // If there was a selection, place cursor after the selection with formatting
        textarea.setSelectionRange(end + cursorOffset, end + cursorOffset);
      }
    }, 0);
  };

  const templates = [
    {
      icon: "✍️",
      name: "Заметка дня",
      content: "# Заметка дня\n\nДата: " + format(new Date(), 'PPP', { locale: ru }) + "\n\n## Главные события:\n\n## Мысли и идеи:\n\n## Планы на завтра:\n"
    },
    {
      icon: "📝",
      name: "Конспект",
      content: "# Конспект\n\n## Тема:\n\n## Основные пункты:\n\n1. \n2. \n3. \n\n## Заметки:\n\n## Вопросы:\n"
    },
    {
      icon: "🎯",
      name: "План задач",
      content: "# План задач\n\n## Приоритетные:\n- [ ] \n- [ ] \n\n## В работе:\n- [ ] \n\n## Завершенные:\n- [x] \n"
    }
  ];

  const applyTemplate = (templateContent: string) => {
    if (content && !window.confirm("Вы уверены? Текущий текст будет заменен шаблоном.")) {
      return;
    }
    setContent(templateContent);
  };

  const handleSave = () => {
    if (!title) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Пожалуйста, введите заголовок для заметки"
      });
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      if (id && id !== "new") {
        updateNote(id, {
          title,
          content,
          tags,
          updatedAt: new Date().toISOString()
        });
        toast({
          title: "Готово!",
          description: "Заметка успешно обновлена",
        });
      } else {
        const newNote = {
          id: Date.now().toString(),
          title,
          content,
          tags,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        createNote(newNote);
        toast({
          title: "Готово!",
          description: "Заметка успешно создана",
        });
      }
      setIsLoading(false);
      navigate("/");
    }, 1000);
  };

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const startChat = () => {
    if (id && id !== "new") {
      navigate(`/chat/${id}`);
    } else {
      alert("Пожалуйста, сохраните заметку перед началом чата.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto p-4 md:p-6 min-h-screen flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {id && id !== "new" ? "Редактировать заметку" : "Новая заметка"}
        </h1>
        <Button 
          onClick={() => navigate("/")}
          variant="outline"
        >
          Отмена
        </Button>
      </header>

      <Card className="p-4 mb-6 space-y-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок заметки"
          className="text-xl font-medium"
        />
        
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <div 
                key={tag} 
                className="bg-primary/10 text-primary-foreground px-2 py-1 rounded-full text-sm flex items-center gap-1"
              >
                {tag}
                <button 
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-primary-foreground rounded-full hover:text-destructive"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Добавить тег..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button onClick={addTag} size="sm">
              <Tag className="h-4 w-4 mr-1" /> Добавить
            </Button>
          </div>
        </div>
      </Card>

      <Card className="flex-1 p-4 mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {/* History controls */}
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Отменить (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Повторить (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </Button>
          
          <div className="h-6 border-l mx-1" />
          
          {/* Text formatting */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormat('bold')}
            title="Жирный (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormat('italic')}
            title="Курсив (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormat('underline')}
            title="Подчеркнутый (Ctrl+U)"
          >
            <Underline className="h-4 w-4" />
          </Button>
          
          <div className="h-6 border-l mx-1" />
          
          {/* Headings */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormat('heading1')}
            title="Заголовок 1 (Ctrl+Shift+1)"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormat('heading2')}
            title="Заголовок 2 (Ctrl+Shift+2)"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          
          <div className="h-6 border-l mx-1" />
          
          {/* Lists */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormat('list')}
            title="Список (Ctrl+L)"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormat('ordered-list')}
            title="Нумерованный список (Ctrl+Shift+L)"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormat('checkbox')}
            title="Чекбокс"
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
          
          <div className="h-6 border-l mx-1" />
          
          {/* Other formatting */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormat('quote')}
            title="Цитата"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormat('code')}
            title="Код"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormat('link')}
            title="Ссылка (Ctrl+K)"
          >
            <Link className="h-4 w-4" />
          </Button>
          
          <div className="flex-1" />
          
          {/* Preview toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? "Режим редактирования" : "Режим предпросмотра"}
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showPreview ? "Редактор" : "Предпросмотр"}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="group"
            onClick={() => {
              const menu = document.getElementById('templates-menu');
              if (menu) {
                menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
              }
            }}
            title="Шаблоны"
          >
            <Sparkles className="h-4 w-4 mr-1 group-hover:text-yellow-500" />
            Шаблоны
          </Button>
        </div>

        <div 
          id="templates-menu" 
          className="hidden flex-wrap gap-2 mb-4 p-2 border rounded-md bg-muted/50"
        >
          {templates.map((template, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="animate-pulse"
              onClick={() => applyTemplate(template.content)}
            >
              <span className="mr-1">{template.icon}</span>
              {template.name}
            </Button>
          ))}
        </div>

        <div className="relative flex-1">
          {showPreview ? (
            <div className="min-h-[300px] p-4 border rounded-md overflow-auto markdown-preview">
              {/* Simple markdown rendering - in a real app, use a proper markdown renderer */}
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {content
                  .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                  .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                  .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\_(.+?)\_/g, '<em>$1</em>')
                  .replace(/\~(.+?)\~/g, '<u>$1</u>')
                  .replace(/^- (.+)$/gm, '• $1')
                  .replace(/^\d+\. (.+)$/gm, '1. $1')
                  .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
                  .replace(/\`(.+?)\`/g, '<code>$1</code>')
                  .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
                  .replace(/^- \[ \] (.+)$/gm, '☐ $1')
                  .replace(/^- \[x\] (.+)$/gm, '☑ $1')
                  .split('\n').map((line, i) => <div key={i} dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />)
                }
              </div>
            </div>
          ) : (
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Содержание заметки..."
              className="min-h-[300px] resize-none p-4 font-mono"
              spellCheck={true}
            />
          )}
          
          {/* Auto-save indicator */}
          {lastSavedAt && (
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              Автосохранение: {lastSavedAt.toLocaleTimeString()}
            </div>
          )}
          
          {id && id !== "new" && (
            <Button
              className="absolute top-2 right-2"
              size="sm"
              variant="outline"
              onClick={startChat}
            >
              <MessageSquare className="h-4 w-4 mr-1" /> Чат
            </Button>
          )}
        </div>
      </Card>

      <div className="fixed bottom-6 inset-x-0 flex justify-center space-x-4">
        <div className="flex items-center space-x-4 glass-morphism px-6 py-3 rounded-full">
          <motion.div 
            className="relative"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
          >
            {isRecording && (
              <motion.div
                className="voice-record-wave"
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.8, 0.4, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            <Button
              size="lg"
              className={`voice-record-btn ${isRecording ? 'voice-record-btn-active' : ''}`}
              onClick={toggleRecording}
            >
              {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
          </motion.div>

          <Button 
            onClick={handleSave}
            disabled={isLoading}
            size="lg"
            className="min-w-[120px] animate-pulse"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Сохранить
          </Button>
        </div>
      </div>

      {isRecording && (
        <div className="fixed bottom-28 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <div className="text-destructive font-medium">Запись...</div>
          <div className="text-sm text-muted-foreground">{formatTime(recordingTime)}</div>
          <div className="voice-waveform mt-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <motion.div
                key={index}
                className="voice-waveform-bar"
                style={{ 
                  height: `${Math.random() * 24 + 8}px`,
                  animationDelay: `${index * 0.1}s`
                }}
                animate={{ 
                  height: [`${Math.random() * 8 + 4}px`, `${Math.random() * 32 + 8}px`, `${Math.random() * 8 + 4}px`],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditNote;
