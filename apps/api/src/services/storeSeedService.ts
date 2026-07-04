import { App } from '../database/models/App';
import { Developer } from '../database/models/Developer';
import { StoreListing } from '../database/models/StoreListing';
import { AppVersion } from '../database/models/AppVersion';
import { StoreReview } from '../database/models/StoreReview';

const STORE_APPS = [
  {
    bundleId: 'com.bananaos.identity',
    name: 'Identity',
    version: '1.0.0',
    description: 'Digital identity card with verification',
    icon: '🪪',
    category: 'utilities' as const,
    permissions: ['storage', 'camera'] as const,
    tagline: 'Your digital identity, verified.',
    longDescription: 'Premium digital identity for BananaOS with QR verification, PDF export, and admin verification.',
    screenshots: ['🪪', '📱', '✅'],
    featured: true,
    trending: true,
    editorsChoice: true,
    recommended: true,
    verified: true,
    premium: false,
    storageSize: 45_000_000,
    trendingScore: 98,
    developer: { slug: 'bananaos-official', name: 'BananaOS Official', verified: true },
  },
  {
    bundleId: 'com.bananaos.bank',
    name: 'Banana Bank',
    version: '2.1.0',
    description: 'Advanced digital banking',
    icon: '🏦',
    category: 'finance' as const,
    permissions: ['network', 'notifications', 'biometrics'] as const,
    tagline: 'Banking reimagined.',
    longDescription: 'Full-featured banking with transfers, QR payments, analytics, and fraud detection.',
    screenshots: ['🏦', '💳', '📊'],
    featured: true,
    trending: true,
    editorsChoice: true,
    recommended: true,
    verified: true,
    premium: true,
    price: 0,
    storageSize: 120_000_000,
    trendingScore: 95,
    developer: { slug: 'bananaos-official', name: 'BananaOS Official', verified: true },
  },
  {
    bundleId: 'com.bananaos.phone',
    name: 'Phone',
    version: '1.2.0',
    description: 'Calls, voicemail, and favorites',
    icon: '📞',
    category: 'communication' as const,
    permissions: ['microphone', 'contacts', 'notifications'] as const,
    tagline: 'Crystal clear calls.',
    longDescription: 'Full telephony with dial pad, conference calls, and beautiful call animations.',
    screenshots: ['📞', '⭐', '📋'],
    featured: true,
    trending: true,
    recommended: true,
    verified: true,
    storageSize: 65_000_000,
    trendingScore: 92,
    developer: { slug: 'bananaos-official', name: 'BananaOS Official', verified: true },
  },
  {
    bundleId: 'com.bananaos.messages',
    name: 'Messages',
    version: '1.1.0',
    description: 'SMS with attachments and read receipts',
    icon: '💬',
    category: 'communication' as const,
    permissions: ['contacts', 'photos', 'camera', 'microphone', 'notifications'] as const,
    tagline: 'Message beautifully.',
    longDescription: 'Rich messaging with voice notes, media sharing, and realtime delivery.',
    screenshots: ['💬', '📷', '🎤'],
    featured: false,
    trending: true,
    recommended: true,
    verified: true,
    storageSize: 80_000_000,
    trendingScore: 88,
    developer: { slug: 'bananaos-official', name: 'BananaOS Official', verified: true },
  },
  {
    bundleId: 'com.bananaos.police',
    name: 'Police',
    version: '1.0.0',
    description: 'Professional police platform',
    icon: '🚔',
    category: 'utilities' as const,
    permissions: ['location', 'camera', 'notifications', 'network'] as const,
    tagline: 'Serve and protect.',
    longDescription: 'Dispatch, reports, tickets, and internal communication for law enforcement.',
    screenshots: ['🚔', '📋', '🗺️'],
    featured: true,
    trending: false,
    editorsChoice: true,
    verified: true,
    premium: true,
    storageSize: 150_000_000,
    trendingScore: 75,
    developer: { slug: 'bananaos-gov', name: 'BananaOS Government', verified: true },
  },
  {
    bundleId: 'com.bananaos.social',
    name: 'Banana Social',
    version: '1.0.0',
    description: 'Social feed and trending',
    icon: '🐦',
    category: 'social' as const,
    permissions: ['photos', 'camera', 'notifications', 'network'] as const,
    tagline: 'What\'s happening?',
    longDescription: 'Original social feed with posts, replies, reposts, and verified accounts.',
    screenshots: ['🐦', '📈', '✓'],
    featured: false,
    trending: true,
    recommended: true,
    verified: true,
    storageSize: 95_000_000,
    trendingScore: 85,
    developer: { slug: 'banana-studios', name: 'Banana Studios', verified: true },
  },
  {
    bundleId: 'com.bananaos.camera',
    name: 'Camera',
    version: '1.0.0',
    description: 'Photo and video capture',
    icon: '📷',
    category: 'media' as const,
    permissions: ['camera', 'microphone', 'storage'] as const,
    tagline: 'Capture the moment.',
    longDescription: 'Professional camera with portrait mode, flash, zoom, and gallery integration.',
    screenshots: ['📷', '🎬', '✨'],
    featured: false,
    trending: true,
    verified: true,
    storageSize: 110_000_000,
    trendingScore: 80,
    developer: { slug: 'banana-studios', name: 'Banana Studios', verified: true },
  },
  {
    bundleId: 'com.bananaos.calculator',
    name: 'Calculator',
    version: '1.0.0',
    description: 'Standard and scientific calculator',
    icon: '🔢',
    category: 'utilities' as const,
    permissions: [] as const,
    tagline: 'Calculate anything.',
    longDescription: 'Beautiful calculator with scientific mode and history.',
    screenshots: ['🔢'],
    featured: false,
    trending: false,
    recommended: true,
    verified: true,
    storageSize: 12_000_000,
    trendingScore: 60,
    developer: { slug: 'banana-studios', name: 'Banana Studios', verified: false },
  },
];

