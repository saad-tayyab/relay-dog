// ─── Re-export all domain modules ───
//
// This file serves as the single entry point for @relayscope/shared.
// Each domain module contains types for a specific bounded context.
// Prefer importing from the specific domain module for clarity:

export * from './api';
export * from './auth';
export * from './directory';
export * from './event';
export * from './nip11';
export * from './relay';
