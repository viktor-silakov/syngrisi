'use strict';

/* global log:readonly */
const mongoose = require('mongoose');

const Snapshot = mongoose.model('VRSSnapshot');
const Check = mongoose.model('VRSCheck');
const Test = mongoose.model('VRSTest');
const Suite = mongoose.model('VRSSuite');
const Run = mongoose.model('VRSRun');
const User = mongoose.model('VRSUser');
const moment = require('moment');
const {
    fatalError,
    checkIdent,
    checksGroupedByIdent,
    removeEmptyProperties,
    buildQuery,
    getSuitesByTestsQuery,
    getRunsByTestsQuery,
} = require('../utils');

async function getSnapshotByImgHash(hash) {
    return (await Snapshot.find({ imghash: hash }))[0];
}

exports.checksGroupView = async function (req, res) {
    return new Promise(async function (resolve, reject) {
        try {
            const opts = removeEmptyProperties(req.query);

            if (!opts.id) {
                res.status(404)
                    .send('Cannot return checks ident group. There is no check "id" field in request query');
                return;
            }

            const check = await Check.findById(`${opts.id}`)
                .exec();

            const test = await Test.findById(check.test)
                .exec();
            const suite = await Suite.findById(check.suite)
                .exec();
            const testId = check.test;
            const ident = checkIdent(check);
            console.warn(check.name, '|', testId, '|', suite, '|', ident, '|');
            const groups = await checksGroupedByIdent({ test: testId });
            const groupChecks = groups[ident].checks;
            let transGroups = await Promise.all(
                groupChecks.map(async function (check) {
                    const actual = await Snapshot.findById(check.actualSnapshotId)
                        .exec();
                    const baseline = await Snapshot.findById(check.baselineId)
                        .exec();
                    const diff = await Snapshot.findById(check.diffId)
                        .exec();
                    const chk = check.toObject();
                    chk.actual = actual ? actual.toObject() : null;
                    chk.baseline = baseline ? baseline.toObject() : null;
                    chk.diff = diff ? diff.toObject() : null;
                    return chk;
                })
            );
            console.log({ transGroups });
            res.render('pages/checkgroup', {
                checks: transGroups,
                test: test,
                suite: suite
            });
        } catch (e) {
            fatalError(req, res, e);
            return reject(e);
        }
    });

};

exports.checkView = function (req, res) {
    return new Promise(async function (resolve, reject) {
        try {
            const opts = removeEmptyProperties(req.query);

            if (!opts.id) {
                res.status(400)
                    .json({ error: 'Cannot return snapshot. There is no "id" field in request query' });
                return reject();
            }
            const check = await Check.findById(opts.id);
            const test = await Test.findById(`${check.test}`);
            const suite = await Suite.findById(`${check.suite}`);
            const baselineSnapshot = await Snapshot.findById(`${check.baselineId}`);
            let actualSnapshot;

            if (check.actualSnapshotId) {
                actualSnapshot = await Snapshot.findById(`${check.actualSnapshotId}`);
                actualSnapshot.formattedCreatedDate = moment(actualSnapshot.createdDate);
            }
            const diffId = check.diffId ? check.diffId : '';

            let diffSnapshot;
            if (check.diffId) {
                diffSnapshot = await Snapshot.findById(`${check.diffId}`);
                diffSnapshot.formattedCreatedDate = moment(diffSnapshot.createdDate);
            }
            baselineSnapshot.formattedCreatedDate = moment(baselineSnapshot.createdDate)
                .format('YYYY-MM-DD hh:mm');

            const checksWithSameName = await checksGroupedByIdent({ name: check.name });

            let lastChecksWithSameName = [];
            for (const group of Object.values(checksWithSameName)) {
                lastChecksWithSameName.push(group.checks[group.checks.length - 1]);
            }
            lastChecksWithSameName = lastChecksWithSameName.sort(function(a,b){
                return Number(new Date(b.updatedDate) - Number(new Date(a.updatedDate)));
            });
            res.render('pages/checkview', {
                baselineSnapshot,
                diffId,
                actualSnapshot,
                diffSnapshot,
                check,
                test,
                suite,
                lastChecksWithSameName,
                user: req.user,
            });
            return resolve();
        } catch (e) {
            fatalError(req, res, e);
            return reject(e);
        }
    });
};