export async function seedBananaStore(): Promise<{ apps: number; developers: number; reviews: number }> {
  let developerCount = 0;
  const developerMap = new Map<string, string>();

  for (const appData of STORE_APPS) {
    const devKey = appData.developer.slug;
    if (!developerMap.has(devKey)) {
      const dev = await Developer.findOneAndUpdate(
        { slug: devKey },
        {
          slug: devKey,
          name: appData.developer.name,
          description: `Official developer for ${appData.developer.name}`,
          logo: '🍌',
          verified: appData.developer.verified,
        },
        { upsert: true, new: true }
      );
      developerMap.set(devKey, dev._id.toString());
      developerCount++;
    }

    const app = await App.findOneAndUpdate(
      { bundleId: appData.bundleId },
      {
        bundleId: appData.bundleId,
        name: appData.name,
        version: appData.version,
        description: appData.description,
        icon: appData.icon,
        category: appData.category,
        permissions: appData.permissions,
        isSystemApp: false,
        isPublished: true,
      },
      { upsert: true, new: true }
    );

    await StoreListing.findOneAndUpdate(
      { bundleId: appData.bundleId },
      {
        appId: app._id,
        bundleId: appData.bundleId,
        developerId: developerMap.get(devKey),
        tagline: appData.tagline,
        longDescription: appData.longDescription,
        screenshots: appData.screenshots,
        featured: appData.featured ?? false,
        trending: appData.trending ?? false,
        editorsChoice: appData.editorsChoice ?? false,
        recommended: appData.recommended ?? false,
        verified: appData.verified ?? false,
        premium: appData.premium ?? false,
        price: appData.price ?? 0,
        storageSize: appData.storageSize,
        category: appData.category,
        permissions: appData.permissions,
        trendingScore: appData.trendingScore,
        tags: [appData.category, appData.name.toLowerCase()],
        ratingAverage: 4.2 + Math.random() * 0.7,
        ratingCount: Math.floor(Math.random() * 500) + 50,
        downloadCount: Math.floor(Math.random() * 10000) + 1000,
      },
      { upsert: true, new: true }
    );

    await AppVersion.findOneAndUpdate(
      { bundleId: appData.bundleId, version: appData.version },
      {
        appId: app._id,
        bundleId: appData.bundleId,
        version: appData.version,
        changelog: `Initial release of ${appData.name}`,
        size: appData.storageSize,
      },
      { upsert: true }
    );
  }

  // Sample reviews for bank app
  const bankListing = await StoreListing.findOne({ bundleId: 'com.bananaos.bank' });
  if (bankListing) {
    const sampleReviews = [
      { username: 'alex_b', rating: 5, title: 'Best mobile bank', body: 'Incredibly smooth transfers and beautiful UI.' },
      { username: 'maria_k', rating: 4, title: 'Great features', body: 'QR payments work flawlessly. Would love more analytics.' },
      { username: 'john_d', rating: 5, title: 'Premium experience', body: 'Feels like a real bank app. Security is top notch.' },
    ];

    for (const r of sampleReviews) {
      await StoreReview.findOneAndUpdate(
        { bundleId: 'com.bananaos.bank', username: r.username },
        {
          listingId: bankListing._id,
          bundleId: 'com.bananaos.bank',
          userId: bankListing._id,
          ...r,
        },
        { upsert: true }
      );
    }
  }

  await Developer.updateMany({}, [{ $set: { appCount: 0 } }]);
  for (const [slug, id] of developerMap) {
    const count = STORE_APPS.filter((a) => a.developer.slug === slug).length;
    await Developer.findByIdAndUpdate(id, { appCount: count });
  }

  return {
    apps: STORE_APPS.length,
    developers: developerMap.size,
    reviews: 3,
  };
}
