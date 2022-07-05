/* global fetch ejs */

// eslint-disable-next-line no-unused-vars
async function renderSameNamedChecks(check, lastChecksWithSameName) {
    const pageTemplate = await fetch('../../../static/ejs/check_sidebar.ejs');
    document.getElementById('sidebar').innerHTML = await ejs.render(
        await pageTemplate.text(),
        { check, lastChecksWithSameName },
        { async: true },
    );
}

// eslint-disable-next-line no-unused-vars
async function renderNextAndPrevButtons(prevCheckId, nextCheckId) {
    const prevButton = document.getElementById('previous');
    if (prevCheckId) {
        prevButton.parentElement.setAttribute('disabled', 'false');
        prevButton
            .setAttribute('href', `checkview?id=${prevCheckId}`);
    } else {
        prevButton.parentElement.setAttribute('disabled', 'true');
    }
    const nextButton = document.getElementById('next');
    if (nextCheckId) {
        nextButton.parentElement.setAttribute('disabled', 'false');
        document.getElementById('next')
            .setAttribute('href', `checkview?id=${nextCheckId}`);
    } else {
        nextButton.parentElement.setAttribute('disabled', 'true');
    }
}
