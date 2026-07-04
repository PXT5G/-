import mongoose, { Schema, Document } from 'mongoose';

export interface IFileNode extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size?: number;
  parentId?: mongoose.Types.ObjectId;
  path: string;
  content?: string;
  createdAt: Date;
  updatedAt: Date;
}

const fileNodeSchema = new Schema<IFileNode>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['file', 'folder'], required: true },
    mimeType: { type: String },
    size: { type: Number, default: 0 },
    parentId: { type: Schema.Types.ObjectId, ref: 'FileNode', default: null },
    path: { type: String, required: true },
    content: { type: String },
  },
  { timestamps: true }
);

fileNodeSchema.index({ userId: 1, parentId: 1, name: 1 }, { unique: true });
fileNodeSchema.index({ userId: 1, path: 1 });

export const FileNode = mongoose.model<IFileNode>('FileNode', fileNodeSchema);