exports.diffView = function (req, res) {
    return new Promise(async (resolve, reject) => {
        try {
            const opts = removeEmptyProperties(req.query);

            if (!opts.expectedid) {
                res.status(400)
                    .json({ error: `There is no 'id' fields (actualid) in request query: ${JSON.stringify(opts)}` });
                log.error(`There is no 'id' fields (actualid) in request query: ${JSON.stringify(opts)}`);
                console.trace();
                return resolve();
            }
            try {
                const baseline = await Snapshot.findById(`${opts.expectedid}`);
                baseline.formattedCreatedDate = moment(baseline.createdDate)
                    .format('YYYY-MM-DD hh:mm');

                let actualSnapshoot;
                let diffSnapshoot;

                // for new check case
                if (opts.actualid) {
                    actualSnapshoot = await Snapshot.findById(`${opts.actualid}`);
                    actualSnapshoot.formattedCreatedDate = moment(actualSnapshoot.createdDate)
                        .format('YYYY-MM-DD hh:mm');
                } else {
                    diffSnapshoot = baseline;
                }

                // for passed check case
                if (opts.diffid) {
                    diffSnapshoot = await Snapshot.findById(`${opts.diffid}`);
                    if (diffSnapshoot === null) {
                        res.status(400)
                            .json({ error: `Cannot find diff with id: ${opts.diffid}` });
                        log.error(`Cannot find diff with id: ${opts.diffid}`);
                        console.trace();

                        return resolve();
                    }
                    diffSnapshoot.formattedCreatedDate = moment(diffSnapshoot.createdDate)
                        .format('YYYY-MM-DD hh:mm');
                } else {
                    diffSnapshoot = actualSnapshoot || baseline;
                }

                const check = await Check.findById(opts.checkid);
                const suite = await Suite.findById(`${check.suite}`);
                const test = await Test.findById(`${check.test}`);

                const checksWithSameName = await checksGroupedByIdent({ name: check.name });

                const lastChecksWithSameName = [];
                for (const group of Object.values(checksWithSameName)) {
                    lastChecksWithSameName.push(group.checks[group.checks.length - 1]);
                }
                // console.log({lastChecksWithSameName});

                res.render('pages/diff', {
                    expected_snapshoot: baseline,
                    actual_snapshoot: actualSnapshoot,
                    diff_snapshoot: diffSnapshoot,
                    suite,
                    test,
                    check,
                    lastChecksWithSameName,
                });
                return resolve();
            } catch (e) {
                res.status(500)
                    .send(`Error preparing diff page: '${JSON.stringify(e)}'`);
                return reject(e);
            }
        } catch (e) {
            fatalError(req, res, e);
            return reject(e);
        }
    });
};

exports.index = async function (req, res) {
    return new Promise(
        async function (resolve, reject) {
            try {
                const opts = removeEmptyProperties(req.query);
                let sortBy;
                if ((opts.sortprop === 'name')
                    || (opts.sortprop === 'status')
                    || (opts.sortprop === 'browserName')
                    || (opts.sortprop === 'suite')
                    || (opts.sortprop === 'os')
                    || (opts.sortprop === 'calculatedViewport')
                    || (opts.sortprop === 'updatedDate')) {
                    sortBy = opts.sortprop;
                }
                sortBy = sortBy || 'updatedDate';
                const sortOrder = opts.sortorder ? opts.sortorder : -1;
                const sortFilter = {};
                sortFilter[sortBy] = sortOrder;
                const suite = await Suite.findOne({ name: opts.filter_suitename_eq })
                    .exec();

                const query = buildQuery(opts);
                // console.log({query, opts});
                if (req.user.role === 'user') {
                    query.creatorUsername = req.user.username;
                }
                const suites = await getSuitesByTestsQuery(query);
                const currentUser = req.user;
                res.render('pages/index', {
                    suites,
                    currentSuite: suite,
                    user: currentUser,
                    opts: opts,
                });
            } catch (e) {
                fatalError(req, res, e);
                return reject(e);
            }
        }
    );
};

