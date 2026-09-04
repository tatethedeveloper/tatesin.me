// TODO(tate): fill these in. Until an array has an item, the section renders
// a visible placeholder in its place. Group by honest proficiency, no ratings.

export const skills: { heading: string; placeholder: string; items: string[] }[] = [
  {
    heading: 'Working in',
    placeholder: 'TOOLS YOU CAN WORK IN TODAY',
    items: ['Azure', 'Google Cloud Platform', 'Python', 'PHP', 'HTML', 'CSS','Palantir Foundry', 'Palantir AIP', 'SQLite', 'MySQL', 'Claude Code', ],
  },
  {
    heading: 'Learning',
    placeholder: 'WHAT YOU ARE LEARNING RIGHT NOW',
    items: ['PyTorch', 'TensorFlow', 'Rust'],
  },
  {
    heading: 'Certifications',
    placeholder: 'CERTIFICATIONS YOU HAVE EARNED',
    items: ['Palantir Certified: Foundry Aware', 'Ontologize Certified: Foundry & AIP Powered ERP Migrations', 'Tryhackme Certified: JR Penetration Tester'],
  }
];
