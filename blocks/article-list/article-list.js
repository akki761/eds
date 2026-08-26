import { createOptimizedPicture } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

const PAGE_SIZE = 10;
const DEFAULT_SOURCE = '/docs/eds/query-index.json';

/**
 * Fetches a single page of index rows using the offset/limit API.
 * @param {string} source The index JSON path/url
 * @param {number} offset The row offset to start from
 * @param {number} limit The number of rows to fetch
 * @returns {Promise<{data: object[], total: number}>}
 */
async function fetchPage(source, offset, limit) {
  const url = new URL(source, window.location.origin);
  url.searchParams.set('offset', offset);
  url.searchParams.set('limit', limit);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Could not load ${url.pathname} (${resp.status})`);
  const json = await resp.json();
  return { data: json.data || [], total: json.total || 0 };
}

/**
 * Builds a single article card (an <li> linking to the page).
 * @param {object} item An index row (path, title, description, image, ...)
 * @returns {HTMLElement|null} The card element, or null for empty rows
 */
function createCard(item) {
  // skip rows with no meaningful content (e.g. helper/fragment pages)
  if (!item.title && !item.description && !item.image) return null;

  const li = document.createElement('li');
  li.className = 'article-list-card';

  const link = document.createElement('a');
  link.className = 'article-list-link';
  link.href = item.path;

  if (item.image) {
    const imageWrap = document.createElement('div');
    imageWrap.className = 'article-list-image';
    imageWrap.append(createOptimizedPicture(item.image, item.title || '', false, [{ width: '750' }]));
    link.append(imageWrap);
  }

  const body = document.createElement('div');
  body.className = 'article-list-body';

  if (item.title) {
    const heading = document.createElement('h3');
    heading.textContent = item.title;
    body.append(heading);
  }
  if (item.description) {
    const desc = document.createElement('p');
    desc.textContent = item.description;
    body.append(desc);
  }
  const metaBits = [item.author, item.date].filter(Boolean);
  if (metaBits.length) {
    const meta = document.createElement('p');
    meta.className = 'article-list-meta';
    meta.textContent = metaBits.join(' · ');
    body.append(meta);
  }

  link.append(body);
  li.append(link);
  return li;
}

/**
 * Loads and decorates the Article List block.
 *
 * Authoring: an optional single cell with the path to an index
 * (as text or a link, e.g. "/query-index.json" or a scoped index). If omitted,
 * the default site index is used. Cards are paged 10 at a time via the index's
 * offset/limit API; the "Load more" label comes from placeholders (Key: load-more).
 *
 * @param {Element} block The article-list block element
 */
export default async function decorate(block) {
  // resolve the data source from an authored link/text, else use the default index
  const link = block.querySelector('a');
  let source = (link ? link.getAttribute('href') : block.textContent).trim();
  if (!source) source = DEFAULT_SOURCE;
  if (!source.endsWith('.json')) source += '.json';

  block.textContent = '';

  // load placeholders + the first page in parallel
  let placeholders = {};
  let firstPage;
  try {
    [placeholders, firstPage] = await Promise.all([
      fetchPlaceholders('/docs/sheet'),
      fetchPage(source, 0, PAGE_SIZE),
    ]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Article List: unable to load data', error);
    const msg = document.createElement('p');
    msg.className = 'article-list-error';
    msg.textContent = 'Unable to load articles right now.';
    block.append(msg);
    return;
  }

  if (!firstPage.data.length) return;

  const list = document.createElement('ul');
  list.className = 'article-list-items';
  block.append(list);

  // "Load more" button, label sourced from placeholders
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'article-list-more';
  button.textContent = placeholders.loadMore || 'Load more';

  const { total } = firstPage;
  let offset = 0;

  const appendItems = (items) => {
    items.forEach((item) => {
      const card = createCard(item);
      if (card) list.append(card);
    });
    // advance by the number of rows fetched (not rendered) to keep paging correct
    offset += items.length;
    if (!items.length || offset >= total) button.hidden = true;
  };

  // fetch and append the next page on demand
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const { data } = await fetchPage(source, offset, PAGE_SIZE);
      appendItems(data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Article List: unable to load more', error);
    } finally {
      button.disabled = false;
    }
  });

  block.append(button);
  appendItems(firstPage.data);
}
