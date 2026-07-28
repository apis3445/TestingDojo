import { expect, test } from '../fixtures';
import { faker } from '@faker-js/faker';
import { ServersPage } from '../pages/ServersPage';
import { AnnotationType } from '../utils/AnnotationType';
import { ServerPage } from '../pages/ServerPage';
import { Server } from '../api/Server';

test.describe('Servers', () => {
    let id = 0;
    test.use({ storageState: '.auth/admin.json' });

    test.afterEach(async ({ page, locale }) => {
        //Delete the server created after each test 
        const serverPage = new ServerPage(page, locale);
        if (id > 0) {
            test.info().annotations.push({
                type: AnnotationType.PostCondition,
                description: `Delete the server with API request with id: ${id}`,
            });
            try {
                await serverPage.serverApi.deleteServer(id);
            } catch (e) {
                // swallow errors in cleanup to avoid masking test failures
            } finally {
                id = 0;
            }
        }
    });

    test('Should add a server', {
        tag: ['@API'],
        annotation: [
            { type: AnnotationType.Description, description: 'An admin user can add a server' },
            { type: AnnotationType.Precondition, description: 'A valid admin username and password is logged' },
        ],
    }, async ({ page, locale }) => {
        await page.screencast.start({ path: 'server.webm' });
        await page.screencast.showActions({ position: 'top-right' });
        await page.screencast.showChapter('Adding a new Server', {
            description: 'An admin user can add a server',
            duration: 1000,
        });
        const serversPage = new ServersPage(page, locale);
        const serverPage = new ServerPage(page, locale);
        await serversPage.goTo();
        //Add server with a random data from faker
        const key = faker.number.int({ min: 999_000, max: 999_999 });
        const name = faker.company.name();
        const url = faker.internet.url();
        //Delete a server with key if exists to isolate the test and can be executed in parallel
        await serversPage.deleteServerByKey(key.toString());
        await serversPage.add.click();
        await serverPage.key.fill(key.toString());
        await serverPage.name.fill(name);
        await serverPage.url.fill(url);
        await serverPage.saveClick();
        await serversPage.checkSuccessMessage();
        await serversPage.filter.fill(key.toString());
        await expect(serversPage.table.locator).toContainText(key.toString());
        await serversPage.checkRow(key, name, url);
        const response = await serversPage.serverApi.getServerByKey(key.toString());
        const responseText = await response.text();
        const responseObject = JSON.parse(responseText);
        id = +responseObject.Id;
        await page.screencast.stop();
    });

    test('Should edit a server', {
        tag: ['@API'],
        annotation: [
            { type: AnnotationType.Description, description: 'An admin user can edit a server' },
            { type: AnnotationType.Precondition, description: 'A valid admin username and password is logged' },
        ],
    }, async ({ page, locale }) => {
        const serversPage = new ServersPage(page, locale);
        const addServerPage = new ServerPage(page, locale);
        const key = faker.number.int({ min: 999_000, max: 999_998 });
        await serversPage.goTo();
        //Create and server by api to test edit to remove dependencies for the create with UI
        const server: Server = {
            Key: key,
            Name: faker.company.name(),
            Url: faker.internet.url(),
            Active: true
        };
        id = await serversPage.createServer(server);
        const newName = faker.company.name();
        const newUrl = faker.internet.url();
        //Go to page again to get the server created by api
        await serversPage.goTo();
         await serversPage.filter.fill(key.toString());
        await serversPage.table.clickInEditByKey(key);
        await expect(addServerPage.name.locator).toHaveValue(server.Name);
        await addServerPage.name.fill(newName);
        await addServerPage.url.fill(newUrl);
        await addServerPage.save.click();
        await addServerPage.checkSuccessMessage();
        await serversPage.filter.fill(key.toString());
        await expect(serversPage.table.locator).toContainText(key.toString());
        await serversPage.checkRow(key, newName, newUrl);
    });

     test('Should delete a server', {
        tag: ['@API'],
        annotation: [
            { type: AnnotationType.Description, description: 'An admin user can edit a server' },
            { type: AnnotationType.Precondition, description: 'A valid admin username and password is logged' },
        ],
    }, async ({ page, locale }) => {
        const serversPage = new ServersPage(page, locale);
        await serversPage.goTo();
         const key = faker.number.int({ min: 999_000, max: 999_998 });
        //Create and server by api to test edit to remove dependencies for the create with UI
        const server: Server = {
            Key: key,
            Name: faker.company.name(),
            Url: faker.internet.url(),
            Active: true
        };
        id = await serversPage.createServer(server);
         //Go to page again to get the server created by api
        await serversPage.goTo();
        await serversPage.filter.fill(key.toString());
        await serversPage.table.clickInDeleteByKey(key);
        await serversPage.confirmDialog.checkDialog('Confirm deletion', `Are you sure you want to delete this item? This action cannot be undone.`, 'Yes', 'No');
        await serversPage.confirmDialog.confirm();
        await serversPage.checkSuccessMessage();
        await serversPage.filter.fill(key.toString());
        await expect(serversPage.table.locator).not.toContainText(key.toString());
        id = 0;
    })
});