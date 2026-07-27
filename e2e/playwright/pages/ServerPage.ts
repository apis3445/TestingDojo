import { Page } from "@playwright/test";
import { ServerApi } from "../api/ServerApi";
import { Button } from "../components/Button";
import { Heading } from "../components/Heading";
import { InputText } from "../components/InputText";
import { BasePage } from "./BasePage";

export class ServerPage extends BasePage {
    title: Heading = new Heading(this.page, this.localeInfo.servers.title);
    key: InputText = new InputText(this.page, '[name="key"]', false);
    name: InputText = new InputText(this.page, '[name="name"]', false);
    url: InputText = new InputText(this.page, '[name="url"]', false);
    save: Button = new Button(this.page, this.localeInfo.servers.save);
    cancel: Button = new Button(this.page, this.localeInfo.servers.cancel);
    serverApi: ServerApi;

    constructor(page: Page, locale?: string) {
        super(page, 'AddServer', locale);
        this.serverApi = new ServerApi(page);
    }

    /**
     * Save and return server id
     * @returns Server id
     */
    async saveClick() {
        await this.save.click();
    }
}