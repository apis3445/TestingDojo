import { Page } from '@playwright/test';
import { BaseComponent } from './BaseComponent';

/**
 * Canvas component representing a specific element on the page.
 */
export class Canvas extends BaseComponent {

    /**
     * Constructor
     * @param page Playwright page 
     * @param selector selector for the canvas element
     */
    constructor(page: Page, public selector: string, description = '') {
        super(page, selector, 'generic', false, description || selector);
    }
}