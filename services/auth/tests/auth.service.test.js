"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const mockExistsByEmail = globals_1.jest.fn();
const mockExistsByUsername = globals_1.jest.fn();
const mockFindByEmail = globals_1.jest.fn();
const mockFindById = globals_1.jest.fn();
const mockCreate = globals_1.jest.fn();
const mockUpdate = globals_1.jest.fn();
const mockResetFailedLoginAttempts = globals_1.jest.fn();
const mockIncrementFailedLoginAttempts = globals_1.jest.fn();
// Session mocks
const mockSessionCreate = globals_1.jest.fn();
const mockSessionFindByUserId = globals_1.jest.fn();
const mockSessionFindByTokenHash = globals_1.jest.fn();
const mockSessionDelete = globals_1.jest.fn();
const mockSessionDeleteByUserId = globals_1.jest.fn();
// Login attempt mock
const mockLoginAttemptCreate = globals_1.jest.fn();
globals_1.jest.mock('../src/repositories/user.repository', () => ({
    userRepository: {
        existsByEmail: mockExistsByEmail,
        existsByUsername: mockExistsByUsername,
        findByEmail: mockFindByEmail,
        findById: mockFindById,
        create: mockCreate,
        update: mockUpdate,
        resetFailedLoginAttempts: mockResetFailedLoginAttempts,
        incrementFailedLoginAttempts: mockIncrementFailedLoginAttempts,
    },
}));
globals_1.jest.mock('../src/repositories/session.repository', () => ({
    sessionRepository: {
        create: mockSessionCreate,
        findByUserId: mockSessionFindByUserId,
        findByTokenHash: mockSessionFindByTokenHash,
        delete: mockSessionDelete,
        deleteByUserId: mockSessionDeleteByUserId,
    },
}));
globals_1.jest.mock('../src/repositories/login-attempt.repository', () => ({
    loginAttemptRepository: {
        create: mockLoginAttemptCreate,
    },
}));
globals_1.jest.mock('../src/utils/jwt', () => ({
    generateAccessToken: globals_1.jest.fn(() => 'mock-access-token'),
    generateRefreshToken: globals_1.jest.fn(() => 'mock-refresh-token'),
    verifyAccessToken: globals_1.jest.fn(),
    verifyRefreshToken: globals_1.jest.fn((token) => ({ userId: 'user-id', email: 'test@example.com', role: 'user' })),
    hashToken: globals_1.jest.fn((token) => Promise.resolve(`hashed-${token}`)),
}));
globals_1.jest.mock('../src/utils/email', () => ({
    sendVerificationEmail: globals_1.jest.fn(() => Promise.resolve()),
    sendPasswordResetEmail: globals_1.jest.fn(() => Promise.resolve()),
}));
globals_1.jest.mock('bcrypt', () => ({
    hash: globals_1.jest.fn(() => Promise.resolve('hashed-password')),
    compare: globals_1.jest.fn(() => Promise.resolve(true)),
}));
(0, globals_1.describe)('AuthService', () => {
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('register', () => {
        (0, globals_1.it)('should register a new user successfully', async () => {
            const { authService } = await Promise.resolve().then(() => __importStar(require('../src/modules/auth/auth.service')));
            mockExistsByEmail.mockResolvedValue(false);
            mockExistsByUsername.mockResolvedValue(false);
            mockCreate.mockResolvedValue({
                id: 'user-id',
                email: 'test@example.com',
                username: 'testuser',
                passwordHash: 'hashed-password',
                firstName: 'Test',
                lastName: 'User',
                isActive: true,
                isVerified: false,
            });
            mockUpdate.mockResolvedValue(true);
            const result = await authService.register({
                email: 'test@example.com',
                password: 'Password123',
                username: 'testuser',
                firstName: 'Test',
                lastName: 'User',
            });
            (0, globals_1.expect)(result).toHaveProperty('user');
            (0, globals_1.expect)(result).toHaveProperty('tokens');
            (0, globals_1.expect)(mockCreate).toHaveBeenCalled();
        });
        (0, globals_1.it)('should throw ConflictError if email already exists', async () => {
            const { authService } = await Promise.resolve().then(() => __importStar(require('../src/modules/auth/auth.service')));
            mockExistsByEmail.mockResolvedValue(true);
            await (0, globals_1.expect)(authService.register({
                email: 'test@example.com',
                password: 'Password123',
                username: 'testuser',
                firstName: 'Test',
                lastName: 'User',
            })).rejects.toThrow('Email already registered');
        });
        (0, globals_1.it)('should throw ConflictError if username already exists', async () => {
            const { authService } = await Promise.resolve().then(() => __importStar(require('../src/modules/auth/auth.service')));
            mockExistsByEmail.mockResolvedValue(false);
            mockExistsByUsername.mockResolvedValue(true);
            await (0, globals_1.expect)(authService.register({
                email: 'test@example.com',
                password: 'Password123',
                username: 'testuser',
                firstName: 'Test',
                lastName: 'User',
            })).rejects.toThrow('Username already taken');
        });
        (0, globals_1.it)('should throw ValidationError if password is too short', async () => {
            const { authService } = await Promise.resolve().then(() => __importStar(require('../src/modules/auth/auth.service')));
            await (0, globals_1.expect)(authService.register({
                email: 'test@example.com',
                password: 'short',
                username: 'testuser',
                firstName: 'Test',
                lastName: 'User',
            })).rejects.toThrow();
        });
    });
    (0, globals_1.describe)('login', () => {
        (0, globals_1.it)('should login successfully with valid credentials', async () => {
            const { authService } = await Promise.resolve().then(() => __importStar(require('../src/modules/auth/auth.service')));
            mockFindByEmail.mockResolvedValue({
                id: 'user-id',
                email: 'test@example.com',
                passwordHash: 'hashed-password',
                isActive: true,
                isVerified: true,
                failedLoginAttempts: 0,
                roles: [{ role: { name: 'user' } }],
            });
            mockSessionCreate.mockResolvedValue({ id: 'session-id' });
            mockResetFailedLoginAttempts.mockResolvedValue(undefined);
            const result = await authService.login({
                email: 'test@example.com',
                password: 'Password123',
            });
            (0, globals_1.expect)(result).toHaveProperty('user');
            (0, globals_1.expect)(result).toHaveProperty('tokens');
        });
        (0, globals_1.it)('should throw UnauthorizedError if user not found', async () => {
            const { authService } = await Promise.resolve().then(() => __importStar(require('../src/modules/auth/auth.service')));
            mockFindByEmail.mockResolvedValue(null);
            mockLoginAttemptCreate.mockResolvedValue(true);
            await (0, globals_1.expect)(authService.login({
                email: 'nonexistent@example.com',
                password: 'Password123',
            })).rejects.toThrow('Invalid email or password');
        });
        (0, globals_1.it)('should throw UnauthorizedError if password is incorrect', async () => {
            const { authService } = await Promise.resolve().then(() => __importStar(require('../src/modules/auth/auth.service')));
            mockFindByEmail.mockResolvedValue({
                id: 'user-id',
                email: 'test@example.com',
                passwordHash: 'hashed-password',
                isActive: true,
                isVerified: true,
                failedLoginAttempts: 0,
            });
            const bcrypt = await Promise.resolve().then(() => __importStar(require('bcrypt')));
            bcrypt.compare.mockResolvedValueOnce(false);
            await (0, globals_1.expect)(authService.login({
                email: 'test@example.com',
                password: 'wrongpassword',
            })).rejects.toThrow();
        });
        (0, globals_1.it)('should throw UnauthorizedError if account is inactive', async () => {
            const { authService } = await Promise.resolve().then(() => __importStar(require('../src/modules/auth/auth.service')));
            mockFindByEmail.mockResolvedValue({
                id: 'user-id',
                email: 'test@example.com',
                passwordHash: 'hashed-password',
                isActive: false,
                isVerified: true,
            });
            await (0, globals_1.expect)(authService.login({
                email: 'test@example.com',
                password: 'Password123',
            })).rejects.toThrow('Account is disabled');
        });
        (0, globals_1.it)('should throw UnauthorizedError if email not verified', async () => {
            const { authService } = await Promise.resolve().then(() => __importStar(require('../src/modules/auth/auth.service')));
            mockFindByEmail.mockResolvedValue({
                id: 'user-id',
                email: 'test@example.com',
                passwordHash: 'hashed-password',
                isActive: true,
                isVerified: false,
            });
            await (0, globals_1.expect)(authService.login({
                email: 'test@example.com',
                password: 'Password123',
            })).rejects.toThrow('Please verify your email before logging in');
        });
    });
    (0, globals_1.describe)('refreshToken', () => {
        (0, globals_1.it)('should refresh token successfully', async () => {
            const { authService } = await Promise.resolve().then(() => __importStar(require('../src/modules/auth/auth.service')));
            mockSessionFindByTokenHash.mockResolvedValue({
                id: 'session-id',
                userId: 'user-id',
                tokenHash: 'hashed-token',
            });
            mockFindById.mockResolvedValue({
                id: 'user-id',
                email: 'test@example.com',
                isActive: true,
                roles: [{ role: { name: 'user' } }],
            });
            const result = await authService.refreshToken('valid-refresh-token');
            (0, globals_1.expect)(result).toHaveProperty('accessToken');
            (0, globals_1.expect)(result).toHaveProperty('refreshToken');
        });
        (0, globals_1.it)('should throw error if session not found', async () => {
            const { authService } = await Promise.resolve().then(() => __importStar(require('../src/modules/auth/auth.service')));
            mockSessionFindByTokenHash.mockResolvedValue(null);
            await (0, globals_1.expect)(authService.refreshToken('invalid-token')).rejects.toThrow('Invalid or expired refresh token');
        });
    });
    (0, globals_1.describe)('logout', () => {
        (0, globals_1.it)('should logout successfully', async () => {
            const { authService } = await Promise.resolve().then(() => __importStar(require('../src/modules/auth/auth.service')));
            mockSessionDeleteByUserId.mockResolvedValue(undefined);
            await (0, globals_1.expect)(authService.logout('user-id')).resolves.not.toThrow();
            (0, globals_1.expect)(mockSessionDeleteByUserId).toHaveBeenCalledWith('user-id');
        });
    });
});
//# sourceMappingURL=auth.service.test.js.map