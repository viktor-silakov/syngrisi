/* eslint-disable func-names */
const { When } = require('cucumber');

When(/^I parse the API key$/, function () {
    const apiKey = $('[data-test=api-key]')
        .getValue();
    this.saveItem('apiKey', { value: apiKey });
});

When(/^I set the API key in config$/, function () {
    browser.config.apiKey = this.getSavedItem('apiKey').value;
});
