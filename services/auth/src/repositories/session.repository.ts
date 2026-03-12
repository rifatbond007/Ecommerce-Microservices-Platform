import prisma from './prisma.client';
import { v4 as uuidv4 } from 'uuid';

export interface CreateSessionData {
  userId: string;
  tokenHash: string;
  deviceInfo?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

export interface SessionData {
  id: string;
  userId: string;
  tokenHash: string;
  deviceInfo: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
}

export class SessionRepository {
  async findById(id: string): Promise<SessionData | null> {
    return prisma.session.findUnique({
      where: { id },
    }) as Promise<SessionData | null>;
  }

  async findByTokenHash(tokenHash: string): Promise<SessionData | null> {
    return prisma.session.findUnique({
      where: { tokenHash },
    }) as Promise<SessionData | null>;
  }

  async findByUserId(userId: string): Promise<SessionData[]> {
    return prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<SessionData[]>;
  }

  async create(data: CreateSessionData): Promise<SessionData> {
    return prisma.session.create({
      data: {
        id: uuidv4(),
        userId: data.userId,
        tokenHash: data.tokenHash,
        deviceInfo: data.deviceInfo ? JSON.stringify(data.deviceInfo) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt: data.expiresAt,
      },
    }) as Promise<SessionData>;
  }

  async updateLastActivity(id: string): Promise<SessionData> {
    return prisma.session.update({
      where: { id },
      data: {
        lastActivityAt: new Date(),
      },
    }) as Promise<SessionData>;
  }

  async delete(id: string): Promise<void> {
    await prisma.session.delete({
      where: { id },
    });
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await prisma.session.delete({
      where: { tokenHash },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  async deleteExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }

  async deleteAllExceptCurrent(userId: string, currentSessionId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        userId,
        id: { not: currentSessionId },
      },
    });
  }
}

export const sessionRepository = new SessionRepository();
