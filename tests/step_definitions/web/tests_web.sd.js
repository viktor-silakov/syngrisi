/* eslint-disable no-console,func-names */
const { When, Then } = require('cucumber');
const YAML = require('yaml');
const fs = require('fs');
const { TableVRSComp } = require('../../src/PO/vrs/tableVRS.comp');
const { default: checkVRS } = require('../../src/support/check/checkVrs');

When(/^I click on "([^"]*)" VRS test$/, (testName) => {
    TableVRSComp.init();
    TableVRSComp.data.filter((row) => row.name.$('span[name=cell-name]')
        .getText()
        .includes(testName))[0].name
        .click();
});

When(/^I expect that(:? (\d)th)? VRS test "([^"]*)" has "([^"]*)" (status|browser|platform|viewport|accepted status)$/,
    (number, testName, fieldValue, fieldName) => {
        const intNumber = number ? parseInt(number, 10) : 1;
        TableVRSComp.init();
        const row = TableVRSComp.data.filter((r) => r.name.$('span[name=cell-name]')
            .getText()
            .includes(testName))[intNumber - 1];

        TableVRSComp.data.forEach((x) => {
            console.log({ EL: x.name.selector });
            console.log({ NAME: x.name.getText() });
        });
        const actualValue = row[fieldName].$('span')
            .jsGetText();
        const actualValue2 = actualValue.replace(/ [\[]HEADLESS[\]]/, '');
        expect(actualValue2)
            .toBe(fieldValue);
        if (fieldName === 'status') {
            const statusClasses = {
                Running: {
                    text: 'text-info',
                },
                New: {
                    text: 'text-success',
                },
                Passed: {
                    text: 'text-success',
                },
                Failed: {
                    text: 'text-danger',
                },
            };
            expect(row.status.$('span'))
                .toHaveAttributeContaining('class', statusClasses[fieldValue].text);
        }
    });

When(/^I expect that(:? (\d)th)? test "([^"]*)" has "([^"]*)" (status|browser|platform|viewport|accepted status)$/,
    function (number, testName, fieldValue, fieldName) {
        const row = $(`//span[contains(text(),"${testName}")]/ancestor::div[@name="testinfo"]`);
        const selectors = {
            status: '.cell-status',
            browser: 'span[name="browser-name"]',
            viewport: 'span[name="cell-viewport"]',
            // ||platform||accepted status
        };
        const selector = selectors[fieldName];
        if (!selector) {
            throw new Error('Selector is empty, you need extend the step definition logic');
        }
        const el = row.$(selector);
        if (fieldName === 'status') {
            const statusClasses = {
                Failed: 'bg-item-failed',
                Passed: 'bg-item-passed',
                Unresolved: 'bg-warning',
                Running: 'bg-item-running',
                New: 'bg-item-new',
            };
            expect(el)
                .toHaveAttributeContaining('class', statusClasses[fieldValue]);
            return;
        }
        expect(el)
            .toHaveTextContaining(fieldValue);
    });

When(/^I expect that(:? (\d)th)? VRS test "([^"]*)" has blink icon$/,
    (number, testName) => {
        const intNumber = number ? parseInt(number, 10) : 1;
        TableVRSComp.init();
        const row = TableVRSComp.data.filter((r) => r.name.$('span[name=cell-name]')
            .getText()
            .includes(testName))[intNumber - 1];
        expect(row.name.$('img'))
            .toHaveAttributeContaining('class', 'blink-icon');
    });

Then(/^I expect that(:? (\d)th)? VRS test "([^"]*)" is unfolded$/, (number, testName) => {
    const intNumber = number ? parseInt(number, 10) : 1;
    const row = TableVRSComp.data.filter((r) => r.name.$('span[name=cell-name]')
        .getText() === testName)[intNumber - 1];
    const nameCell = row.name.$('span');
    const foldDiff = nameCell.$('./../../../../../..//div[contains(@class, \'all-checks\')]');
    expect(foldDiff)
        .toHaveAttributeContaining('class', 'show');
});

When(/^I create "([^"]*)" tests with params:$/, { timeout: 600000 }, async function (num, yml) {
    const params = YAML.parse(yml);

    browser.vDriver.setCurrentSuite({
        name: 'Integration suite',
        id: 'Integration_suite',
    });

    for (const i of Array.from(Array(parseInt(num, 10))
        .keys())) {
        console.log(`Create test # ${i}`);
        await browser.vDriver.startTestSession({
            app: 'Test App',
            test: `${params.testName} - ${i + 1}`,
            run: process.env.RUN_NAME || 'integration_run_name',
            runident: process.env.RUN_IDENT || 'integration_run_ident',
            branch: 'integration',
        }, browser.config.apiKey);
        browser.pause(300);
        const filePath = params.filePath || 'files/A.png';
        const imageBuffer = fs.readFileSync(`${browser.config.rootPath}/${filePath}`);
        const checkName = params.checkName || `Check - ${Math.random()
            .toString(36)
            .substring(7)}`;
        const checkResult = await checkVRS(checkName, imageBuffer);
        console.log({ checkResult });
        this.STATE.check = checkResult;
        await browser.vDriver.stopTestSession(browser.config.apiKey);
    }
});

When(/^I create "([^"]*)" tests with few checks:$/, { timeout: 60000000 }, async function (num, yml) {
    const params = YAML.parse(yml);

    browser.vDriver.setCurrentSuite({
        name: 'Integration suite',
        id: 'Integration_suite',
    });

    for (const i of Array.from(Array(parseInt(num, 10))
        .keys())) {
        console.log(`Create test # ${i}`);
        await browser.vDriver.startTestSession({
            app: 'Test App',
            branch: 'integration',
            test: params.testName.includes('-') ? (`${params.testName}${i + 1}`) : params.testName,
            run: process.env.RUN_NAME || 'integration_run_name',
            runident: process.env.RUN_IDENT || 'integration_run_ident',
        }, browser.config.apiKey);
        browser.pause(300);
        const checkResult = [];

        for (const check of params.checks) {
            const imageBuffer = fs.readFileSync(`${browser.config.rootPath}/${check.filePath}`);
            checkResult.push(await checkVRS(check.checkName, imageBuffer));
        }

        this.STATE.check = checkResult;
        await browser.vDriver.stopTestSession(browser.config.apiKey);
    }
});
