import { expect, Page, test } from '@playwright/test';
import { BasePage } from './BasePage';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { InputText } from '../components/InputText';
import { Link } from '../components/Link';
import { InputPassword } from '../components/InputPassword';

export interface UserLogin {
    Company: string;
    UserName: string;
    Password: string;
}

// Page Object for the login screen.
export class LoginPage extends BasePage {
    // All components should be defined here prefer select by role with the 
    // current text for the different languages
    // The text on the different languages is stored in data folders 
    company: InputText = new InputText(this.page, this.localeInfo.home.company);
    user: InputText = new InputText(this.page, this.localeInfo.home.user);
    password: InputPassword = new InputPassword(this.page, this.localeInfo.home.pass);
    submit: Button = new Button(this.page, this.localeInfo.home.login);
    forgotPassword: Link = new Link(this.page, this.localeInfo.home.forgotPassword, false);
    errorMessage: Alert = new Alert(this.page,  "Login error message");

    constructor(page: Page, locale?: string) {

        super(page, 'Login', locale);
    }


    async login(userLogin: UserLogin) {
        await this.goTo();
        await this.company.fill(userLogin.Company);
        await this.user.fill(userLogin.UserName);
        await this.password.fill(userLogin.Password);
        await this.submit.click();
    }

    async assertInvalidCredentials() {
        await this.errorMessage.assertText(this.localeInfo.home.invalidCredentials);
    }

    async assertLoginFormVisible() {
        await test.step('Login form is visible', async () => {
            await expect(this.submit.locator, 'Should be visible').toBeVisible();
        });
    }
}