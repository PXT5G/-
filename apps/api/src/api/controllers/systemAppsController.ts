import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getActorId } from '../../services/rbacService';
import { initializeSystemApps } from '../../services/systemAppsService';
import { capturePhoto, captureVideo, getCameraSettings, getCameraRoll } from '../../services/cameraService';
import {
  listGalleryItems, getGalleryAlbums, toggleFavorite, moveToTrash,
  getAiCategories, getMemoryTimeline, getStorageAnalysis,
} from '../../services/galleryService';
import {
  listEvents, createEvent, deleteEvent, seedGovernmentEvents,
} from '../../services/calendarService';
import {
  listAlarms, createAlarm, toggleAlarm, setSleepSchedule, getWorldClocks,
} from '../../services/clockService';
import { listNotes, createNote, updateNote, deleteNote, getFolders } from '../../services/notesService';
import {
  listRecordings, createRecording, addBookmark, trimRecording, deleteRecording,
} from '../../services/voiceRecorderService';
import { getWeather } from '../../services/weatherService';
import {
  getMapsState, searchMaps, planRoute, stopRoute, getPoliceRoadBlocks,
  downloadOfflineMap, listOfflineMaps, getAvailableDistricts,
} from '../../services/mapsAppService';
import {
  searchFiles, moveFile, renameFile, getFilesByCategory, getRecentFiles, previewFile, ensureSystemFolders,
} from '../../services/filesAppService';
import { CAMERA_MODES, FLASH_MODES, CALENDAR_EVENT_TYPES } from '../../constants/systemApps';

function param(v: string | string[]): string {
  return Array.isArray(v) ? v[0] : v;
}

function mapErr(err: unknown): never {
  if (!(err instanceof Error)) throw err;
  const m: Record<string, [number, string]> = {
    PERMISSION_DENIED: [403, 'Permission denied'],
    ITEM_NOT_FOUND: [404, 'Item not found'],
    EVENT_NOT_FOUND: [404, 'Event not found'],
    NOTE_NOT_FOUND: [404, 'Note not found'],
    ALARM_NOT_FOUND: [404, 'Alarm not found'],
    RECORDING_NOT_FOUND: [404, 'Recording not found'],
    FILE_NOT_FOUND: [404, 'File not found'],
    VOICE_NOTE_TOO_LONG: [400, 'Recording too long'],
  };
  const e = m[err.message];
  if (e) throw new AppError(e[0], e[1]);
  throw err;
}

// ─── Init ───────────────────────────────────────────────────────────────────

export const initHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await initializeSystemApps(req.user!.userId);
  res.json({ success: true, data });
});

// ─── Camera ─────────────────────────────────────────────────────────────────

export const cameraSettingsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getCameraSettings(req.user!.userId);
  res.json({ success: true, data });
});

export const capturePhotoHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    mode: z.enum(CAMERA_MODES as unknown as [string, ...string[]]).default('photo'),
    flash: z.enum(FLASH_MODES as unknown as [string, ...string[]]).default('auto'),
    hdr: z.boolean().optional(),
    zoom: z.number().optional(),
    timer: z.number().optional(),
    burst: z.number().optional(),
    raw: z.boolean().optional(),
    grid: z.boolean().optional(),
    megapixels: z.number().optional(),
  }).parse(req.body);
  try {
    const data = await capturePhoto(req.user!.userId, body as never, getActorId(req));
    res.status(201).json({ success: true, data });
  } catch (e) { mapErr(e); }
});

export const captureVideoHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    mode: z.enum(CAMERA_MODES as unknown as [string, ...string[]]).default('video'),
    flash: z.enum(FLASH_MODES as unknown as [string, ...string[]]).default('off'),
    zoom: z.number().optional(),
    durationSeconds: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    fps: z.number().optional(),
  }).parse(req.body);
  try {
    const data = await captureVideo(req.user!.userId, body as never, getActorId(req));
    res.status(201).json({ success: true, data });
  } catch (e) { mapErr(e); }
});

export const cameraRollHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getCameraRoll(req.user!.userId);
  res.json({ success: true, data });
});

// ─── Gallery ────────────────────────────────────────────────────────────────

