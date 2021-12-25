async function renderSameNamedChecks(check, lastChecksWithSameName) {
    const pageTemplate = await fetch('../../../static/ejs/check_sidebar.ejs');
    document.getElementById('sidebar')
        .innerHTML = await ejs.render(
        await pageTemplate.text(),
        { check, lastChecksWithSameName }, { async: true },
    );
}
