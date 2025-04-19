/**
 * Utility to ensure the data directory exists for SQLite database
 */
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

/**
 * Ensures the data directory exists.
 */
export function ensureDataDirectoryExists() {
  const dataDir = process.env.DATABASE_URL?.includes('file:') 
    ? path.dirname(path.resolve(__dirname, '..', process.env.DATABASE_URL.replace('file:', ''))) 
    : path.resolve(__dirname, '..', 'database'); // Default path if not SQLite

  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch (error) {
    }
  }
} 