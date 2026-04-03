import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Globe } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string, language: string) => void;
  language: 'EN' | 'TE' | 'HI';
  placeholder?: string;
  disabled?: boolean;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const translations = {
  EN: {
    startListening: 'Start Voice Input',
    stopListening: 'Stop Recording',
    listening: 'Listening...',
    processing: 'Processing...',
    notSupported: 'Voice input not supported',
    speakNow: 'Speak now...',
    clickToStart: 'Click to start voice input',
    error: 'Voice input error',
    languageSelect: 'Select Language'
  },
  TE: {
    startListening: 'వాయిస్ ఇన్‌పుట్ ప్రారంభించండి',
    stopListening: 'రికార్డింగ్ ఆపండి',
    listening: 'వింటోంది...',
    processing: 'ప్రాసెస్ చేస్తోంది...',
    notSupported: 'వాయిస్ ఇన్‌పుట్ మద్దతు లేదు',
    speakNow: 'ఇప్పుడు మాట్లాడండి...',
    clickToStart: 'వాయిస్ ఇన్‌పుట్ ప్రారంభించడానికి క్లిక్ చేయండి',
    error: 'వాయిస్ ఇన్‌పుట్ లోపం',
    languageSelect: 'భాష ఎంచుకోండి'
  },
  HI: {
    startListening: 'वॉइस इनपुट शुरू करें',
    stopListening: 'रिकॉर्डिंग रोकें',
    listening: 'सुन रहे हैं...',
    processing: 'प्रोसेस हो रहा है...',
    notSupported: 'वॉइस इनपुट समर्थित नहीं है',
    speakNow: 'अब बोलें...',
    clickToStart: 'वॉइस इनपुट शुरू करने के लिए क्लिक करें',
    error: 'वॉइस इनपुट त्रुटि',
    languageSelect: 'भाषा चुनें'
  }
};

// Language codes for speech recognition
const speechLanguageMap = {
  EN: 'en-US',
  TE: 'te-IN',
  HI: 'hi-IN'
};

// Voice command patterns for different languages
const voiceCommands = {
  EN: {
    addSale: ['add sale', 'new sale', 'record sale', 'sold'],
    checkStock: ['check stock', 'inventory', 'stock level', 'how many'],
    findProduct: ['find', 'search', 'look for', 'show me'],
    numbers: {
      zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
      sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20
    }
  },
  TE: {
    addSale: ['అమ్మకం జోడించండి', 'కొత్త అమ్మకం', 'అమ్మకాన్ని నమోదు చేయండి', 'అమ్మింది'],
    checkStock: ['స్టాక్ తనిఖీ చేయండి', 'ఇన్వెంటరీ', 'స్టాక్ స్థాయి', 'ఎన్ని'],
    findProduct: ['వెతకండి', 'శోధించండి', 'చూపండి'],
    numbers: {
      సున్న: 0, ఒకటి: 1, రెండు: 2, మూడు: 3, నాలుగు: 4, ఐదు: 5,
      ఆరు: 6, ఏడు: 7, ఎనిమిది: 8, తొమ్మిది: 9, పది: 10
    }
  },
  HI: {
    addSale: ['बिक्री जोड़ें', 'नई बिक्री', 'बिक्री रिकॉर्ड करें', 'बेचा'],
    checkStock: ['स्टॉक जांचें', 'इन्वेंट्री', 'स्टॉक स्तर', 'कितने'],
    findProduct: ['खोजें', 'ढूंढें', 'दिखाएं'],
    numbers: {
      शून्य: 0, एक: 1, दो: 2, तीन: 3, चार: 4, पांच: 5,
      छह: 6, सात: 7, आठ: 8, नौ: 9, दस: 10
    }
  }
};

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  language,
  placeholder,
  disabled = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedVoiceLanguage, setSelectedVoiceLanguage] = useState(language);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<number | null>(null);
  
  const t = translations[language];

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speechLanguageMap[selectedVoiceLanguage];

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      // Auto-stop after 2 seconds of silence
      if (finalTranscript) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          stopListening();
        }, 2000);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setError(`${t.error}: ${event.error}`);
      setIsListening(false);
      setIsProcessing(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsProcessing(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [selectedVoiceLanguage, t.error]);

  const startListening = () => {
    if (!isSupported || disabled) return;
    
    setError(null);
    setTranscript('');
    setIsListening(true);
    setIsProcessing(true);
    
    if (recognitionRef.current) {
      recognitionRef.current.lang = speechLanguageMap[selectedVoiceLanguage];
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsListening(false);
    setIsProcessing(false);
    
    if (transcript.trim()) {
      // Process voice commands
      const processedText = processVoiceCommand(transcript, selectedVoiceLanguage);
      onTranscript(processedText, selectedVoiceLanguage);
    }
  };

  const processVoiceCommand = (text: string, lang: 'EN' | 'TE' | 'HI'): string => {
    const commands = voiceCommands[lang];
    let processedText = text.toLowerCase().trim();

    // Convert number words to digits
    const numbers = commands.numbers;
    for (const [word, digit] of Object.entries(numbers)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      processedText = processedText.replace(regex, digit.toString());
    }

    // Add command indicators
    if (commands.addSale.some(cmd => processedText.includes(cmd))) {
      processedText = `ADD_SALE: ${processedText}`;
    } else if (commands.checkStock.some(cmd => processedText.includes(cmd))) {
      processedText = `CHECK_STOCK: ${processedText}`;
    } else if (commands.findProduct.some(cmd => processedText.includes(cmd))) {
      processedText = `FIND_PRODUCT: ${processedText}`;
    }

    return processedText;
  };

  const handleLanguageChange = (newLang: 'EN' | 'TE' | 'HI') => {
    setSelectedVoiceLanguage(newLang);
  };

  if (!isSupported) {
    return (
      <div className="voice-input unsupported">
        <MicOff size={20} />
        <span>{t.notSupported}</span>
      </div>
    );
  }

  return (
    <div className="voice-input">
      <div className="voice-controls">
        <button
          className={`voice-btn ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''}`}
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
          title={isListening ? t.stopListening : t.startListening}
        >
          {isListening ? (
            <div className="listening-animation">
              <Mic size={20} />
              <div className="sound-waves">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : (
            <Mic size={20} />
          )}
        </button>

        <div className="voice-language-selector">
          <Globe size={16} />
          <select
            value={selectedVoiceLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as 'EN' | 'TE' | 'HI')}
            className="voice-lang-select"
            title={t.languageSelect}
          >
            <option value="EN">EN</option>
            <option value="TE">TE</option>
            <option value="HI">HI</option>
          </select>
        </div>

        <div className="voice-status">
          {isListening && (
            <div className="listening-indicator">
              <Volume2 size={16} className="animate-pulse" />
              <span>{t.listening}</span>
            </div>
          )}
          {isProcessing && !isListening && (
            <div className="processing-indicator">
              <div className="spinner"></div>
              <span>{t.processing}</span>
            </div>
          )}
        </div>
      </div>

      {transcript && (
        <div className="voice-transcript">
          <div className="transcript-text">
            "{transcript}"
          </div>
        </div>
      )}

      {error && (
        <div className="voice-error">
          {error}
        </div>
      )}

      {placeholder && !transcript && !isListening && (
        <div className="voice-placeholder">
          {placeholder}
        </div>
      )}
    </div>
  );
};