export const galleryItemsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await listGalleryItems(req.user!.userId, {
    albumId: req.query.albumId as string | undefined,
    type: req.query.type as 'photo' | 'video' | undefined,
    favorite: req.query.favorite === 'true' ? true : undefined,
    hidden: req.query.hidden === 'true' ? true : undefined,
    trashed: req.query.trashed === 'true' ? true : false,
    q: req.query.q as string | undefined,
  });
  res.json({ success: true, data });
});

export const galleryAlbumsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getGalleryAlbums(req.user!.userId);
  res.json({ success: true, data });
});

export const galleryFavoriteHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await toggleFavorite(req.user!.userId, param(req.params.itemId), getActorId(req));
    res.json({ success: true, data });
  } catch (e) { mapErr(e); }
});

export const galleryTrashHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await moveToTrash(req.user!.userId, param(req.params.itemId), getActorId(req));
    res.json({ success: true, data });
  } catch (e) { mapErr(e); }
});

export const galleryAiHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getAiCategories(req.user!.userId);
  res.json({ success: true, data });
});

export const galleryTimelineHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getMemoryTimeline(req.user!.userId);
  res.json({ success: true, data });
});

export const galleryStorageHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getStorageAnalysis(req.user!.userId);
  res.json({ success: true, data });
});

// ─── Calendar ───────────────────────────────────────────────────────────────

export const calendarEventsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await listEvents(req.user!.userId);
  res.json({ success: true, data });
});

export const createEventHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    title: z.string(),
    description: z.string().optional(),
    eventType: z.enum(CALENDAR_EVENT_TYPES as unknown as [string, ...string[]]).optional(),
    startAt: z.string(),
    endAt: z.string(),
    allDay: z.boolean().optional(),
    location: z.string().optional(),
    recurrence: z.string().optional(),
    reminderMinutes: z.array(z.number()).optional(),
  }).parse(req.body);
  const data = await createEvent(req.user!.userId, body as never, getActorId(req));
  res.status(201).json({ success: true, data });
});

export const deleteEventHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await deleteEvent(req.user!.userId, param(req.params.eventId), getActorId(req));
    res.json({ success: true, data });
  } catch (e) { mapErr(e); }
});

export const seedCalendarHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await seedGovernmentEvents(req.user!.userId, getActorId(req));
  res.json({ success: true, data });
});

// ─── Clock ──────────────────────────────────────────────────────────────────

export const listAlarmsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await listAlarms(req.user!.userId);
  res.json({ success: true, data });
});

export const createAlarmHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    label: z.string().optional(),
    hour: z.number().min(0).max(23),
    minute: z.number().min(0).max(59),
    repeatDays: z.array(z.number()).optional(),
    sound: z.string().optional(),
  }).parse(req.body);
  const data = await createAlarm(req.user!.userId, body, getActorId(req));
  res.status(201).json({ success: true, data });
});

export const toggleAlarmHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await toggleAlarm(req.user!.userId, param(req.params.alarmId), getActorId(req));
    res.json({ success: true, data });
  } catch (e) { mapErr(e); }
});

export const sleepScheduleHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { start, end } = z.object({ start: z.string(), end: z.string() }).parse(req.body);
  const data = await setSleepSchedule(req.user!.userId, { start, end }, getActorId(req));
  res.json({ success: true, data });
});

export const worldClocksHandler = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const data = await getWorldClocks();
  res.json({ success: true, data });
});

// ─── Notes ──────────────────────────────────────────────────────────────────

export const listNotesHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await listNotes(req.user!.userId, req.query.folderId as string | undefined, req.query.q as string | undefined);
  res.json({ success: true, data });
});

export const createNoteHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    folderId: z.string().optional(),
    checklist: z.array(z.object({ id: z.string(), text: z.string(), checked: z.boolean() })).optional(),
  }).parse(req.body);
  const data = await createNote(req.user!.userId, body, getActorId(req));
  res.status(201).json({ success: true, data });
});

export const updateNoteHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await updateNote(req.user!.userId, param(req.params.noteId), req.body, getActorId(req));
    res.json({ success: true, data });
  } catch (e) { mapErr(e); }
});

export const deleteNoteHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await deleteNote(req.user!.userId, param(req.params.noteId), getActorId(req));
  res.json({ success: true, data });
});

