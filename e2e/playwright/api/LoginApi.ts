import { Page } from '@playwright/test';
import { Login } from './Login';
import { ApiHelper } from '../utils/ApiHelper';

interface LoginResponse {
    AccessToken: string;
    TokenExpiration: string;
    UserId: number;
    Name: string;
    Email: string;
    RefreshToken: string;
    Company: string;
    CompanyKey: number;
    Language: string;
}

// API helper used in global-setup.ts to obtain a JWT token without going through the browser UI.
// Using the API for authentication in setup is faster and more reliable than clicking through the login form.
export class LoginApi {
    constructor(private readonly page: Page) { }

    /**
     * Authenticates via the API and returns the JWT access token.
     * @param userLogin - Credentials and session options for the user.
     * @returns The `AccessToken` string from the login response — pass this to `storeToken()` in global-setup.
     * @throws If the HTTP request fails or the response contains no token.
     */
    async login(userLogin: Login): Promise<string> {
        const apiHelper = new ApiHelper(this.page, process.env.AUTH_URL!);
        const response = await apiHelper.post('/api/users/login', userLogin);
        if (!response.ok()) throw new Error(`Login API failed [${response.status()}]: ${await response.text()}`);
        const data = await response.json() as LoginResponse;
        if (!data.AccessToken) throw new Error('Login API returned no AccessToken');
        return data.AccessToken;
    }
}
