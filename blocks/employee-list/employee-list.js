import { fetchPlaceholders } from '../../scripts/placeholders.js';

const PAGE_SIZE = 10;
const DEFAULT_SOURCE = '/docs/sheet/employee.json';

/**
 * Fetches the sheet data rows from the given JSON url.
 * @param {string} url The sheet JSON url
 * @returns {Promise<object[]>} The array of row objects
 */
async function fetchEmployees(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Could not load ${url} (${resp.status})`);
  const { data = [] } = await resp.json();
  return data;
}

/**
 * Loads and decorates the Employee List block.
 *
 * Authoring: an optional single cell with the path to the employee sheet
 * (as text or a link, e.g. "/docs/sheet/employee"). If omitted, the default
 * sheet is used. The "Load more" label comes from the placeholders sheet
 * (Key: loadMore), falling back to "Load more".
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

  let placeholders = {};
  let employees = [];
  try {
    [placeholders, employees] = await Promise.all([
      fetchPlaceholders('/docs/sheet'),
      fetchEmployees(source),
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

  if (!employees.length) return;

  // build the table using the sheet's own column order
  const columns = Object.keys(employees[0]);
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

  // reveal PAGE_SIZE rows per click
  let rendered = 0;
  const renderPage = () => {
    employees.slice(rendered, rendered + PAGE_SIZE).forEach((emp) => {
      const tr = document.createElement('tr');
      columns.forEach((col) => {
        const td = document.createElement('td');
        td.textContent = emp[col] || '';
        tr.append(td);
      });
      tbody.append(tr);
    });
    rendered = Math.min(rendered + PAGE_SIZE, employees.length);
    if (rendered >= employees.length) button.hidden = true;
  };

  button.addEventListener('click', renderPage);
  block.append(button);
  renderPage();
}
