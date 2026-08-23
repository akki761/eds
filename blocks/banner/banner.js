import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
    
    const wrapper = block.querySelector('div > div');
    const bannerTitle = wrapper.querySelector('h1');
    bannerTitle.className = 'banner-title';
    
}
