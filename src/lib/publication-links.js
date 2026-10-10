/** Full-text destinations shared by the paper hero and floating controls. */
export function getFullTextLinks(publication, { arxivPdf = true } = {}) {
	return [
		...(publication.paper ? [{
			href: publication.paper,
			icon: 'file',
			label: 'IEEE',
			ariaLabel: 'Read the IEEE article',
			title: 'Read the IEEE article',
			fullText: true
		}] : []),
		...(publication.arxiv ? [{
			href: arxivPdf ? publication.arxiv.replace('/abs/', '/pdf/') : publication.arxiv,
			icon: arxivPdf ? 'download' : 'file',
			label: arxivPdf ? 'arXiv PDF' : 'arXiv',
			ariaLabel: arxivPdf ? 'Read the full paper as an arXiv PDF' : 'View the paper on arXiv',
			title: arxivPdf ? 'Read the arXiv PDF' : 'View the paper on arXiv',
			fullText: true
		}] : [])
	];
}
