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
  'prose-stone': 'prose-slate',
  'ring-stone-800': 'ring-blue-800',
  'text-stone-850': 'text-blue-800',
  'bg-stone-150': 'bg-slate-100',
  'border-stone-150': 'border-slate-200',
  'divide-stone-150': 'divide-slate-200',
  'border-stone-250': 'border-slate-300',
  'bg-stone-250': 'bg-slate-300'
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
