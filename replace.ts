import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (filepath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const colorMap: Record<string, string> = {
  'bg-stone-900': 'bg-blue-600',
  'bg-stone-950': 'bg-blue-700',
  'text-stone-900': 'text-blue-900',
  'border-stone-900': 'border-blue-600',
  'border-stone-800': 'border-blue-800',
  'border-stone-950': 'border-blue-700',
  'hover:bg-stone-850': 'hover:bg-blue-700',
  'bg-stone-800': 'bg-orange-500',
  'text-stone-800': 'text-orange-600',
  '-stone-50': '-slate-50',
  '-stone-100': '-slate-100',
  '-stone-200': '-slate-200',
  '-stone-300': '-slate-300',
  '-stone-400': '-slate-400',
  '-stone-500': '-slate-500',
  '-stone-600': '-slate-600',
  '-stone-700': '-slate-700'
};

walkDir('./src', (filepath) => {
  if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
    let content = fs.readFileSync(filepath, 'utf-8');
    for (const [key, value] of Object.entries(colorMap)) {
      content = content.split(key).join(value);
    }
    fs.writeFileSync(filepath, content, 'utf-8');
  }
});
