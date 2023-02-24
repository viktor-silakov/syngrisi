export const tableColumns: { [key: string]: any } = {
    _id: {
        label: 'Id',
        headStyle: { width: '15%' },
        cellStyle: { width: '15%' },
        type: 'IdFilter',
    },
    name: {
        label: 'Name',
        headStyle: { width: '20%' },
        cellStyle: { width: '20%' },
        type: 'StringFilter',
    },
    status: {
        label: 'Status',
        headStyle: { width: '10%' },
        cellStyle: { width: '10%' },
        type: 'StatusFilter',
    },
    creatorUsername: {
        label: 'Created',
        headStyle: { width: '10%' },
        cellStyle: { width: '10%' },
        type: 'StringFilter',
    },
    markedAs: {
        label: 'Accepted',
        headStyle: { width: 'auto' },
        cellStyle: {
            width: 'auto',
        },
        type: 'AcceptedFilter',
    },
    startDate: {
        label: 'Date',
        headStyle: { width: '15%' },
        cellStyle: { width: '15%' },
        type: 'DateFilter',
    },
    browserName: {
        label: 'Browser',
        headStyle: { width: '10%' },
        cellStyle: { width: '10%' },
        type: 'BrowserNameFilter',
    },
    browserVersion: {
        label: 'Browser Ver.',
        headStyle: { width: '10%' },
        cellStyle: { width: '10%' },
        type: 'StringFilter',
    },
    os: {
        label: 'Platform',
        headStyle: { width: '10%' },
        cellStyle: { width: '10%' },
        type: 'OsFilter',
    },
    run: {
        label: 'Run',
        headStyle: { width: '15%' },
        cellStyle: { width: '15%' },
        type: 'IdFilter',
    },
    suite: {
        label: 'Suite',
        headStyle: { width: '15%' },
        cellStyle: { width: '15%' },
        type: 'IdFilter',
    },
    branch: {
        label: 'Branch',
        headStyle: { width: '10%' },
        cellStyle: { width: '10%' },
        type: 'StringFilter',
    },
    viewport: {
        label: 'Viewport',
        headStyle: { width: '10%' },
        cellStyle: { width: '10%' },
        type: 'StringFilter',
    },
};