export const noteFoldersHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getFolders(req.user!.userId);
  res.json({ success: true, data });
});

// ─── Voice Recorder ─────────────────────────────────────────────────────────

export const listRecordingsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await listRecordings(req.user!.userId);
  res.json({ success: true, data });
});

export const createRecordingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    name: z.string().optional(),
    durationSeconds: z.number().min(1).max(300),
    noiseReduction: z.boolean().optional(),
  }).parse(req.body);
  try {
    const data = await createRecording(req.user!.userId, body, getActorId(req));
    res.status(201).json({ success: true, data });
  } catch (e) { mapErr(e); }
});

export const addBookmarkHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { seconds, label } = z.object({ seconds: z.number(), label: z.string() }).parse(req.body);
  try {
    const data = await addBookmark(req.user!.userId, param(req.params.recordingId), seconds, label, getActorId(req));
    res.json({ success: true, data });
  } catch (e) { mapErr(e); }
});

export const trimRecordingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { trimStart, trimEnd } = z.object({ trimStart: z.number(), trimEnd: z.number() }).parse(req.body);
  try {
    const data = await trimRecording(req.user!.userId, param(req.params.recordingId), trimStart, trimEnd, getActorId(req));
    res.json({ success: true, data });
  } catch (e) { mapErr(e); }
});

export const deleteRecordingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await deleteRecording(req.user!.userId, param(req.params.recordingId), getActorId(req));
  res.json({ success: true, data });
});

// ─── Weather ────────────────────────────────────────────────────────────────

export const weatherHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getWeather(req.user!.userId);
  res.json({ success: true, data });
});

// ─── Maps ───────────────────────────────────────────────────────────────────

export const mapsStateHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getMapsState(req.user!.userId);
  res.json({ success: true, data });
});

export const mapsSearchHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = (req.query.q as string) ?? '';
  const data = await searchMaps(req.user!.userId, q);
  res.json({ success: true, data });
});

export const mapsRouteHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    locationId: z.string().optional(),
    name: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).parse(req.body);
  const data = await planRoute(req.user!.userId, body, getActorId(req));
  res.json({ success: true, data });
});

export const mapsStopRouteHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await stopRoute(req.user!.userId, getActorId(req));
  res.json({ success: true, data });
});

export const mapsRoadBlocksHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getPoliceRoadBlocks(req.user!.userId);
  res.json({ success: true, data });
});

export const mapsOfflineDownloadHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { district } = z.object({ district: z.string() }).parse(req.body);
  const data = await downloadOfflineMap(req.user!.userId, district, getActorId(req));
  res.status(201).json({ success: true, data });
});

export const mapsOfflineListHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await listOfflineMaps(req.user!.userId);
  res.json({ success: true, data });
});

export const mapsDistrictsHandler = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const data = await getAvailableDistricts();
  res.json({ success: true, data });
});

// ─── Files ──────────────────────────────────────────────────────────────────

export const filesSearchHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = (req.query.q as string) ?? '';
  const data = await searchFiles(req.user!.userId, q);
  res.json({ success: true, data });
});

export const filesMoveHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { newParentId } = z.object({ newParentId: z.string().nullable() }).parse(req.body);
  try {
    const data = await moveFile(req.user!.userId, param(req.params.fileId), newParentId, getActorId(req));
    res.json({ success: true, data });
  } catch (e) { mapErr(e); }
});

export const filesRenameHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { newName } = z.object({ newName: z.string() }).parse(req.body);
  try {
    const data = await renameFile(req.user!.userId, param(req.params.fileId), newName, getActorId(req));
    res.json({ success: true, data });
  } catch (e) { mapErr(e); }
});

export const filesCategoryHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getFilesByCategory(req.user!.userId, param(req.params.category));
  res.json({ success: true, data });
});

export const filesRecentHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getRecentFiles(req.user!.userId);
  res.json({ success: true, data });
});

export const filesPreviewHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await previewFile(req.user!.userId, param(req.params.fileId));
    res.json({ success: true, data });
  } catch (e) { mapErr(e); }
});

export const filesInitFoldersHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await ensureSystemFolders(req.user!.userId);
  res.json({ success: true, data: { initialized: true } });
});
