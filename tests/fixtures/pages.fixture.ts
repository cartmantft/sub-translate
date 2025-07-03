import { test as base } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { UploadPage } from '../pages/upload.page';
import { ProjectPage } from '../pages/project.page';

// Page Object Model fixtures 정의
type PageFixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  uploadPage: UploadPage;
  projectPage: ProjectPage;
};

export const test = base.extend<PageFixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  uploadPage: async ({ page }, use) => {
    const uploadPage = new UploadPage(page);
    await use(uploadPage);
  },

  projectPage: async ({ page }, use) => {
    const projectPage = new ProjectPage(page);
    await use(projectPage);
  },
});

export { expect } from '@playwright/test';