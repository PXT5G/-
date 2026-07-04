import type { ContentType } from '../constants/communication';
import { ATTACHMENT_LIMITS } from '../constants/communication';

export interface VoiceNoteParams {
  durationSeconds: number;
  mimeType: string;
  waveform?: number[];
}

export function validateVoiceNote(params: VoiceNoteParams): void {
  if (params.durationSeconds > ATTACHMENT_LIMITS.maxVoiceNoteSeconds) {
    throw new Error('VOICE_NOTE_TOO_LONG');
  }
  if (!params.mimeType.startsWith('audio/')) {
    throw new Error('INVALID_VOICE_FORMAT');
  }
}

export function formatVoiceMetadata(params: VoiceNoteParams) {
  return {
    contentType: 'voice_note' as ContentType,
    durationSeconds: params.durationSeconds,
    waveform: params.waveform ?? [],
    mimeType: params.mimeType,
  };
}

export async function prepareVoiceAttachment(messageId: string, params: VoiceNoteParams) {
  validateVoiceNote(params);
  return {
    messageId,
    ...formatVoiceMetadata(params),
    estimatedSizeBytes: Math.round(params.durationSeconds * 16_000),
  };
}
