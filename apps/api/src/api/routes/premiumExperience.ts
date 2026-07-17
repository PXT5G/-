import { Router } from 'express';
import * as premiumExperienceController from '../controllers/premiumExperienceController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/initialize', authenticate, premiumExperienceController.initializeHandler);
router.get('/profile', authenticate, premiumExperienceController.getProfileHandler);
router.patch('/profile', authenticate, premiumExperienceController.updateProfileHandler);
router.post('/track-app', authenticate, premiumExperienceController.trackAppUsageHandler);
router.post('/quick-notes', authenticate, premiumExperienceController.addQuickNoteHandler);
router.get('/app-library', authenticate, premiumExperienceController.getAppLibraryHandler);
router.get('/notifications/history', authenticate, premiumExperienceController.getNotificationHistoryHandler);
router.post('/notifications/:notificationId/pin', authenticate, premiumExperienceController.pinNotificationHandler);

router.get('/widgets/registry', authenticate, premiumExperienceController.getWidgetRegistryHandler);
router.get('/widgets/:type/data', authenticate, premiumExperienceController.getWidgetDataHandler);
router.post('/widgets/batch', authenticate, premiumExperienceController.getBatchWidgetDataHandler);

export default router;
