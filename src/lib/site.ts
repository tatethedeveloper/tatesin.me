export const site = {
  name: 'Tate Sinclair',
  role: 'Software engineer',
  location: 'Glasgow, Scotland', 
  url: 'https://tatesin.me',
  description: 'Tate Sinclair, software engineer in Scotland. Second-year Degree Apprentice, building in the open.',
  email: "tatethedeveloper@gmail.com",
  github: "https://github.com/tatethedeveloper",
  linkedin: "https://www.linkedin.com/in/tate-sinclair-286b0232a",
  // TODO(tate): the site's own repository URL, or leave null. With a value,
  // the footer, the about facts and the empty work state link to it.
  repo: null as string | null,
};

export const nav = [
  { href: '/#work', label: 'Work', id: 'work' },
  { href: '/#about', label: 'About', id: 'about' },
  { href: '/#contact', label: 'Contact', id: 'contact' },
];
