import { getMetadata } from '../../scripts/aem.js';

/**
 * Converts a URL path segment into a human-readable label.
 * e.g. "bali-surf-camp" -> "Bali Surf Camp"
 * @param {string} segment A single path segment
 * @returns {string} The prettified label
 */
function prettify(segment) {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (chr) => chr.toUpperCase());
}

/**
 * Builds a breadcrumb trail from the current page's URL path.
 * The last crumb (the current page) is rendered as plain text, the rest as links.
 * @param {HTMLElement} block The breadcrumb block element
 */
export default function decorate(block) {
  const segments = window.location.pathname.split('/').filter((s) => s);

  // always start the trail at the site root
  const crumbs = [{ label: 'Home', url: '/' }];

  let url = '';
  segments.forEach((segment, i) => {
    url += `/${segment}`;
    const isCurrent = i === segments.length - 1;
    crumbs.push({
      // use the authored page title for the current page, prettified slug otherwise
      label: isCurrent ? (getMetadata('og:title') || prettify(segment)) : prettify(segment),
      // the current page is not a link
      url: isCurrent ? null : url,
    });
  });

  const ol = document.createElement('ol');
  crumbs.forEach((crumb) => {
    const li = document.createElement('li');
    if (crumb.url) {
      const a = document.createElement('a');
      a.href = crumb.url;
      a.textContent = crumb.label;
      li.append(a);
    } else {
      li.setAttribute('aria-current', 'page');
      li.textContent = crumb.label;
    }
    ol.append(li);
  });

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  nav.append(ol);

  block.textContent = '';
  block.append(nav);
}
