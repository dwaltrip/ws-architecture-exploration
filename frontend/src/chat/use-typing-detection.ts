import { useRef, useEffect, useCallback } from 'react';
import { chatWsEffects } from './ws-effects';

interface UseTypingDetectionOptions {
  roomId: string | null;
  inactivityTimeoutMs?: number;
}

interface UseTypingDetectionReturn {
  handleInputChange: (text: string) => void;
  stopTyping: () => void;
}

function useTypingDetection({
  roomId,
  inactivityTimeoutMs = 2000,
}: UseTypingDetectionOptions): UseTypingDetectionReturn {
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Cleanup typing timeout on unmount or when roomId changes
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        if (roomId) {
          chatWsEffects.updateTypingStatus(roomId, false);
        }
        isTypingRef.current = false;
      }
    };
  }, [roomId]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current && roomId) {
      isTypingRef.current = false;
      chatWsEffects.updateTypingStatus(roomId, false);
    }
  }, [roomId]);

  const handleInputChange = useCallback((text: string) => {
    if (!roomId) return;

    // If text is not empty and we're not already marked as typing, start typing
    if (text.trim() && !isTypingRef.current) {
      isTypingRef.current = true;
      chatWsEffects.updateTypingStatus(roomId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after inactivity
    if (text.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          isTypingRef.current = false;
          chatWsEffects.updateTypingStatus(roomId, false);
        }
      }, inactivityTimeoutMs);
    } else {
      // If text is empty, immediately stop typing
      stopTyping();
    }
  }, [roomId, inactivityTimeoutMs, stopTyping]);

  return {
    handleInputChange,
    stopTyping,
  };
}

export { useTypingDetection };
export type { UseTypingDetectionOptions, UseTypingDetectionReturn };
