import OpenAI from 'openai';

// Initialize OpenAI client
// Note: You'll need to set OPENAI_API_KEY in your environment variables
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, // This will be loaded from .env file
  dangerouslyAllowBrowser: true, // Allow usage in browser (only for development)
});

/**
 * Transcribe audio using OpenAI Whisper API
 * @param audioBlob - The audio blob to transcribe
 * @param language - Optional language code (e.g., 'en', 'ru', etc.)
 * @returns Promise with transcription text
 */
export async function transcribeAudio(audioBlob: Blob, language?: string): Promise<string> {
  try {
    // Check if blob is empty
    if (audioBlob.size === 0) {
      throw new Error('Audio blob is empty');
    }
    
    console.log('Audio blob info:', {
      size: audioBlob.size,
      type: audioBlob.type
    });
    
    // Ensure we have a valid mime type for OpenAI
    // OpenAI supports: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm
    let mimeType = audioBlob.type || 'audio/webm';
    let fileExtension = 'webm';
    
    // Map MIME type to file extension
    if (mimeType.includes('mp3')) {
      fileExtension = 'mp3';
    } else if (mimeType.includes('wav')) {
      fileExtension = 'wav';
    } else if (mimeType.includes('ogg')) {
      fileExtension = 'ogg';
    } else if (mimeType.includes('m4a')) {
      fileExtension = 'm4a';
    }
    
    // Convert blob to file with appropriate extension
    const file = new File([audioBlob], `audio.${fileExtension}`, { type: mimeType });
    
    // Call OpenAI API
    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: language,
    });
    
    return response.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}

/**
 * Translate audio to English using OpenAI Whisper API
 * @param audioBlob - The audio blob to translate
 * @returns Promise with translated text in English
 */
export async function translateAudio(audioBlob: Blob): Promise<string> {
  try {
    // Check if blob is empty
    if (audioBlob.size === 0) {
      throw new Error('Audio blob is empty');
    }
    
    // Ensure we have a valid mime type for OpenAI
    let mimeType = audioBlob.type || 'audio/webm';
    let fileExtension = 'webm';
    
    // Map MIME type to file extension
    if (mimeType.includes('mp3')) {
      fileExtension = 'mp3';
    } else if (mimeType.includes('wav')) {
      fileExtension = 'wav';
    } else if (mimeType.includes('ogg')) {
      fileExtension = 'ogg';
    } else if (mimeType.includes('m4a')) {
      fileExtension = 'm4a';
    }
    
    // Convert blob to file with appropriate extension
    const file = new File([audioBlob], `audio.${fileExtension}`, { type: mimeType });
    
    // Call OpenAI API with translation flag
    const response = await openai.audio.translations.create({
      file: file,
      model: 'whisper-1',
    });
    
    return response.text;
  } catch (error) {
    console.error('Error translating audio:', error);
    throw new Error('Failed to translate audio');
  }
}
