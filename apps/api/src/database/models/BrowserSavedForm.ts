import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBrowserSavedForm extends Document {
  formId: string;
  userId: Types.ObjectId;
  origin: string;
  fieldName: string;
  fieldValue: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const browserSavedFormSchema = new Schema<IBrowserSavedForm>(
  {
    formId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    origin: { type: String, required: true, index: true },
    fieldName: { type: String, required: true },
    fieldValue: { type: String, required: true },
  },
  { timestamps: true }
);

export const BrowserSavedForm = mongoose.model<IBrowserSavedForm>('BrowserSavedForm', browserSavedFormSchema);
