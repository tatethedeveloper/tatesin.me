// TODO(tate): a first draft, written from what's in the repo (skills.ts,
// the Aegis OS project, the degree apprenticeship). Read it and edit freely —
// especially the first paragraph, which is the one only you can actually
// confirm. Replace any `placeholder` entry the same way.

export type AboutBlock = { text: string } | { placeholder: string };

export const about: AboutBlock[] = [
  {
    text: "I'm a second-year software engineering degree apprentice, working mostly in cloud and data platforms day to day. Lately I'm more drawn to the layer underneath that: what a system is actually doing, and where it can be made to fail.",
  },
  {
    text: "That's the reason for Aegis OS, the Rust project I'm building now. I'm learning Rust and picking up machine learning alongside it with PyTorch and TensorFlow, working towards being someone who can build a system and also reason about how it breaks.",
  },
];
