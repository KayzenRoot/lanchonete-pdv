/**
 * Utility to ensure the data directory exists for SQLite database
 */
import fs from 'fs';
import path from 'path';

export function ensureDataDirectoryExists(): void {
  const dataDir = process.env.NODE_ENV === 'production'
    ? '/opt/render/project/src/data'
    : path.join(__dirname, '../../data');

  if (!fs.existsSync(dataDir)) {
    console.log(`Creating data directory at ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
  } else {
    console.log(`Data directory exists at ${dataDir}`);
  }
} 