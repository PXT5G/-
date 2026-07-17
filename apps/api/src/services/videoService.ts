import type { ContentType } from '../constants/communication';
import { ATTACHMENT_LIMITS } from '../constants/communication';

export interface VideoParams {
  width: number;
  height: number;
  durationSeconds: number;
  mimeType: string;
  codec?: string;
}

export function validateVideo(params: VideoParams): void {
  if (!params.mimeType.startsWith('video/')) throw new Error('INVALID_VIDEO_FORMAT');
  const estimatedSize = params.durationSeconds * params.width * params.height * 0.1;
  if (estimatedSize > ATTACHMENT_LIMITS.maxVideoSizeBytes) throw new Error('VIDEO_TOO_LARGE');
}

export function formatVideoMetadata(params: VideoParams) {
  return {
    contentType: 'video' as ContentType,
    width: params.width,
    height: params.height,
    durationSeconds: params.durationSeconds,
    codec: params.codec ?? 'hevc',
    mimeType: params.mimeType,
  };
}

export async function prepareVideoAttachment(messageId: string, params: VideoParams) {
  validateVideo(params);
  return { messageId, ...formatVideoMetadata(params) };
}
