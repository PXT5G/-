import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { BusinessRole } from '../../constants/business';

export interface IEmployeeWarning {
  warningId: string;
  reason: string;
  issuedBy: Types.ObjectId;
  issuedAt: Date;
}

export interface IEmployeeActivity {
  action: string;
  details?: string;
  timestamp: Date;
  ipAddress?: string;
  deviceUuid?: string;
}

export interface ICompanyEmployee extends Document {
  employeeId: string;
  companyId: string;
  userId: Types.ObjectId;
  branchId?: string;
  departmentId?: string;
  role: BusinessRole;
  jobTitle: string;
  rank: string;
  status: 'active' | 'probation' | 'suspended' | 'terminated' | 'on_leave';
  hireDate: Date;
  terminationDate?: Date;
  salary: number;
  bonus: number;
  commissionRate: number;
  workingHoursPerWeek: number;
  permissions: string[];
  performanceScore: number;
  warnings: IEmployeeWarning[];
  activityLog: IEmployeeActivity[];
  attendance: { date: string; checkIn?: Date; checkOut?: Date; hoursWorked: number }[];
  signatureHash?: string;
  deviceUuid?: string;
  ipAddress?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const warningSchema = new Schema<IEmployeeWarning>(
  {
    warningId: { type: String, required: true },
    reason: { type: String, required: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const activitySchema = new Schema<IEmployeeActivity>(
  {
    action: { type: String, required: true },
    details: { type: String },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String },
    deviceUuid: { type: String },
  },
  { _id: false }
);

const companyEmployeeSchema = new Schema<ICompanyEmployee>(
  {
    employeeId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    branchId: { type: String, index: true },
    departmentId: { type: String, index: true },
    role: { type: String, required: true, index: true },
    jobTitle: { type: String, required: true },
    rank: { type: String, default: 'Staff' },
    status: {
      type: String,
      enum: ['active', 'probation', 'suspended', 'terminated', 'on_leave'],
      default: 'active',
      index: true,
    },
    hireDate: { type: Date, default: Date.now },
    terminationDate: { type: Date },
    salary: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0, min: 0, max: 100 },
    workingHoursPerWeek: { type: Number, default: 40 },
    permissions: { type: [String], default: [] },
    performanceScore: { type: Number, default: 75, min: 0, max: 100 },
    warnings: { type: [warningSchema], default: [] },
    activityLog: { type: [activitySchema], default: [] },
    attendance: { type: [{ date: String, checkIn: Date, checkOut: Date, hoursWorked: Number }], default: [] },
    signatureHash: { type: String },
    deviceUuid: { type: String },
    ipAddress: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

companyEmployeeSchema.index({ companyId: 1, userId: 1 }, { unique: true });

export const CompanyEmployee = mongoose.model<ICompanyEmployee>('CompanyEmployee', companyEmployeeSchema);
