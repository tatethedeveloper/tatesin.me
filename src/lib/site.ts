// Site-wide constants. Anything not present in this repository is null and
// renders as a visible [ADD: ...] placeholder. Fill a value in to replace it.

export const site = {
  name: 'Tate Sinclair',
  role: 'Software engineer',
  location: 'Glasgow, Scotland', 
  url: 'https://tatesin.me',
  description: 'Tate Sinclair, software engineer in Scotland. Early career, building in the open.',
  // TODO(tate): real email address. Set to a string to replace the placeholder.
  email: null as string | null,
  // TODO(tate): real GitHub profile URL. Set to a string to replace the placeholder.
  github: null as string | null,
  // TODO(tate): real LinkedIn URL. Set to a string to replace the placeholder.
  linkedin: null as string | null,
  // The site's own source. Public repo is part of the portfolio.
  repo: 'https://github.com/tatethedeveloper/tatesin.me',
};

export const nav = [
  { href: '/#work', label: 'Work', id: 'work' },
  { href: '/#about', label: 'About', id: 'about' },
  { href: '/#contact', label: 'Contact', id: 'contact' },
];
