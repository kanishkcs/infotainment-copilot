import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      const finalTranscript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join("");
      setTranscript(finalTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = "Speech recognition error";
      
      switch (event.error) {
        case 'not-allowed':
          errorMessage = "Microphone access denied. Please allow microphone access and try again.";
          break;
        case 'no-speech':
          errorMessage = "No speech detected. Please try again.";
          break;
        case 'network':
          errorMessage = "Network error. Please check your connection.";
          break;
        case 'aborted':
          errorMessage = "Speech recognition was aborted.";
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const start = useCallback(async () => {
    if (recognitionRef.current) {
      try {
        // Request microphone permission first
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch (permissionError) {
            console.error("Microphone permission denied:", permissionError);
            setError("Microphone access denied. Please allow microphone access and try again.");
            return;
          }
        }
        
        setIsListening(true);
        setError(null);
        setTranscript("");
        recognitionRef.current.start();
      } catch (err) {
        console.error("Speech recognition start error:", err);
        setError("Failed to start speech recognition. Please try again.");
        setIsListening(false);
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  }, []);

  return {
    isSupported: !!recognitionRef.current,
    isListening,
    transcript,
    error,
    start,
    stop,
  };
}
