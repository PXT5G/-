import { Router } from 'express';
import * as c from '../controllers/systemAppsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/initialize', authenticate, c.initHandler);

// Camera
router.get('/camera/settings', authenticate, c.cameraSettingsHandler);
router.post('/camera/photo', authenticate, c.capturePhotoHandler);
router.post('/camera/video', authenticate, c.captureVideoHandler);
router.get('/camera/roll', authenticate, c.cameraRollHandler);

// Gallery
router.get('/gallery/items', authenticate, c.galleryItemsHandler);
router.get('/gallery/albums', authenticate, c.galleryAlbumsHandler);
router.post('/gallery/items/:itemId/favorite', authenticate, c.galleryFavoriteHandler);
router.post('/gallery/items/:itemId/trash', authenticate, c.galleryTrashHandler);
router.get('/gallery/ai-categories', authenticate, c.galleryAiHandler);
router.get('/gallery/timeline', authenticate, c.galleryTimelineHandler);
router.get('/gallery/storage', authenticate, c.galleryStorageHandler);

// Calendar
router.get('/calendar/events', authenticate, c.calendarEventsHandler);
router.post('/calendar/events', authenticate, c.createEventHandler);
router.delete('/calendar/events/:eventId', authenticate, c.deleteEventHandler);
router.post('/calendar/seed', authenticate, c.seedCalendarHandler);

// Clock
router.get('/clock/alarms', authenticate, c.listAlarmsHandler);
router.post('/clock/alarms', authenticate, c.createAlarmHandler);
router.patch('/clock/alarms/:alarmId/toggle', authenticate, c.toggleAlarmHandler);
router.post('/clock/sleep-schedule', authenticate, c.sleepScheduleHandler);
router.get('/clock/world-clocks', authenticate, c.worldClocksHandler);

// Notes
router.get('/notes', authenticate, c.listNotesHandler);
router.post('/notes', authenticate, c.createNoteHandler);
router.patch('/notes/:noteId', authenticate, c.updateNoteHandler);
router.delete('/notes/:noteId', authenticate, c.deleteNoteHandler);
router.get('/notes/folders', authenticate, c.noteFoldersHandler);

// Voice Recorder
router.get('/voice-recorder', authenticate, c.listRecordingsHandler);
router.post('/voice-recorder', authenticate, c.createRecordingHandler);
router.post('/voice-recorder/:recordingId/bookmarks', authenticate, c.addBookmarkHandler);
router.post('/voice-recorder/:recordingId/trim', authenticate, c.trimRecordingHandler);
router.delete('/voice-recorder/:recordingId', authenticate, c.deleteRecordingHandler);

// Weather
router.get('/weather', authenticate, c.weatherHandler);

// Maps
router.get('/maps/state', authenticate, c.mapsStateHandler);
router.get('/maps/search', authenticate, c.mapsSearchHandler);
router.post('/maps/route', authenticate, c.mapsRouteHandler);
router.post('/maps/route/stop', authenticate, c.mapsStopRouteHandler);
router.get('/maps/roadblocks', authenticate, c.mapsRoadBlocksHandler);
router.post('/maps/offline', authenticate, c.mapsOfflineDownloadHandler);
router.get('/maps/offline', authenticate, c.mapsOfflineListHandler);
router.get('/maps/districts', authenticate, c.mapsDistrictsHandler);

// Files
router.get('/files/search', authenticate, c.filesSearchHandler);
router.get('/files/recent', authenticate, c.filesRecentHandler);
router.get('/files/category/:category', authenticate, c.filesCategoryHandler);
router.get('/files/:fileId/preview', authenticate, c.filesPreviewHandler);
router.post('/files/:fileId/move', authenticate, c.filesMoveHandler);
router.post('/files/:fileId/rename', authenticate, c.filesRenameHandler);
router.post('/files/init-folders', authenticate, c.filesInitFoldersHandler);

export default router;
