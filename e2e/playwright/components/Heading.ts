import { Page } from '@playwright/test';
import { BaseComponent } from './BaseComponent';

export class Heading extends BaseComponent {

    /**
     * Constructor
     * @param page Playwright page 
     * @param selector Name for the button
     */
    constructor(page: Page, selector: string, byRole = true, name = '') {
        super(page, selector, 'heading', byRole, name);
    }
}