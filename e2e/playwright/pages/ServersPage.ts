import test, { Page, expect } from "@playwright/test";
import { Button } from "../components/Button";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Grid } from "../components/Grid";
import { Heading } from "../components/Heading";
import { InputText } from "../components/InputText";
import { BasePage } from "./BasePage";
import { ServerApi } from "../api/ServerApi";
import { Server } from "../api/Server";

export class ServersPage extends BasePage {
    readonly title: Heading;
    readonly add: Button;
    readonly delete: Button;
    readonly exportToExcel: Button;
    readonly exportToPDF: Button;
    readonly table: Grid;
    readonly confirmDialog: ConfirmDialog;
    readonly save: Button;
    readonly cancel: Button;
    readonly filter: InputText;
    serverApi: ServerApi;

    constructor(page: Page, locale?: string) {
        super(page, 'Servers', locale);
        this.title = new Heading(page, this.localeInfo.servers.title);
        this.add = new Button(page, this.localeInfo.servers.add);
        this.delete = new Button(page, this.localeInfo.servers.delete);
        this.exportToExcel = new Button(page, this.localeInfo.servers.exportToExcel);
        this.exportToPDF = new Button(page, this.localeInfo.servers.exportToPDF);
        this.table = new Grid(page);
        this.confirmDialog = new ConfirmDialog(page);
        this.save = new Button(page, this.localeInfo.servers.save);
        this.cancel = new Button(page, this.localeInfo.servers.cancel);
        this.filter = new InputText(
            page,
            `[placeholder="${this.localeInfo.servers.searchPlaceholder}"]`,
            false,
        );
        this.serverApi = new ServerApi(page);
    }

    /**
     * Go to servers page
     */
    public async goTo() {
        const serversPage = this.baseURL + '/security/servers';
        await test.step(
            `Go to the servers page: "${serversPage}"`,
            async () => {
                const waitForServersPromise = this.serverApi.waitForGetServers();
                await this.page.goto(serversPage);
                await waitForServersPromise;
                await this.title.locator.waitFor({ timeout: 30_000 });
            },
        );
    }

    /**
     * Create a server by api
     * @param server Data for the server
     */
    async createServer(server: Server) {
        return await test.step(
            'Create server with API',
            async () => {
                const response = await this.serverApi.createServer(server);
                const responseText = JSON.parse(await response.text());
                const id = +responseText.Id;
                return id;
            },
        );
    }

    /**
     * Check the values in the row grid
     * @param key key for the server
     * @param name name for the server
     * @param url url for the server
     */
    async checkRow(key: number, name: string, url: string) {
        let row = await this.table.getRowByKey(key);
        let assertDescription = `Server with the key: "${key}" exists in the table`;
        await test.step(
            assertDescription,
            async () => {
                expect(row, assertDescription).not.toBeNull();
                //Get the row values as a object the header title are the property of the object
                const rowValues = await this.table.getRowValues(row);
                assertDescription = `The server name for the key: "${key}" is: "${name}"`;
                await test.step(
                    assertDescription,
                    async () => {
                        expect(rowValues.Name, assertDescription).toBe(name);
                    },
                );
                assertDescription = `The server url for the key: "${key}" is: "${url}"`;
                await test.step(
                    assertDescription,
                    async () => {
                        expect(rowValues.URL, assertDescription).toBe(url);
                    },
                );
            },
        );
    }
    
    /**
     * Deletes the server by key if exists
     * @param key Server key to delete
     */
    async deleteServerByKey(key: string) {
        await test.step(
            `Delete server with the key: "${key}" if exists`,
            async () => {
                const response = await this.serverApi.getServerByKey(key);
                if (response.status() == 200) {
                    const responseText = JSON.parse(await response.text());
                    const id = +responseText.Id;
                    await this.serverApi.deleteServer(id);
                }
            },
        );
    }
}
