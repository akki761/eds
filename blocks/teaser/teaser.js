import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Decorates the teaser block.
 *
 * Expected authored structure (rows / cells):
 *   - an image cell (a single picture)
 *   - a content cell (heading + description + optional CTA link)
 * These can be authored as two stacked rows or as one row with two cells.
 * Bold a CTA link (**[text](url)**) to have it rendered as a button.
 *
 * @param {Element} block The teaser block element
 */
export default function decorate(block) {
  // flatten the authored rows/cells into direct children of the block
  const cells = [...block.querySelectorAll(':scope > div > div')];
  cells.forEach((cell) => {
    if (cell.children.length === 1 && cell.querySelector('picture')) {
      cell.className = 'teaser-image';
    } else {
      cell.className = 'teaser-content';
    }
  });
  block.replaceChildren(...cells);

  // re-optimize images (same approach as the cards block)
  block.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
    );
  });
}
