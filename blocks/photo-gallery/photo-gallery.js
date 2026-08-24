import {
  button, div, img, a,
} from '../../scripts/dom-helpers.js';

function createModal(images, startIndex) {
  let slideshowInterval = null;

  const modal = div(
    { class: 'image-modal-overlay' },
    div(
      { class: 'image-modal-content' },
      div(
        { class: 'modal-main' },
        div(
          { class: 'image-container' },
          img({ src: images[startIndex].src, alt: images[startIndex].alt }),
          button({ class: 'nav-button prev' }),
          button({ class: 'nav-button next' }),
          button({ class: 'expand-button' }),
        ),
        div(
          { class: 'thumbnails-container' },
          button({ class: 'thumb-nav prev' }),
          div(
            { class: 'thumbnails-wrapper' },
            ...images.map((imgEl, idx) => div(
              { class: `thumbnail ${idx === startIndex ? 'active' : ''}`, 'data-index': idx },
              img({ src: imgEl.src, alt: imgEl.alt }),
            )),
          ),
          button({ class: 'thumb-nav next' }),
        ),
        div(
          { class: 'modal-controls' },
          div(
            { class: 'slideshow-controls' },
            a({ class: 'play-button' }),
            a({ class: 'slide-nav prev' }),
            a({ class: 'slide-nav next' }),
          ),
          div({ class: 'image-counter' }, `${startIndex + 1}/${images.length}`),
          div({ class: 'modal-title' }, images[startIndex].getAttribute('data-display')),
          button({ class: 'close-button' }),
        ),
      ),
    ),
  );

  // Navigation handlers
  const mainPrevButton = modal.querySelector('.nav-button.prev');
  const mainNextButton = modal.querySelector('.nav-button.next');
  const modalImage = modal.querySelector('.modal-main img');
  const imageCounter = modal.querySelector('.image-counter');
  const modalTitle = modal.querySelector('.modal-title');
  const thumbnails = modal.querySelectorAll('.thumbnail');
  let currentIndex = startIndex;

  function updateModalImage() {
    modalImage.src = images[currentIndex].src;
    modalImage.alt = images[currentIndex].alt;
    imageCounter.textContent = `${currentIndex + 1}/${images.length}`;
    modalTitle.textContent = images[currentIndex].getAttribute('data-display');

    // Update active thumbnail and scroll into view if needed
    thumbnails.forEach((thumb, idx) => {
      const isActive = idx === currentIndex;
      thumb.classList.toggle('active', isActive);

      // If this is the active thumbnail, ensure it's visible
      if (isActive) {
        const thumbsWrapper = thumb.parentElement;
        const thumbRect = thumb.getBoundingClientRect();
        const wrapperRect = thumbsWrapper.getBoundingClientRect();

        // Check if thumbnail is outside the visible area
        if (thumbRect.left < wrapperRect.left || thumbRect.right > wrapperRect.right) {
          thumb.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
          });
        }
      }
    });
  }

  thumbnails.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      currentIndex = parseInt(thumb.dataset.index, 10);
      updateModalImage();
    });
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  const closeButton = modal.querySelector('.close-button');
  closeButton.addEventListener('click', () => {
    modal.remove();
  });

  // Keyboard navigation
  document.addEventListener('keydown', function handleKeydown(e) {
    if (e.key === 'ArrowLeft') {
      mainPrevButton.click();
    } else if (e.key === 'ArrowRight') {
      mainNextButton.click();
    } else if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', handleKeydown);
    }
  });

  mainPrevButton.addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateModalImage();
  });

  mainNextButton.addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % images.length;
    updateModalImage();
  });

  const thumbPrevButton = modal.querySelector('.thumb-nav.prev');
  const thumbNextButton = modal.querySelector('.thumb-nav.next');
  const thumbsWrapper = modal.querySelector('.thumbnails-wrapper');

  thumbPrevButton.addEventListener('click', (e) => {
    e.stopPropagation();
    thumbsWrapper.scrollBy({ left: -200, behavior: 'smooth' });
  });

  thumbNextButton.addEventListener('click', (e) => {
    e.stopPropagation();
    thumbsWrapper.scrollBy({ left: 200, behavior: 'smooth' });
  });

  const slideNavPrev = modal.querySelector('.slide-nav.prev');
  const slideNavNext = modal.querySelector('.slide-nav.next');

  slideNavPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateModalImage();
  });

  slideNavNext.addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % images.length;
    updateModalImage();
  });

  const navigationHandlers = [
    mainPrevButton,
    mainNextButton,
    slideNavPrev,
    slideNavNext,
    ...thumbnails,
  ];

  // Slideshow functionality
  const playButton = modal.querySelector('.play-button');

  function startSlideshow() {
    playButton.classList.add('playing');
    slideshowInterval = setInterval(() => {
      mainNextButton.click();
    }, 3000);
  }

  function stopSlideshow() {
    playButton.classList.remove('playing');
    if (slideshowInterval) {
      clearInterval(slideshowInterval);
      slideshowInterval = null;
    }
  }

  playButton.addEventListener('click', (e) => {
    e.stopPropagation();
    if (slideshowInterval) {
      stopSlideshow();
    } else {
      startSlideshow();
    }
  });

  navigationHandlers.forEach((element) => {
    element.addEventListener('click', (e) => {
      // Only stop slideshow if it's a manual click, not an automated one
      if (slideshowInterval && e.isTrusted) {
        stopSlideshow();
      }
    });
  });

  const closeHandlers = [
    closeButton,
    modal,
  ];

  closeHandlers.forEach((element) => {
    const originalHandler = element.onclick;
    element.onclick = (e) => {
      if (slideshowInterval) {
        stopSlideshow();
      }
      if (originalHandler) {
        originalHandler(e);
      }
    };
  });

  document.body.appendChild(modal);

  const imageContainer = modal.querySelector('.image-container');

  imageContainer.addEventListener('click', (e) => {
    const rect = imageContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;

    if (e.target.classList.contains('nav-button')) {
      return;
    }

    if (isLeftHalf) {
      mainPrevButton.click();
    } else {
      mainNextButton.click();
    }
  });

  const expandButton = modal.querySelector('.expand-button');
  let isExpanded = false;

  expandButton.addEventListener('click', (e) => {
    e.stopPropagation();
    isExpanded = !isExpanded;

    const modalContent = modal.querySelector('.image-modal-content');
    const modalMain = modal.querySelector('.modal-main');

    if (isExpanded) {
      expandButton.classList.add('contracted');
      modalContent.classList.add('expanded');
      modalMain.classList.add('expanded');
    } else {
      expandButton.classList.remove('contracted');
      modalContent.classList.remove('expanded');
      modalMain.classList.remove('expanded');
    }
  });
}

export default function decorate(block) {
  const images = [];
  [...block.children].forEach((row) => {
    const image = row.querySelector('img');
    const imgSrc = image.getAttribute('src');
    const altText = row.querySelector('p');
    image.setAttribute('data-display', altText?.textContent.trim() || '');
    image.setAttribute('alt', altText?.textContent.trim() || imgSrc.split('/').pop().split('.')[0]);
    images.push(image);
  });

  let currentImageIndex = 0;

  const galleryGrid = div({ class: 'photo-grid' });

  images.forEach((imgEl, index) => {
    const photoItem = div(
      { class: 'photo-item' },
      imgEl.cloneNode(true),
      div({ class: 'hover-circle' }),
    );
    galleryGrid.appendChild(photoItem);

    photoItem.addEventListener('click', () => {
      currentImageIndex = index;
      createModal(images, currentImageIndex);
    });
  });

  block.textContent = '';
  block.appendChild(galleryGrid);
}
