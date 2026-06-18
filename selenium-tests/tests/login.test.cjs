const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("assert");

describe("Login E2E Test", function () {
  this.timeout(30000); // 30 seconds timeout
  let driver;

  before(async function () {
    const options = new chrome.Options();
    options.addArguments("--headless");
    options.addArguments("--no-sandbox");
    options.addArguments("--disable-dev-shm-usage");
    options.addArguments("--window-size=1280,1024");

    driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it("should log in and redirect to dashboard in mock mode", async function () {
    // Dynamically detect active port (Vite/TanStack Start can run on 8080, 8081, or 5173)
    const ports = [8080, 8081, 5173];
    let pageLoaded = false;
    let lastError = null;

    for (const port of ports) {
      try {
        const url = `http://localhost:${port}/auth?mock=true`;
        await driver.get(url);
        // Wait a brief moment to check if loaded successfully
        await driver.wait(until.elementLocated(By.id("email")), 2000);
        pageLoaded = true;
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!pageLoaded) {
      throw new Error(
        `Failed to connect to local server on ports ${ports.join(", ")}. Last error: ${lastError?.message}`,
      );
    }

    // Find the email input, password input, and login button
    const emailInput = await driver.findElement(By.id("email"));
    const passwordInput = await driver.findElement(By.id("password"));
    const loginButton = await driver.findElement(By.id("login-button"));

    // Enter login credentials
    await emailInput.sendKeys("test@example.com");
    await passwordInput.sendKeys("password123");

    // Click the login button
    await loginButton.click();

    // Verify dashboard redirect by checking url matches or contains /dashboard
    await driver.wait(until.urlContains("/dashboard"), 15000);

    const currentUrl = await driver.getCurrentUrl();
    assert.ok(
      currentUrl.includes("/dashboard"),
      `Expected URL to contain /dashboard but got ${currentUrl}`,
    );
  });
});
