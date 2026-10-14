export const CITATION_FORMATS = [
  { id: 'bib', label: 'BibTeX' },
  { id: 'chicago', label: 'Chicago' },
  { id: 'apa', label: 'APA' },
  { id: 'gb', label: 'GB/T' }
];
const nameParts = name => { const parts = name.split(' '); return { last: parts.pop(), initials: parts.map(part => part[0] + '.').join(' ') }; };
export function formatCitation(paper, format) {
  if (format === 'bib') return paper.bibtex;
  const names = paper.authors.map(author => nameParts(author.name));
  const url = paper.doi ? 'https://doi.org/' + paper.doi : paper.arxiv;
  if (format === 'apa') {
    const authors = names.map(({ last, initials }) => `${last}, ${initials}`);
    const joined = authors.length > 1 ? authors.slice(0, -1).join(', ') + ', & ' + authors.at(-1) : authors[0];
    const title = paper.titleSentence;
    return `${joined} (${paper.year}). ${title}. ${paper.journal ? `${paper.journal}, ${paper.volume}, ${paper.pages}.` : 'arXiv.'} ${url}`;
  }
  if (format === 'gb') {
    const authors = names.slice(0, 3).map(({last, initials}) => `${last.toUpperCase()} ${initials.replaceAll('.', '').toUpperCase()}`).join(', ') + (names.length > 3 ? ', et al.' : '');
    return paper.journal
      ? `${authors.replace(/\.$/, '')}. ${paper.title}[J]. ${paper.journal}, ${paper.year}, ${paper.volume}: ${paper.pages}. DOI: ${paper.doi}.`
      : `${authors.replace(/\.$/, '')}. ${paper.title}[EB/OL]. (${paper.year})[${new Date().toISOString().slice(0, 10)}]. ${url}.`;
  }
  const fullNames = paper.authors.map(author => author.name);
  const first = nameParts(fullNames[0]);
  const authors = [`${first.last}, ${fullNames[0].split(' ').slice(0, -1).join(' ')}`, ...fullNames.slice(1)];
  const joined = authors.length > 1 ? authors.slice(0, -1).join(', ') + ', and ' + authors.at(-1) : authors[0];
  return `${joined}. “${paper.title}.” ${paper.journal ? `${paper.journal} ${paper.volume} (${paper.year}): ${paper.pages}.` : `arXiv preprint arXiv:${paper.arxivId} (${paper.year}).`} ${url}.`;
}
