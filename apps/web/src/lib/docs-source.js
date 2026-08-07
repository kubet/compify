import { loader } from 'fumadocs-core/source';
import { defineDocs } from 'fumadocs-mdx/macro';

// The repository-level docs are canonical for both GitHub and the website.
// Keeping one source prevents the published docs from drifting from self-host docs.
const docs = defineDocs({
  dir: '../../docs',
});

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});
