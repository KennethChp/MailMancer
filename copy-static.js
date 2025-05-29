// Simple script to copy static files to the dist folder
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure dist/js directory exists
const jsDir = path.join(__dirname, 'dist', 'js');
if (!fs.existsSync(jsDir)) {
  fs.mkdirSync(jsDir, { recursive: true });
  console.log('Created directory:', jsDir);
}

// Copy JS files
const jsFiles = fs.readdirSync(path.join(__dirname, 'public', 'js'));
jsFiles.forEach(file => {
  const src = path.join(__dirname, 'public', 'js', file);
  const dest = path.join(__dirname, 'dist', 'js', file);
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} to ${dest}`);
});

// Files to copy from public to dist
const filesToCopy = [
  'content.css',
  'manifest.json',
  'options.html',
  'options.css'
];

filesToCopy.forEach(file => {
  const src = path.join(__dirname, 'public', file);
  const dest = path.join(__dirname, 'dist', file);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${src} to ${dest}`);
  } else {
    console.warn(`Warning: File ${src} does not exist`);
  }
});

console.log('Static files copied successfully!');
