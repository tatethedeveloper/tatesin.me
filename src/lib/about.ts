// TODO(tate): the about section. Each entry is either a real paragraph or a
// placeholder label. Replace `placeholder` entries with `text` entries.

export type AboutBlock = { text: string } | { placeholder: string };

export const about: AboutBlock[] = [
  { placeholder: 'SHORT BIO: WHAT YOU ARE DRAWN TO IN SOFTWARE' },
  { placeholder: 'WHAT YOU ARE LEARNING, AND WHAT YOU ARE WORKING TOWARDS' },
];
