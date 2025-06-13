import { execSync } from 'child_process';
import assert from 'node:assert';
import { test } from 'node:test';
import path from 'node:path';
import Module, { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve mock modules
process.env.NODE_PATH = path.resolve(__dirname, '__mocks__');
Module._initPaths();

// Compile the TypeScript file to JavaScript for testing
execSync('npx esbuild lib/utils/match-maker.ts --bundle --platform=node --format=cjs --outfile=tmp-match-maker.js --external:@supabase/supabase-js', { stdio: 'inherit' });

// Stub supabase client used by the compiled module
const require = createRequire(import.meta.url);
const supabase = require('@supabase/supabase-js');
const stub = supabase.__stub;

const responses = [
  { user_id: '1', available_dates: ['2024-07-01'] },
  { user_id: '2', available_dates: ['2024-07-01'] },
  { user_id: '3', available_dates: ['2024-07-01'] },
  { user_id: '4', available_dates: ['2024-07-01'] },
];
const survey = { tournament_id: 1, category_id: 1 };

stub.from = (table) => {
  if (table === 'survey_responses') {
    return { select: () => ({ eq: async () => ({ data: responses }) }) };
  }
  if (table === 'availability_surveys') {
    return { select: () => ({ eq: () => ({ single: async () => ({ data: survey }) }) }) };
  }
  if (table === 'matches') {
    return { select: () => ({ eq: () => ({ eq: () => ({ or: async () => ({ data: [] }) }) }) }) };
  }
  if (table === 'users') {
    return { select: () => ({ in: async () => ({ data: [{ category: 1 }, { category: 1 }] }) }) };
  }
  throw new Error('Unknown table ' + table);
};

const { generateMatches } = await import('../tmp-match-maker.js');

test('player scheduled at most once per day', async () => {
  const matches = await generateMatches(1);
  const seen = new Map();
  for (const m of matches) {
    const day = m.scheduled_date;
    if (!seen.has(day)) seen.set(day, new Set());
    const players = seen.get(day);
    assert(!players.has(m.player1_id), 'player1 repeated in same day');
    assert(!players.has(m.player2_id), 'player2 repeated in same day');
    players.add(m.player1_id);
    players.add(m.player2_id);
  }
});