exports.runs = function (req, res) {
    return new Promise(
        async function (resolve, reject) {
            try {
                const opts = removeEmptyProperties(req.query);
                let sortBy;
                if ((opts.sortprop === 'name')
                    || (opts.sortprop === 'status')
                    || (opts.sortprop === 'browserName')
                    || (opts.sortprop === 'suite')
                    || (opts.sortprop === 'os')
                    || (opts.sortprop === 'calculatedViewport')
                    || (opts.sortprop === 'updatedDate')) {
                    sortBy = opts.sortprop;
                }
                sortBy = sortBy || 'updatedDate';
                const sortOrder = opts.sortorder ? opts.sortorder : -1;
                const sortFilter = {};
                sortFilter[sortBy] = sortOrder;

                const query = buildQuery(opts);
                delete query.run;
                if (req.user.role === 'user') {
                    query.creatorUsername = req.user.username;
                }

                function getCheckStatuses(tests) {
                    const statuses = tests.map((x) => x.status);
                    const groupStatusesCounts = {};
                    statuses.forEach((x) => {
                        groupStatusesCounts[x] = (groupStatusesCounts[x] || 0) + 1;
                    });
                    // console.log({ groupStatusesCounts });
                    return Promise.resolve(groupStatusesCounts);
                }

                const runs = await getRunsByTestsQuery(query, 150);
                const agregateRuns = await Promise.all(runs.map(async (run) => {
                    run['statuses'] = await getCheckStatuses(await Test.find({ run: run.id }));
                    return run;
                }));

                // console.log({ runs });
                const currentRun = await Run.findById(opts.filter_run_eq)
                    .exec();

                const currentUser = req.user;
                res.render('pages/runs2', {
                    runs: agregateRuns,
                    currentRun,
                    user: currentUser,
                    opts: opts,
                });
            } catch (e) {
                fatalError(req, res, e);
                return reject(e);
            }
        }
    );
};

exports.admin = async function (req, res) {
    return new Promise(
        (resolve, reject) => {
            try {
                return resolve(res.render('pages/admin', {
                    user: req.user,
                }));
            } catch (e) {
                fatalError(req, res, e);
                return reject(e);
            }
        }
    );
};

exports.userinfo = async function (req, res) {
    return new Promise(
        async function (resolve, reject) {
            try {
                const user = req.user;
                res.json({ user });
                return resolve();
            } catch (e) {
                fatalError(req, res, e);
                return reject(e);
            }
        }
    );
};

// exports.login = async function (req, res) {
//     return new Promise(
//         (resolve, reject) => {
//             try {
//                 const { version } = require('../../../package.json');
//                 return res.render('pages/login', {
//                     version,
//                 });
//             } catch (e) {
//                 fatalError(req, res, e);
//                 return reject(e);
//             }
//         }
//     );
// };

exports.login = function (req, res) {
    try {
        if (req.user) {
            if (req.user.username !== 'Test') return res.redirect('/');
        }
        const { version } = require('../../../package.json');
        return res.render('pages/login', {
            origin: req.query.origin,
            version,
        });
    } catch (e) {
        return fatalError(req, res, e);
    }
};

exports.changePasswordPage = function (req, res) {
    try {
        const { version } = require('../../../package.json');
        return res.render('pages/changePassword', {
            version,
        });
    } catch (e) {
        return fatalError(req, res, e);
    }
};
