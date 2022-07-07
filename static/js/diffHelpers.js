/* global window mainView fetch */

function backToTest(id) {
    window.location = `${document.referrer}&unfoldTestId=${id}`;
}

async function acceptAndRedirect(checkId, actualId, expectedId, diffId, testId) {
    await acceptOneCheck(checkId, actualId, expectedId, testId, false);
    redirectToNewDiffAfterAccept(checkId, actualId, diffId);
}

function redirectToUpdatedCheckAfterAccept(id) {
    const newUri = `/checkview?id=${id}`;
    window.location.href = newUri;
}

async function acceptAndRedirect2(params) {
    await acceptOneCheck(params.checkId, params.actualId, params.expectedId, params.testId, false);
    setTimeout(() => {
        redirectToUpdatedCheckAfterAccept(params.checkId);
    }, 500);
}

function toggleDiffToolbarCollapse() {
    const wrapper = document.getElementsByClassName('toolbar-wrapper')[0];
    const buttonsEl = document.getElementById('diff-toolbar-buttons');
    const collapseIcon = document.getElementById('diff-collapse-icon');
    if (buttonsEl.style.display === 'none') {
        wrapper.style.marginRight = '0';
        buttonsEl.style.display = 'inline-block';
        collapseIcon.src = '../../../../static/icons/collapse.svg';
        return;
    }
    collapseIcon.src = '../../../../static/icons/expand.svg';
    wrapper.style.marginRight = '-7px';
    buttonsEl.style.display = 'none';
}

function setMatchType(type, id) {
    const buttonElement = document.getElementById('dropdownMenuButton');
    sendMatchType(id, type);
    buttonElement.innerText = 'Ignore ' + type;
}

async function sendMatchType(id, type) {
    try {
        const response = await fetch(`/baselines_by_snapshot_id/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, matchType: type }),
        });
        const text = await response.text();
        if (response.status === 200) {
            console.log(`Successful send baseline match type data, id: '${id}'  resp: '${text}'`);
            mainView.showNotification('Match type was saved');
            return;
        }
        console.error(`Cannot set baseline match type , status: '${response.status}',  resp: '${text}'`);
        mainView.showNotification('Cannot set baseline match type', 'Error');
    } catch (e) {
        console.error(`Cannot set baseline match type: ${e.stack || e}`);
        mainView.showNotification('Cannot set baseline match type', 'Error');
    }
}
