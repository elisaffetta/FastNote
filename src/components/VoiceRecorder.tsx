
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Pause, Play, Square, Loader2 } from "lucide-react";
import { transcribeAudio, translateAudio } from "@/lib/whisperService";

interface VoiceRecorderProps {
  onRecordingComplete: (recording: Blob, transcription?: string) => void;
  recordingLimit?: number; // in seconds
  language?: string; // Language code for transcription
  autoTranscribe?: boolean; // Whether to automatically transcribe after recording
  translateToEnglish?: boolean; // Whether to translate to English
}

const VoiceRecorder = ({ 
  onRecordingComplete, 
  recordingLimit = 60,
  language,
  autoTranscribe = true,
  translateToEnglish = false
}: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>(Array(7).fill(50));
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  
  // Initialize waveform with random values
  useEffect(() => {
    const interval = setInterval(() => {
      if (isRecording && !isPaused) {
        setWaveformData(Array(7).fill(0).map(() => Math.random() * 50 + 10));
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);
  
  // Recording timer
  useEffect(() => {
    let interval: number | undefined;
    
    if (isRecording && !isPaused) {
      interval = window.setInterval(() => {
        setRecordingTime(prev => {
          // Auto-stop if limit reached
          if (prev >= recordingLimit - 1) {
            stopRecording();
            return recordingLimit;
          }
          return prev + 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused, recordingLimit]);
  
  // Создаем ref для хранения аудио чанков, чтобы избежать проблем с замыканиями
  const audioChunksRef = useRef<Blob[]>([]);
  
  const startRecording = async () => {
    try {
      // Очищаем предыдущие данные записи
      audioChunksRef.current = [];
      setAudioChunks([]);
      setAudioUrl(null);
      setRecordingTime(0);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Установка аудио-настроек для лучшего качества
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };
      
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
      
      console.log('Using MIME type:', recorder.mimeType);
      setMediaRecorder(recorder);
      
      // Set up recorder event handlers
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          console.log(`Got data chunk: ${e.data.size} bytes`);
          audioChunksRef.current.push(e.data);
          setAudioChunks(prev => [...prev, e.data]);
        }
      };
      
      recorder.onstop = async () => {
        console.log(`Recording stopped, chunks: ${audioChunksRef.current.length}`);
        
        // Убедимся, что у нас есть данные для создания блоба
        if (audioChunksRef.current.length === 0) {
          console.error('No audio chunks recorded');
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: recorder.mimeType || 'audio/webm;codecs=opus' 
        });
        
        console.log(`Created blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
        
        // Проверяем размер блоба
        if (audioBlob.size === 0) {
          console.error('Created audio blob is empty');
          return;
        }
        
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Stop all tracks on the stream to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Transcribe audio if autoTranscribe is enabled
        if (autoTranscribe) {
          try {
            setIsTranscribing(true);
            let text = "";
            
            console.log(`Sending blob for transcription: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
            
            if (translateToEnglish) {
              text = await translateAudio(audioBlob);
            } else {
              text = await transcribeAudio(audioBlob, language);
            }
            
            console.log(`Received transcription: ${text}`);
            setTranscription(text);
            onRecordingComplete(audioBlob, text);
          } catch (error) {
            console.error('Error during transcription:', error);
            onRecordingComplete(audioBlob);
          } finally {
            setIsTranscribing(false);
          }
        } else {
          onRecordingComplete(audioBlob);
        }
      };
      
      // Start recording with более частыми интервалами для сбора данных
      setIsRecording(true);
      setIsPaused(false);
      
      // Запускаем запись с небольшой задержкой, чтобы состояние успело обновиться
      setTimeout(() => {
        // Запрашиваем данные каждые 100мс
        recorder.start(100);
        console.log('Recording started');
        
        // Принудительно запрашиваем данные через короткий промежуток времени
        setTimeout(() => {
          if (recorder.state === 'recording') {
            console.log('Requesting initial data chunk');
            recorder.requestData();
          }
        }, 500);
        
        // Запрашиваем данные регулярно
        const dataInterval = setInterval(() => {
          if (recorder.state === 'recording') {
            console.log('Requesting regular data chunk');
            recorder.requestData();
          } else {
            clearInterval(dataInterval);
          }
        }, 1000);
      }, 100);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check your device permissions.");
    }
  };
  
  const pauseRecording = () => {
    if (mediaRecorder && isRecording) {
      if (isPaused) {
        // Resume recording
        mediaRecorder.resume();
        setIsPaused(false);
        
        // Запрашиваем данные сразу после возобновления
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.requestData();
          }
        }, 100);
      } else {
        // Запрашиваем данные перед паузой
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.requestData();
        }
        
        // Pause recording
        mediaRecorder.pause();
        setIsPaused(true);
      }
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      console.log('Stopping recording...');
      
      // Запрашиваем последние данные перед остановкой
      if (mediaRecorder.state === 'recording') {
        console.log('Requesting final data chunk');
        mediaRecorder.requestData();
      }
      
      // Небольшая задержка перед остановкой, чтобы успеть получить последние данные
      setTimeout(() => {
        console.log(`Collected ${audioChunksRef.current.length} chunks before stopping`);
        mediaRecorder.stop();
        setIsRecording(false);
        setIsPaused(false);
      }, 500); // Увеличиваем задержку до 500мс
    }
  };
  
  const resetRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioChunks([]);
    setAudioUrl(null);
    setWaveformData(Array(7).fill(50));
    setTranscription("");
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex flex-col items-center">
      {/* Recording visualization */}
      <AnimatePresence>
        {isRecording && (
          <motion.div 
            className="voice-waveform my-4 h-16"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "4rem" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {waveformData.map((height, index) => (
              <motion.div
                key={index}
                className="voice-waveform-bar"
                style={{ 
                  height: `${height}px`,
                  opacity: isPaused ? 0.5 : 0.8,
                  animationPlayState: isPaused ? 'paused' : 'running',
                  animationDelay: `${index * 0.1}s`
                }}
                animate={{ 
                  height: isPaused ? `${height}px` : [`${height * 0.6}px`, `${height}px`, `${height * 0.6}px`]
                }}
                transition={{ 
                  duration: 1.2, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  repeatType: "mirror"
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Recording timer */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            className="mb-4 font-mono text-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <span className={isPaused ? "text-muted-foreground" : "text-destructive"}>
              {formatTime(recordingTime)}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              / {formatTime(recordingLimit)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Controls */}
      <div className="flex items-center gap-4">
        {isRecording ? (
          <>
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={pauseRecording}
              >
                {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </Button>
            </motion.div>
            
            <motion.div 
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
            >
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full w-16 h-16"
                onClick={stopRecording}
              >
                <Square className="h-6 w-6" />
              </Button>
            </motion.div>
          </>
        ) : (
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 0.5, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <Button
              size="icon"
              className="voice-record-btn"
              onClick={startRecording}
            >
              <Mic className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </div>
      
      {/* Audio playback */}
      {audioUrl && !isRecording && (
        <div className="mt-6 space-y-4">
          <audio src={audioUrl} controls className="w-full" />
          
          {/* Transcription status and result */}
          {autoTranscribe && (
            <div className="mt-2">
              {isTranscribing ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Распознается Лизиными ИИ-агентами...</span>
                </div>
              ) : transcription ? (
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm font-medium mb-1">Transcription:</p>
                  <p className="text-sm">{transcription}</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
