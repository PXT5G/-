import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPoliceVehicle extends Document {
  plateNumber: string;
  make: string;
  vehicleModel: string;
  year: number;
  color: string;
  ownerName: string;
  ownerIdentityNumber?: string;
  ownerPhone?: string;
  status: 'active' | 'stolen' | 'impounded' | 'flagged';
  history: { action: string; officerId?: Types.ObjectId; note?: string; timestamp: Date }[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const policeVehicleSchema = new Schema<IPoliceVehicle>(
  {
    plateNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    make: { type: String, required: true },
    vehicleModel: { type: String, required: true },
    year: { type: Number, required: true },
    color: { type: String, required: true },
    ownerName: { type: String, required: true, index: true },
    ownerIdentityNumber: { type: String, index: true },
    ownerPhone: { type: String },
    status: { type: String, enum: ['active', 'stolen', 'impounded', 'flagged'], default: 'active', index: true },
    history: [{
      action: String,
      officerId: { type: Schema.Types.ObjectId, ref: 'PoliceOfficer' },
      note: String,
      timestamp: { type: Date, default: Date.now },
    }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const PoliceVehicle = mongoose.model<IPoliceVehicle>('PoliceVehicle', policeVehicleSchema);
