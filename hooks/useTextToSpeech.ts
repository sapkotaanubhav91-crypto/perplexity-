import { useState, useEffect, useCallback } from 'react';
import { TTSControls } from '../types';

const useTextToSpeech = (): TTSControls => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoiceState] = useState<SpeechSynthesisVoice | undefined>();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  const populateVoiceList = useCallback(() => {
    const newVoices = window.speechSynthesis.getVoices();
    if (newVoices.length > 0) {
      setVoices(newVoices);
      if (!selectedVoice) {
        // Find a default voice - prioritize Google US English or any English voice
        const defaultVoice = 
          newVoices.find(voice => voice.name === 'Google US English') ||
          newVoices.find(voice => voice.lang.startsWith('en')) ||
          newVoices[0];
        setSelectedVoiceState(defaultVoice);
      }
    }
  }, [selectedVoice]);

  useEffect(() => {
    populateVoiceList();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [populateVoiceList]);

  const speak = useCallback((text: string) => {
    if (!text || !selectedVoice) return;
    
    // Create a new utterance for each speech request
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingText(text);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingText(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingText(null);
    };
    
    window.speechSynthesis.cancel(); // Cancel any previous speech
    window.speechSynthesis.speak(utterance);
  }, [selectedVoice]);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingText(null);
  }, []);

  const setSelectedVoice = (voiceName: string) => {
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
      setSelectedVoiceState(voice);
    }
  };

  return { speak, cancel, isSpeaking, speakingText, voices, selectedVoice, setSelectedVoice };
};

export default useTextToSpeech;