import { fetchPlaceholders } from '../../scripts/placeholders.js';

const PAGE_SIZE = 10;
const DEFAULT_SOURCE = '/docs/sheet/employee.json';

/**
 * Fetches a single page of rows from the sheet using the offset/limit API.
 * @param {string} source The sheet JSON path/url
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
 * Loads and decorates the Employee List block.
 *
 * Authoring: an optional single cell with the path to the employee sheet
 * (as text or a link, e.g. "/docs/sheet/employee"). If omitted, the default
 * sheet is used. Rows are paged 10 at a time via the sheet's offset/limit API,
 * fetching the next page on each click. The "Load more" label comes from the
 * placeholders sheet (Key: load-more), falling back to "Load more".
 *
 * @param {Element} block The employee-list block element
 */
export default async function decorate(block) {
  // resolve the data source from an authored link/text, else use the default
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
    console.error('Employee List: unable to load data', error);
    const msg = document.createElement('p');
    msg.className = 'employee-list-error';
    msg.textContent = 'Unable to load employees right now.';
    block.append(msg);
    return;
  }

  if (!firstPage.data.length) return;

  // build the table using the sheet's own column order
  const columns = Object.keys(firstPage.data[0]);
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  columns.forEach((col) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = col;
    headRow.append(th);
  });
  thead.append(headRow);
  const tbody = document.createElement('tbody');
  table.append(thead, tbody);

  const tableScroll = document.createElement('div');
  tableScroll.className = 'employee-list-table';
  tableScroll.append(table);
  block.append(tableScroll);

  // "Load more" button, label sourced from placeholders
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'employee-list-more';
  button.textContent = placeholders.loadMore || 'Load more';

  const { total } = firstPage;
  let offset = 0;

  const appendRows = (rows) => {
    rows.forEach((emp) => {
      const tr = document.createElement('tr');
      columns.forEach((col) => {
        const td = document.createElement('td');
        td.textContent = emp[col] || '';
        tr.append(td);
      });
      tbody.append(tr);
    });
    offset += rows.length;
    if (!rows.length || offset >= total) button.hidden = true;
  };

  // fetch and append the next page on demand
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const { data } = await fetchPage(source, offset, PAGE_SIZE);
      appendRows(data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Employee List: unable to load more', error);
    } finally {
      button.disabled = false;
    }
  });

  block.append(button);
  appendRows(firstPage.data);
}
