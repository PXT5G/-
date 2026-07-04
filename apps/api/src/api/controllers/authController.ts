import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { User } from '../../database/models/User';
import { Session } from '../../database/models/Session';
import { UserSettings } from '../../database/models/UserSettings';
import { AuthRequest } from '../middleware/auth';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from '../../services/jwtService';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(50).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const pinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/),
});

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = registerSchema.parse(req.body);

  const existing = await User.findOne({
    $or: [{ email: data.email }, { username: data.username }],
  });
  if (existing) {
    throw new AppError(409, 'User already exists');
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const user = await User.create({
    username: data.username,
    email: data.email,
    password: hashedPassword,
    displayName: data.displayName ?? data.username,
  });

  await UserSettings.create({ userId: user._id });

  const { ensureDeviceProfile } = await import('../../services/deviceStorageService');
  await ensureDeviceProfile(user._id.toString());

  const deviceId = uuidv4();
  const sessionId = uuidv4();
  const refreshToken = generateRefreshToken(user._id.toString(), sessionId);

  await Session.create({
    userId: user._id,
    refreshToken,
    deviceId,
    deviceName: req.headers['user-agent']?.slice(0, 50) ?? 'Unknown Device',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    expiresAt: getRefreshTokenExpiry(),
  });

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    username: user.username,
    role: user.role,
    sessionId,
  });

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    },
  });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = loginSchema.parse(req.body);

  const user = await User.findOne({ email: data.email }).select('+password');
  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) {
    throw new AppError(401, 'Invalid credentials');
  }

  const deviceId = uuidv4();
  const sessionId = uuidv4();
  const refreshToken = generateRefreshToken(user._id.toString(), sessionId);

  await Session.create({
    userId: user._id,
    refreshToken,
    deviceId,
    deviceName: req.headers['user-agent']?.slice(0, 50) ?? 'Unknown Device',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    expiresAt: getRefreshTokenExpiry(),
  });

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    username: user.username,
    role: user.role,
    sessionId,
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    },
  });
});

export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    throw new AppError(400, 'Refresh token required');
  }

  const { userId, sessionId } = verifyRefreshToken(refreshToken);
  const session = await Session.findOne({ refreshToken, userId });
  if (!session) {
    throw new AppError(401, 'Invalid session');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(401, 'User not found');
  }

  session.lastActiveAt = new Date();
  await session.save();

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    username: user.username,
    role: user.role,
    sessionId,
  });

  res.json({
    success: true,
    data: { accessToken, expiresIn: 900 },
  });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (refreshToken) {
    await Session.deleteOne({ refreshToken });
  } else if (req.user?.sessionId) {
    await Session.deleteMany({ userId: req.user.userId });
  }

  res.json({ success: true, message: 'Logged out successfully' });
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.json({
    success: true,
    data: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  });
});

export const setPin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = pinSchema.parse(req.body);
  const hashedPin = await bcrypt.hash(data.pin, 10);
  await User.findByIdAndUpdate(req.user!.userId, { pin: hashedPin });
  res.json({ success: true, message: 'PIN set successfully' });
});

export const verifyPin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = pinSchema.parse(req.body);
  const user = await User.findById(req.user!.userId).select('+pin');
  if (!user?.pin) {
    throw new AppError(400, 'PIN not configured');
  }

  const valid = await bcrypt.compare(data.pin, user.pin);
  if (!valid) {
    throw new AppError(401, 'Invalid PIN');
  }

  res.json({ success: true, message: 'PIN verified' });
});

export const getSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sessions = await Session.find({ userId: req.user!.userId })
    .sort({ lastActiveAt: -1 })
    .select('-refreshToken');

  res.json({
    success: true,
    data: sessions.map((s) => ({
      id: s._id.toString(),
      userId: s.userId.toString(),
      deviceId: s.deviceId,
      deviceName: s.deviceName,
      ipAddress: s.ipAddress,
      lastActiveAt: s.lastActiveAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
    })),
  });
});

export const revokeSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  await Session.deleteOne({ _id: sessionId, userId: req.user!.userId });
  res.json({ success: true, message: 'Session revoked' });
});
