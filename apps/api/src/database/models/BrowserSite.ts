import mongoose, { Schema, Document } from 'mongoose';
import type { PortalType } from '../../constants/browser';

export interface IBrowserSite extends Document {
  siteId: string;
  url: string;
  title: string;
  description: string;
  portalType: PortalType;
  content: string;
  deepLink?: string;
  requiresIdentity: boolean;
  httpsOnly: boolean;
  favicon?: string;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const browserSiteSchema = new Schema<IBrowserSite>(
  {
    siteId: { type: String, required: true, unique: true, index: true },
    url: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    portalType: { type: String, required: true, index: true },
    content: { type: String, required: true },
    deepLink: { type: String },
    requiresIdentity: { type: Boolean, default: false },
    httpsOnly: { type: Boolean, default: true },
    favicon: { type: String },
    enabled: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const BrowserSite = mongoose.model<IBrowserSite>('BrowserSite', browserSiteSchema);
