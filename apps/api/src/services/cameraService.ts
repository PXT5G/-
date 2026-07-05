import { v4 as uuidv4 } from 'uuid';
import { addPhoto, addVideo } from './mediaStorageService';
import { createGalleryItemFromCapture } from './galleryService';
import { SYSTEM_APP_BUNDLES, type CameraMode, type FlashMode } from '../constants/systemApps';
import { logSystemAppAudit } from './systemAppsAuditService';
import { emitToUser } from './socketService';
import { checkPermission } from './permissionBrokerService';

export interface CaptureParams {
  mode: CameraMode;
  flash: FlashMode;
  hdr?: boolean;
  zoom?: number;
  timer?: number;
  burst?: number;
  raw?: boolean;
  grid?: boolean;
  megapixels?: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  fps?: number;
}

export async function capturePhoto(userId: string, params: CaptureParams, actorId: string) {
  const allowed = await checkPermission(userId, SYSTEM_APP_BUNDLES.camera, 'camera');
  if (!allowed) throw new Error('PERMISSION_DENIED');

  const megapixels = params.megapixels ?? (params.mode === 'portrait' ? 12 : params.mode === 'night' ? 8 : 24);
  const sizeBytes = await addPhoto(userId, SYSTEM_APP_BUNDLES.camera, megapixels);

  const name = `IMG_${Date.now()}.jpg`;
  const item = await createGalleryItemFromCapture(userId, {
    type: 'photo',
    name,
    sizeBytes,
    mode: params.mode,
    megapixels,
    metadata: {
      flash: params.flash,
      hdr: params.hdr ?? false,
      zoom: params.zoom ?? 1,
      timer: params.timer ?? 0,
      burst: params.burst ?? 1,
      raw: params.raw ?? false,
      grid: params.grid ?? false,
    },
  }, actorId);

  await logSystemAppAudit({ userId, actorId, appId: SYSTEM_APP_BUNDLES.camera, action: 'photo_capture', resourceId: item.itemId, metadata: { mode: params.mode } });
  emitToUser(userId, 'camera:capture', { type: 'photo', itemId: item.itemId, sizeBytes });
  return { ...item, sizeBytes };
}

export async function captureVideo(userId: string, params: CaptureParams, actorId: string) {
  const allowed = await checkPermission(userId, SYSTEM_APP_BUNDLES.camera, 'camera');
  if (!allowed) throw new Error('PERMISSION_DENIED');

  const width = params.width ?? 3840;
  const height = params.height ?? 2160;
  const fps = params.fps ?? (params.mode === 'slow_motion' ? 120 : 30);
  const duration = params.durationSeconds ?? (params.mode === 'time_lapse' ? 10 : 30);
  const codec = params.mode === 'night' ? 'h264' as const : 'hevc' as const;
  const sizeBytes = await addVideo(userId, SYSTEM_APP_BUNDLES.camera, width, height, fps, duration, codec);

  const name = `VID_${Date.now()}.mp4`;
  const item = await createGalleryItemFromCapture(userId, {
    type: 'video',
    name,
    sizeBytes,
    mode: params.mode,
    durationSeconds: duration,
    width,
    height,
    metadata: { flash: params.flash, zoom: params.zoom ?? 1, fps, codec },
  }, actorId);

  await logSystemAppAudit({ userId, actorId, appId: SYSTEM_APP_BUNDLES.camera, action: 'video_capture', resourceId: item.itemId });
  emitToUser(userId, 'camera:capture', { type: 'video', itemId: item.itemId, sizeBytes });
  return { ...item, sizeBytes };
}

export async function getCameraSettings(userId: string) {
  return {
    modes: ['photo', 'portrait', 'video', 'slow_motion', 'time_lapse', 'night'],
    flashModes: ['off', 'on', 'auto'],
    maxZoom: 10,
    hdrSupported: true,
    rawSupported: true,
    gridSupported: true,
    burstMax: 30,
    timerOptions: [0, 3, 10],
  };
}

export async function getCameraRoll(userId: string, limit = 20) {
  const { listGalleryItems } = await import('./galleryService');
  return listGalleryItems(userId, { trashed: false, hidden: false });
}
