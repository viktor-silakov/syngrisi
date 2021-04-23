/* eslint-disable dot-notation */
const querystring = require('querystring');
const mongoose = require('mongoose');
const hasha = require('hasha');
const fs = require('fs').promises;
const moment = require('moment');
const { config } = require('../../../config');
const { getDiff } = require('../../../lib/comparator');
const orm = require('../../../lib/dbItems');
const { parseDiff } = require('../../../lib/parseDiff');
const { getAllElementsByPositionFromDump } = require('../../../lib/getElementsByPixPositionsFromDump');

const Snapshot = mongoose.model('VRSSnapshot');
const Check = mongoose.model('VRSCheck');
const Test = mongoose.model('VRSTest');
const Suite = mongoose.model('VRSSuite');
const User = mongoose.model('VRSUser');
const { checksGroupedByIdent } = require('../utils');
const {
    fatalError, waitUntil, removeEmptyProperties, buildQuery, getSuitesByTestsQuery
} = require('../utils');

// get last updated document
async function getLastCheck(identifier) {
    const last = (await Check.find(identifier)
        .sort({ updatedDate: -1 })
        .limit(1))[0];
    if (last && last.baselineId) {
        return last;
    }
    return null;
}

async function getLastSuccessCheck(identifier) {
    const condition = [{
        ...identifier,
        'status': 'new'
    }, {
        ...identifier,
        'status': 'passed'
    }];
    return (await Check.find({
        $or: condition
    })
        .sort({ updatedDate: -1 })
        .limit(1))[0];
}

// API

// snapshots
async function getSnapshotByImgHash(hash) {
    return (await Snapshot.findOne({ imghash: hash }));
}

async function createSnapshot(parameters) {
    console.log({ parameters });
    const { params, fileData, hashCode, filename } = parameters;
    let opts = {
        name: params.name,
    };
    filename && (opts.filename = filename);

    if (!fileData && !hashCode) {
        throw new Error('Error: the \'fileData\' nor \'hashCode\' is set, you should provide at least one parameter');
    }

    opts.imghash = hashCode || hasha(fileData);
    // const equalSnapshot = await getSnapshotByImgHash(opts['imghash']);
    // if (equalSnapshot) {
    //     console.log(`Snapshot with hash: '${opts['imghash']}' is already exist.`);
    //     return equalSnapshot;
    // }
    // console.log(`Snapshot with hash: '${opts['imghash']}' doesn't exists creating new one...`);

    const snapshoot = new Snapshot(opts);
    !filename && (snapshoot.filename = snapshoot._id + '.png');
    snapshoot.save(function (err, result) {
        if (err) {
            throw err;
        }
    });
    if (fileData) {
        console.log(`Snapshot was saved: '${JSON.stringify(snapshoot)}'`);
        const path = `${config.defaultBaselinePath}${snapshoot.id}.png`;
        console.log(`Save screenshot to: '${path}'`);
        await fs.writeFile(path, fileData);
    }
    return snapshoot;
}

async function compareSnapshots(baseline, actual) {
    console.log(`Compare baseline and actual snapshots with ids: [${baseline.id}, ${actual.id}]`);
    console.log(`BASELINE: ${JSON.stringify(baseline)}`);
    let diff;
    if (baseline.imghash === actual.imghash) {
        console.log(`Baseline and actual snapshoot have the identical image hashes: '${baseline.imghash}'`);
        // stub for diff object
        diff = {
            isSameDimensions: true,
            dimensionDifference: {
                width: 0,
                height: 0
            },
            rawMisMatchPercentage: 0,
            misMatchPercentage: '0.00',
            analysisTime: 0,
            executionTotalTime: '0'
        };
    } else {
        const baselinePath = `${config.defaultBaselinePath}${baseline.filename || baseline.id + '.png'}`;
        const actualPath = `${config.defaultBaselinePath}${actual.filename || actual.id + '.png'}`;
        const baselineData = fs.readFile(baselinePath);
        const actualData = fs.readFile(actualPath);
        console.log(`baseline path: ${config.defaultBaselinePath}${baseline.id}.png`);
        console.log(`actual path: ${config.defaultBaselinePath}${actual.id}.png`);
        let opts = {};
        // back compatibility
        (baseline.ignoreRegions === 'undefined') && delete baseline.ignoreRegions;
        if (baseline.ignoreRegions) {
            let ignored = JSON.parse(JSON.parse(baseline.ignoreRegions));
            opts = { ignoredBoxes: ignored };
        }
        opts.ignore = baseline.matchType || 'antialiasing';
        diff = await getDiff(baselineData, actualData, opts);
    }

    console.log({ diff });
    if (parseFloat(diff.misMatchPercentage) !== 0) {
        console.log(`Images are different, ids: [${baseline.id}, ${actual.id}]`);
    }
    console.log({ diff });
    if (diff.stabMethod && diff.vOffset) {
        if (diff.stabMethod === 'downup') {
            // this mean that we delete first 'diff.vOffset' line of pixels from actual
            // then we will use this during parse actual page DOM dump
            actual.vOffset = -diff.vOffset;
            await actual.save();
        }
        if (diff.stabMethod === 'updown') {

            // this mean that we delete first 'diff.vOffset' line of pixels from baseline
            // then we will use this during parse actual page DOM dump
            baseline.vOffset = -diff.vOffset;
            await baseline.save();
        }
    }
    return diff;
}

exports.updateSnapshot = async function (req, res) {
    return new Promise(async function (resolve, reject) {
        try {
            let opts = removeEmptyProperties(req.body);
            let id = req.params.id;
            opts['updatedDate'] = Date.now();
            console.log(`UPDATE snapshot id: '${id}' with params: '${JSON.stringify(req.params)}', body: '${JSON.stringify(opts)}'`);
            const snp = await Snapshot.findByIdAndUpdate(id, opts)
                .exec()
                .catch(
                    function (e) {
                        console.log(`Cannot update a snapshot with id: '${id}', error: ${e}`);
                        fatalError(req, res, e);
                        return reject(e);
                    }
                );
            await snp.save();
            console.log(`Snapshot with id: '${id}' and opts: '${JSON.stringify(opts)}' was updated`);
            res.status(200)
                .json({
                    item: 'Snapshot',
                    action: 'update',
                    id: id,
                    opts: opts
                });
        } catch (e) {
            fatalError(req, res, e);
            return reject(e);
        }
    });
};

exports.getSnapshot = async function (req, res) {
    return new Promise(async function (resolve, reject) {
        try {
            let opts = removeEmptyProperties(req.body);
            let id = req.params.id;
            console.log(`GET snapshot with id: '${id}',  params: '${JSON.stringify(req.params)}', body: '${JSON.stringify(opts)}'`);
            const snp = await Snapshot.findById(id)
                .then(async function (snp) {
                    res.json(snp);
                })
                .catch(
                    (err) => {
                        res.status(400)
                            .send(`Cannot GET a snapshot with id: '${id}', error: ${err}`);
                        return resolve(err);
                    }
                );
        } catch (e) {
            fatalError(req, res, e);
            return reject(e);
        }
    });
};

function cloneSnapshoot(sourceSnapshoot, params, fileData) {
    return new Promise(async (resolve, reject) => {
        const filename = sourceSnapshoot.filename ? sourceSnapshoot.filename : sourceSnapshoot._id + '.png';
        const newSnapshoot = await createSnapshot({
            filename: filename,
            params: params,
            // fileData: fileData,
            hashCode: params.hashcode
        });
        resolve(newSnapshoot);
    });
}

const checksGroupByIdent = async function (req, res) {
    return new Promise(async function (resolve, reject) {
        try {
            let testId = req.params.testid;
            res.json(await checksGroupedByIdent({ test: testId })
                .catch(function (e) {
                    fatalError(req, res, e);
                    return reject(e);
                }));
        } catch (e) {
            fatalError(req, res, e);
            return reject(e);
        }
    });
};

exports.checksGroupByIdent = checksGroupByIdent;

exports.affectedElements = async function (req, res) {
    return new Promise(async function (resolve, reject) {
        try {
            if (!req.query.checktid || !req.query.diffid) {
                const e = 'checktid|diffid query values are empty';
                fatalError(req, res, e);
                return reject(e);
            }
            const chk = await Check.findById(req.query.checktid)
                .exec()
                .catch((e) => {
                        fatalError(req, res, e);
                        return reject(e);
                    }
                );
            if (!chk) {
                fatalError(req, res, `Cannot find check with such id: '${req.query.checktid}'`);
            }

            const imDiffData = await fs.readFile(`${config.defaultBaselinePath}${req.query.diffid}.png`)
                .catch(
                    function (e) {
                        throw new Error(e);
                    }
                );
            const positions = parseDiff(imDiffData);
            const result = await getAllElementsByPositionFromDump(JSON.parse(chk.domDump), positions);
            console.table(Array.from(result), ['tag', 'id', 'x', 'y', 'width', 'height', 'domPath']);
            res.json(result);
            return resolve(result);
        } catch (e) {
            fatalError(req, res, e);
        }
    });
};

function parseSorting(params) {
    const sortObj = Object.keys(params)
        .filter((key) => key.startsWith('sort_'))
        .reduce((obj, key) => {
            const props = key.split('_');
            const sortBy = props[1];
            const sortDirection = parseInt(props[2], 10);
            obj[sortBy] = sortDirection;
            return obj;
        }, {});

    return sortObj;
}

// users

function getApiKey() {
    const uuidAPIKey = require('uuid-apikey');

    return uuidAPIKey.create().apiKey;
}

exports.generateApiKey = async function (req, res) {
    return new Promise(async function (resolve, reject) {
        const apiKey = getApiKey();
        console.log(`Generate Api Key for user: '${req.user.username}'`);
        const hash = hasha(apiKey);
        const user = await User.findOne({ username: req.user.username });
        user.apiKey = hash;
        await user.save();

        res.status(200)
            .json({ apikey: apiKey });
        return resolve();
    });
};

exports.createUser = async function (req, res) {
    return new Promise(
        async function (resolve, reject) {
            try {
                let params = req.body;

                console.log(`Create user with name '${params.username}', params: '${JSON.stringify(params)}'`);

                let opts = removeEmptyProperties(Object.assign(params, { updatedDate: new Date() }));
                orm.createUser(opts)
                    .then((user) => {
                        user.setPassword(opts.password)
                            .then(async (usr) => {
                                await usr.save();
                                console.log(`Password for user: '${user.username}' set successfully`);
                                res.json(user);
                                return resolve([req, res, user]);
                            })
                            .catch((e) => {
                                fatalError(req, res, e);
                                return reject(e);
                            });
                    })
                    .catch((e) => {
                        fatalError(req, res, e);
                        return reject(e);
                    });
            } catch (e) {
                fatalError(req, res, e);
                return reject(e);
            }
        });
};

exports.getUsers = async function (req, res) {
    return new Promise(async function (resolve, reject) {
        const users = await User.find()
            .exec();
        res.status(200)
            .json(users);
        return resolve(users);
    });
};

const updateUser = async function (req, res) {
    return new Promise(
        async function (resolve, reject) {
            try {
                let params = req.body;

                console.log(`Update user with id: '${params.id}' name '${params.username}', params: '${JSON.stringify(params)}'`);

                let opts = removeEmptyProperties(Object.assign(params, { updatedDate: new Date() }));

                const user = await User.findById(opts.id);
                if (!user) {
                    res.status(500)
                        .json({
                            status: 'Error',
                            message: `Cannot find user with id: '${opts.id}'`
                        });
                    return reject;
                }
                const password = opts.password;

                await User.findByIdAndUpdate(user._id, params)
                    .catch((e) => {
                        fatalError(req, res, e);
                        return reject(e);
                    });
                if (password) {
                    await user.setPassword(password);
                    await user.save();
                }
                console.log(`User '${user.username}' was updated successfully`);
                res.json(user);
                return resolve([req, res, user]);

            } catch (e) {
                fatalError(req, res, e);
                return reject(e);
            }
        });
};

exports.updateUser = updateUser;

exports.removeUser = function (req, res) {
    return new Promise(async function (resolve, reject) {
        try {
            const id = req.params.id;
            console.log(`Remove user with id: '${id}'`);
            const user = await User.findByIdAndDelete(id);
            console.log(`User with id: '${user._id}' and username: '${user.username}' was removed`);
            res.status(200)
                .send({ message: `User with id: '${user._id}' and username: '${user.username}' was removed` });
            return resolve();
        } catch (e) {
            fatalError(req, res, e);
            return reject(e);
        }
    });
};

exports.changePassword = async function (req, res) {
    return new Promise(
        async function (resolve, reject) {
            try {
                let params = req.body;

                console.log(`Change password for  '${req.user.username}', params: '${JSON.stringify(params)}'`);
                User.findOne({ username: req.user.username })
                    .then(foundUser => {
                        foundUser.changePassword(params['old-password'], params['new-password'])
                            .then(() => {
                                console.log(`password was successfully changed for user: ${req.user.username}`);
                                res.redirect('/login');
                            })
                            .catch((error) => {
                                fatalError(req, res, e);
                                return reject(e);
                            });
                    })
                    .catch((error) => {
                        fatalError(req, res, e);
                        return reject(e);
                    });
                return resolve();

            } catch (e) {
                fatalError(req, res, e);
                return reject(e);
            }
        });
};

// tests
function updateTest(opts) {
    return new Promise(async function (resolve, reject) {
        try {
            const id = opts.id;
            opts['updatedDate'] = Date.now();
            console.log(`UPDATE test id '${id}' with params '${JSON.stringify(opts)}'`);

            const tst = await Test.findByIdAndUpdate(id, opts)
                .exec()
                .catch(
                    function (e) {
                        console.log(`Cannot update the test, error: '${e}'`);
                        return reject(e);
                    }
                );
            tst.save()
                .catch(
                    function (e) {
                        console.log(`Cannot save the test, error: '${e}'`);
                        return reject(e);
                    }
                );
            return resolve(tst);
        } catch (e) {
            reject(e);
        }
    });

}

exports.updateTest = async function (req, res) {
    return new Promise(
        async function (resolve, reject) {
            try {
                let opts = removeEmptyProperties(req.body);
                let id = req.params.id;
                opts['updatedDate'] = Date.now();
                console.log(`UPDATE test id '${id}' with params '${JSON.stringify(opts)}'`);

                const tst = await Test.findByIdAndUpdate(id, opts)
                    .exec()
                    .catch(
                        function (e) {
                            console.log(`Cannot update the test, error: '${e}'`);
                            fatalError(req, res, e);
                            return reject(e);
                        }
                    );
                tst.save()
                    .catch(
                        function (e) {
                            console.log(`Cannot save the test, error: '${e}'`);
                            fatalError(req, res, e);
                            return reject(e);
                        }
                    );
                res.status(200)
                    .send(`Test with id: '${id}' was updated`);
                return resolve(tst);
            } catch (e) {
                fatalError(req, res, e);
                return reject(e);
            }
        });
};

function removeTest(id) {
    return new Promise(function (resolve, reject) {
        try {
            console.log(`Try to delete all checks associated to test with ID: '${id}'`);
            Check.remove({ test: id })
                .then(function (result) {
                    console.log(`DELETE test with ID: '${id}'`);
                    Test.findByIdAndDelete(id)
                        .then(function (out) {
                            return resolve(out);
                        });
                });
        } catch (e) {
            return reject(e);
        }
    });
}

exports.removeTest = function (req, res) {
    return new Promise(async function (resolve, reject) {
        try {
            const id = req.params.id;
            removeTest(id)
                .then(function (output) {
                    res.status(200)
                        .send(`Test with id: '${id}' and all related checks were removed
                        output: '${JSON.stringify(output)}'`);
                    return resolve();
                });
        } catch (e) {
            fatalError(req, res, e);
            return reject(e);
        }
    });
};

exports.createTest = async function (req, res) {
    return new Promise(
        async function (resolve, reject) {
            try {
                let params = req.body;

                req.log.info(`Create test with name '${params.testname}', params: '${JSON.stringify(params)}'`);

                let opts = removeEmptyProperties({
                    name: params.name,
                    status: params.status,
                    viewport: params.viewport,
                    browserName: params.browser,
                    browserVersion: params.browserVersion,
                    browserFullVersion: params.browserFullVersion,
                    os: params.os,
                    startDate: new Date(),
                    updatedDate: new Date(),
                });

                let run;
                if (params.run) {
                    run = await orm.createRunIfNotExist({ name: params.run });
                    opts.run = run.id;
                }
                const test = await orm.createTest(opts);

                res.json(test);
                return resolve([req, res, test]);

            } catch (e) {
                return reject(e);
                fatalError(req, res, e);
            }
        });
};

function calculateTestStatus(testId) {
    return new Promise(async function (resolve, reject) {
        const checksInTest = await Check.find({ test: testId });
        const statuses = checksInTest.map(x => x.status[0]);
        let testCalculatedStatus = 'Failed';
        if (statuses.every(x => (x === 'new') || (x === 'passed'))) {
            testCalculatedStatus = 'Passed';
        }
        if (statuses.every(x => (x === 'new'))) {
            testCalculatedStatus = 'New';
        }
        // console.log({ testCalculatedStatus });
        return resolve(testCalculatedStatus);
    });
}

// suites
exports.removeSuite = async function (req, res) {
    return new Promise(async function (resolve, reject) {
        try {
            const id = req.params.id;
            console.log(`DELETE test and checks which associate with the suite with ID: '${id}'`);
            const tests = await Test.find({ suite: id });

            let results = [];
            for (const test of tests) {
                results.push(removeTest(test._id));
            }

            Promise.all(results)
                .then(function (result) {
                    Suite.findByIdAndDelete(id)
                        .then(function (out) {
                            res.status(200)
                                .send(`Suite with id: '${id}' and all related tests and checks were removed
                    output: '${JSON.stringify(out)}'`);
                            return resolve();
                        });
                });
        } catch (e) {
            return reject(e);
        }
    });
};

// checks
function prettyCheckParams(result) {
    if (!result.domDump) {
        return JSON.stringify(result);
    }
    const dump = JSON.parse(result.domDump);
    let resObs = { ...result };
    delete resObs.domDump;
    resObs.domDump = JSON.stringify(dump)
        .substr(0, 20) + `... and about ${dump.length} items]`;
    return JSON.stringify(resObs);
}

exports.createCheck = async function (req, res) {
    return new Promise(
        async function (resolve, reject) {
            let test;
            let suite;
            let currentUser;
            try {
                console.log(`CREATE check name: '${prettyCheckParams(req.body.name)}'`);
                let executionTimer = process.hrtime();
                currentUser = await User.findOne({ apiKey: req.headers.apikey })
                    .exec();

                checkRequestBody: {
                    if (!req.body.testid) {
                        const errMsg = `Cannot create check without 'testid' parameter, try to initialize the session at first. parameters: '${JSON.stringify(req.body)}'`;
                        res.status(400)
                            .send({
                                status: 'paramNotFound',
                                message: errMsg,
                            });
                        reject(errMsg);
                        return;
                    }
                    if (!req.body.hashcode) {
                        const errMsg = `Cannot create check without 'hashcode' parameter, parameters: '${JSON.stringify(req.body)}'`;
                        res.status(400)
                            .send({
                                status: 'paramNotFound',
                                message: errMsg,
                            });
                        reject(errMsg);
                        return;
                    }

                    console.log(`Try to find test with id: '${req.body.testid}'`);
                    test = await Test.findById(req.body.testid)
                        .exec();
                    if (!test) {
                        const errMsg = `Error: Can not find test with id: '${req.body.testid}', parameters: '${JSON.stringify(req.body)}'`;
                        res.status(400)
                            .send({
                                status: 'testNotFound',
                                message: errMsg
                            });

                        reject(errMsg);
                        return;
                    }
                }
                suite = await orm.createSuiteIfNotExist({ name: req.body.suitename || 'Others' });
                orm.updateItem('VRSTest', { _id: test.id }, {
                    suite: suite.id,
                    creatorId: currentUser._id,
                    creatorUsername: currentUser.username
                });

                let params = {
                    testname: req.body.testname,
                    test: req.body.testid,
                    name: req.body.name,
                    viewport: req.body.viewport,
                    browserName: req.body.browserName,
                    browserVersion: req.body.browserVersion,
                    browserFullVersion: req.body.browserFullVersion,
                    os: req.body.os,
                    updatedDate: Date.now(),
                    suite: suite.id,
                    app: (await orm.createAppIfNotExist({ name: req.body.appName || 'Unknown' })).id,
                    domDump: req.body.domdump,
                    run: test.run,
                    creatorId: currentUser._id,
                    creatorUsername: currentUser.username
                };

                const fileData = req.files ? req.files.file.data : false;
                /**
                 * Usually there is two stage of checking request:
                 * Phase 1
                 *   1. Client sends request with 'req.body.hashcode' value but without 'req.files.file.data'
                 *   2. Server finds for snapshot with this image 'hashcode' and if found - go to Step 3 of Phase2,
                 *      if not - sends response "{status: 'requiredFileData', message: 'cannot found an image with this hashcode,
                 *      please add image file data and resend request'}"
                 * Phase 2
                 *   1. Client receives response with incomplete status and resend the same request but with 'req.files.file.data' parameter
                 *   2. Server create a new snapshot based on parameters
                 *   3. Server handle checking the snapshoot and return to client check response with one of 'complete` status (eq:. new, failed, passed)
                 */
                const snapshotFoundedByHashcode = await getSnapshotByImgHash(req.body.hashcode);
                if (!req.files && !snapshotFoundedByHashcode) {
                    console.log(`Cannot find snapshoot with hash: '${req.body.hashcode}', response with 206, 'requiredFileData' message`);
                    res.status(206)
                        .json({
                            status: 'requiredFileData',
                            message: 'cannot found an image with this hashcode, please add image file data and resend request',
                            hashCode: req.body.hashcode
                        });
                    return resolve();
                }
                if (snapshotFoundedByHashcode) {
                    console.log(`FOUND snapshoot by hashcode: '${JSON.stringify(snapshotFoundedByHashcode)}'`);
                }
                let currentSnapshot,
                    baselineSnapshoot,
                    actualSnapshot;

                // check MUST be identified by Name, OS, Browser, Viewport, App
                const checkIdentifier = {
                    name: params.name,
                    os: params.os,
                    browserName: params.browserName,
                    viewport: params.viewport,
                    app: params.app,
                };
                const lastSuccessCheck = await getLastSuccessCheck(checkIdentifier);
                handleBaseline:{

                    console.log(`Find for baseline for check with identifier: '${JSON.stringify(checkIdentifier)}'`);
                    const lastCheck = await getLastCheck(checkIdentifier);

                    const previousBaselineId = lastCheck ? lastCheck.baselineId : null;

                    let newClonedSnapshot;
                    if (snapshotFoundedByHashcode) {
                        newClonedSnapshot = await cloneSnapshoot(snapshotFoundedByHashcode, req.body, fileData);
                    }
                    currentSnapshot = newClonedSnapshot || (await createSnapshot({
                        params: req.body,
                        fileData: fileData,
                        hashCode: req.body.hashcode
                    }));
                    if (previousBaselineId) {
                        console.log(`A baseline for check name: '${req.body.name}', id: '${previousBaselineId}' is already exists`);
                        params.baselineId = previousBaselineId;

                        console.log(`Creating an actual snapshot for check with name: '${req.body.name}'`);

                        actualSnapshot = currentSnapshot;
                        baselineSnapshoot = await Snapshot.findById(previousBaselineId);
                        params.actualSnapshotId = actualSnapshot.id;
                        params.status = 'pending';
                        if (lastCheck.markedAs === 'accepted') {
                            params.markedAs = 'accepted';
                            params.markedDate = lastCheck.markedDate;
                            params.markedByUsername = lastCheck.markedByUsername;
                        }
                    } else {
                        console.log(`A baseline snapshot for previous check with name: '${req.body.name}', does not exist creating new one`);
                        const baseline = currentSnapshot;
                        baselineSnapshoot = currentSnapshot;
                        params.baselineId = baseline.id;
                        params.status = 'new';
                    }
                }
                console.log(`Create and save new check with params: '${prettyCheckParams(params)}'`);
                let check = await Check.create(params);

                // update test and suite
                const testCalculatedAcceptedStatus = await calculateAcceptedStatus(check.test);

                // test.status = testCalculatedStatus;
                test.markedAs = testCalculatedAcceptedStatus;
                test.updatedDate = moment(new Date())
                    .format('YYYY-MM-DD hh:mm');

                await orm.updateItemDate('VRSSuite', check.suite);
                await test.save();

                let resultResponse;
                await check.save()
                    .then(function (chk) {
                        resultResponse = chk;
                        console.log(`Check with id: '${check.id}', successful saved!`);
                    })
                    .catch(function (error) {
                        res.send(error);
                        console.log(`Cannot save the check, error: '${error}'`);
                    });

                // compare actual with baseline if a check isn't new
                let updateParams = {};
                let totalCheckHandleTime;
                let compareResult;
                if (check.status.toString() !== 'new') {
                    try {
                        console.log(`The check isn't new, make comparing`);
                        compareResult = await compareSnapshots(baselineSnapshoot, actualSnapshot);
                        if (compareResult.misMatchPercentage !== '0.00') {
                            console.log(`Saving diff snapshot for check with Id: '${check.id}'`);
                            const diffSnapshot = await createSnapshot({
                                params: req.body,
                                fileData: compareResult.getBuffer()
                            });
                            updateParams['diffId'] = diffSnapshot.id;
                            updateParams['status'] = 'failed';
                        } else {
                            updateParams['status'] = 'passed';
                        }

                        updateParams['updatedDate'] = Date.now();
                        totalCheckHandleTime = process.hrtime(executionTimer)
                            .toString();

                        compareResult['totalCheckHandleTime'] = totalCheckHandleTime;
                        console.log({ compareResult });
                        updateParams['result'] = JSON.stringify(compareResult, null, '\t');

                        console.log(`Update check with params: '${JSON.stringify(updateParams)}'`);
                    } catch (e) {
                        updateParams['status'] = 'failed';
                        updateParams['result'] = `{ error: "Server error - '${e}'" }`;
                        await Check.findByIdAndUpdate(check._id, updateParams);
                        resultResponse = await Check.findById(check.id);
                        throw e;
                    }
                    await Check.findByIdAndUpdate(check._id, updateParams);
                    resultResponse = await Check.findById(check.id);
                }
                const result = Object.assign({}, resultResponse.toObject(),
                    {
                        executeTime: totalCheckHandleTime,
                        lastSuccess: lastSuccessCheck ? (lastSuccessCheck).id : null
                    });
                res.json(result);
                return resolve([req, res, result]);
            } catch (e) {
                fatalError(req, res, e);
                return reject(e);
            }
        }
    );
};

exports.getChecks = async function (req, res) {
    return new Promise(async function (resolve, reject) {
        const opts = req.query;

        const pageSize = parseInt(process.env['PAGE_SIZE'], 10) || 50;

        const skip = opts.page ? ((parseInt(opts.page, 10)) * pageSize - pageSize) : 0;

        let sortFilter = parseSorting(opts);
        if (Object.keys(sortFilter).length < 1) {
            sortFilter = { updatedDate: -1 };
        }

        const query = buildQuery(opts);
        // console.log({opts})
        if (opts.filter_suitename_eq) {
            const decodedQuerystringSuiteName = Object.keys(querystring.decode(opts.filter_suitename_eq))[0];
            const suite = await Suite.findOne({ name: { $eq: decodedQuerystringSuiteName } })
                .exec();
            if (opts.filter_suitename_eq && !suite) {
                res.status(200)
                    .json({});
                return resolve({});
            }
            if (suite) {
                query.suite = suite.id;

                delete query.suitename;
            }
        }

        if (req.user.role === 'user') {
            query.creatorUsername = req.user.username;
        }

        const tests = await Test
            .find(query)
            .sort(sortFilter)
            .skip(skip)
            .limit(pageSize)
            .exec();

        // const suites = await getSuitesByTestsQuery(query);
        //
        // // const SS = tests.select('suite');
        // console.log({ suites });
        // // console.log({query})

        const checksByTestGroupedByIdent = {};

        for (const test of tests) {
            const checkFilter = { test: test.id };
            const groups = await checksGroupedByIdent(checkFilter);
            // console.log(groups);
            if (Object.keys(groups).length < 1) {
                continue;
            }
            // console.log({groups})
            checksByTestGroupedByIdent[test.id] = groups;
            checksByTestGroupedByIdent[test.id]['id'] = test.id;
            checksByTestGroupedByIdent[test.id]['creatorId'] = test.creatorId;
            checksByTestGroupedByIdent[test.id]['creatorUsername'] = test.creatorUsername;
            checksByTestGroupedByIdent[test.id]['markedAs'] = test.markedAs;
            checksByTestGroupedByIdent[test.id]['markedByUsername'] = test.markedByUsername;
            checksByTestGroupedByIdent[test.id]['markedDate'] = test.markedDate;
            checksByTestGroupedByIdent[test.id]['markedAs'] = test.markedAs;
            checksByTestGroupedByIdent[test.id]['name'] = test.name;
            checksByTestGroupedByIdent[test.id]['status'] = test.status;
            checksByTestGroupedByIdent[test.id]['browserName'] = test.browserName;
            checksByTestGroupedByIdent[test.id]['browserVersion'] = test.browserVersion;
            checksByTestGroupedByIdent[test.id]['browserFullVersion'] = test.browserFullVersion;
            checksByTestGroupedByIdent[test.id]['viewport'] = test.viewport;
            checksByTestGroupedByIdent[test.id]['calculatedViewport'] = test.calculatedViewport;
            checksByTestGroupedByIdent[test.id]['os'] = test.os;
            checksByTestGroupedByIdent[test.id]['blinking'] = test.blinking;
            checksByTestGroupedByIdent[test.id]['updatedDate'] = test.updatedDate;
            checksByTestGroupedByIdent[test.id]['createdDate'] = test.createdDate;
            checksByTestGroupedByIdent[test.id]['suite'] = test.suite;
            checksByTestGroupedByIdent[test.id]['run'] = test.run;
        }
        res.status(200)
            .json(checksByTestGroupedByIdent);
        return resolve(checksByTestGroupedByIdent);
    });
};

exports.getCheck = async function (req, res) {
    return new Promise(async function (resolve, reject) {
        try {
            let opts = removeEmptyProperties(req.body);
            let id = req.params.id;
            console.log(`GET check with id: '${id}',  params: '${JSON.stringify(req.params)}', body: '${JSON.stringify(opts)}'`);
            await Check.findById(id)
                .then(async function (snp) {
                    res.json(snp);
                })
                .catch(
                    (err) => {
                        res.status(400)
                            .send(`Cannot GET a check with id: '${id}', error: ${err}`);
                        return resolve(err);
                    }
                );
        } catch (e) {
            fatalError(req, res, e);
            return reject(e);
        }
    });
};

function calculateAcceptedStatus(testId) {
    return new Promise(async function (resolve, reject) {
        const checksInTest = await Check.find({ test: testId });
        const statuses = checksInTest.map(x => x.markedAs);
        if (statuses.length < 1) {
            return resolve('Unaccepted');
        }
        let testCalculatedStatus = 'Unaccepted';
        if (statuses.some(x => x === 'accepted')) {
            testCalculatedStatus = 'Partially';
        }
        if (statuses.every(x => x === 'accepted')) {
            testCalculatedStatus = 'Accepted';
        }
        console.log({ testCalculatedStatus });
        return resolve(testCalculatedStatus);
    });
}

function addMarkedAsOptions(opts, user, mark) {
    opts.markedById = user._id;
    opts.markedByUsername = user.username;
    opts.markedDate = moment(new Date())
        .format('YYYY-MM-DD hh:mm');
    opts.markedAs = mark;
    return opts;
}

exports.updateCheck = async function updateCheck(req, res) {
    return new Promise(async function (resolve, reject) {
        try {
            let opts = removeEmptyProperties(req.body);
            const checkId = req.params.id;
            const check = await Check.findById(checkId)
                .exec();
            const test = await Test.findById(check.test)
                .exec();

            if (opts.accept === 'true') {
                console.log(`ACCEPT check: ${checkId}`);
                opts = addMarkedAsOptions(opts, req.user, 'accepted');
            } else {
                await test.updateOne({
                    status: 'Running',
                    updatedDate: moment(new Date()),
                    // .format('YYYY-MM-DD hh:mm'),
                })
                    .exec();
            }
            delete opts.id;
            delete opts.accept;
            await Check.findByIdAndUpdate(check._id, opts);

            const testCalculatedStatus = await calculateTestStatus(check.test);
            const testCalculatedAcceptedStatus = await calculateAcceptedStatus(check.test);

            opts['updatedDate'] = Date.now();

            console.log(`UPDATE check id: '${checkId}' with params: '${JSON.stringify(req.params)}', body: '${JSON.stringify(opts)}'`);

            test.status = testCalculatedStatus;
            test.markedAs = testCalculatedAcceptedStatus;
            test.updatedDate = moment(new Date())
                .format('YYYY-MM-DD hh:mm');

            await orm.updateItemDate('VRSSuite', check.suite);
            console.log(`UPDATE test with status: '${testCalculatedStatus}', marked: '${testCalculatedAcceptedStatus}'`);
            await test.save();
            console.log({ test });
            await check.save();
            console.log(`Check with id: '${checkId}' was updated`);

            res.status(200)
                .send(`Check with id: '${checkId}' was updated`);
            resolve();
        } catch (e) {
            fatalError(req, res, e);
            return reject(e);
        }
    });
};

exports.removeCheck = async function (req, res) {
    return new Promise(function (resolve, reject) {
        try {
            const id = req.params.id;
            console.log(`DELETE check with ID: '${id}'`);

            Check.findByIdAndDelete(id)
                .then(async function (check) {

                    const test = await Test.findById(check.test)
                        .exec();
                    const testCalculatedStatus = await calculateTestStatus(check.test);
                    const testCalculatedAcceptedStatus = await calculateAcceptedStatus(check.test);

                    console.log(`DELETE check id: '${id}' with params: '${JSON.stringify(req.params)}'`);
                    test.status = testCalculatedStatus;
                    test.markedAs = testCalculatedAcceptedStatus;
                    test.updatedDate = moment(new Date())
                        .format('YYYY-MM-DD hh:mm');

                    await orm.updateItemDate('VRSSuite', check.suite);
                    test.save();

                    console.log(`Check with id: '${id}' was removed`);
                    res.status(200)
                        .send(`Check with id: '${id}' was removed`);
                })
                .catch(
                    (e) => {
                        console.log(`Cannot remove a check with id: '${id}', error: '${e}'`);
                        fatalError(req, res, e);
                        return reject(e);
                    }
                );

        } catch (e) {
            fatalError(req, res, e);
            return reject(e);
        }
    });
};

exports.getTestById = async function (req, res) {
    return new Promise(async function (resolve, reject) {
        try {
            let opts = removeEmptyProperties(req.body);
            let id = req.params.id;
            console.log(`GET test with id: '${id}',  params: '${JSON.stringify(req.params)}', body: '${JSON.stringify(opts)}'`);
            await Test.findById(id)
                .then(async function (snp) {
                    res.json(snp);
                })
                .catch(
                    (err) => {
                        res.status(400)
                            .send(`Cannot GET a test with id: '${id}', error: ${err}`);
                        return resolve(err);
                    }
                );
        } catch (e) {
            fatalError(req, res, e);
            return reject(e);
        }
    });
};

exports.stopSession = async function (req, res) {
    return new Promise(async function (resolve, reject) {
        try {
            let testId = req.params.testid;
            if (!testId || testId === 'undefined') {
                return reject(fatalError(req, res, 'Cannot stop test Session testId is empty'));
            }
            await waitUntil(async () => {
                return (await Check.find({ test: testId })
                    .exec())
                    .filter(ch => ch.status.toString() !== 'pending').length > 0;
            });
            const checksGroup = await checksGroupedByIdent({ test: testId });
            const groupStatuses = Object.keys(checksGroup)
                .map(group => checksGroup[group].status);
            // console.log(JSON.stringify(checksGroup, null, "\t"));
            const groupViewPorts = Object.keys(checksGroup)
                .map(group => checksGroup[group].viewport);
            // console.log({groupViewPorts});
            const uniqueGroupViewports = Array.from(new Set(groupViewPorts));
            let testViewport;
            if (uniqueGroupViewports.length === 1) {
                testViewport = uniqueGroupViewports[0];
            } else {
                testViewport = uniqueGroupViewports.length;
            }

            let testStatus = 'not set';
            if (groupStatuses.some(st => st === 'failed')) {
                testStatus = 'Failed';
            }
            if (groupStatuses.some(st => st === 'passed')
                && !groupStatuses.some(st => st === 'failed')) {
                testStatus = 'Passed';
            }
            if (groupStatuses.some(st => st === 'new')
                && !groupStatuses.some(st => st === 'failed')) {
                testStatus = 'Passed';
            }
            if (groupStatuses.some(st => st === 'blinking')
                && !groupStatuses.some(st => st === 'failed')) {
                testStatus = 'Passed';
            }
            if (groupStatuses.every(st => st === 'new')) {
                testStatus = 'New';
            }
            const blinkingCount = groupStatuses.filter(g => g === 'blinking').length;
            const testParams = {
                id: testId,
                status: testStatus,
                blinking: blinkingCount,
                calculatedViewport: testViewport
            };
            console.log(`Session ending test update with params: '${JSON.stringify(testParams)}'`);
            const updatedTest = await updateTest(testParams)
                .catch(function (e) {
                    console.log(`Cannot update session: ${e}`);
                    throw (e.stack ? e.stack.split('\n') : e);
                });
            const result = updatedTest.toObject();
            result.calculatedStatus = testStatus;
            res.json(result);
            return resolve(result);
        } catch (e) {
            fatalError(req, res, e);
            return reject(e);
        }
    });
};

// maintain
exports.removeEmptyTests = async function removeEmptyTests(req, res) {
    return new Promise(async function (resolve, reject) {
        res.write('<pre>\n');
        res.write('- query all tests\n');
        console.log('- query all tests\n');

        const tests = await (Test.find({})
            .exec());
        res.write(`tests count: '${await Test.count()}'\n`);
        console.log(`tests count: '${await Test.count()}'\n`);

        res.write('- remove empty tests\n');
        console.log('>- remove empty tests\n');

        for (const test of tests) {
            let checkFilter = { test: test.id };
            const groups = await checksGroupedByIdent(checkFilter);

            if (Object.keys(groups).length < 1) {
                if (Object.keys(groups).length < 1) {
                    await removeTest(test._id);
                    res.write(test._id.toString() + '\n');
                }
            }
        }

        res.write('- done\n');
        console.log('- done\n');
        res.write('</pre>\n');
        res.end();
        return resolve();
    });
};

exports.loadTestUser = async function (req, res) {
    return new Promise(async function (resolve, reject) {
        if (process.env.TEST !== '1') {
            return res.json({ msg: 'the feature works only in test mode' });
        }
        const testAdmin = await User.findOne({ username: 'Test' });
        if (!testAdmin) {
            const fs = require('fs');
            console.log('Create the test Administrator');
            const adminData = JSON.parse(fs.readFileSync('./lib/testAdmin.json'));
            const admin = await User.create(adminData);
            console.log(`Test Administrator with id: '${admin._id}' was created`);
            res.json(admin);
        } else {
            console.log(testAdmin);
            res.send(`{"msg": "Already exist '${testAdmin}'"`);
        }
    });
};

exports.fixDocumentsTypes = function (req, res) {
    return new Promise(async function (resolve, reject) {
        if (req.user.role !== 'admin') {
            res.status(401)
                .json({ error: 'You need to have \'admin\' role to access the page' });
            return resolve();
        }
        const checks = await Check.find({});
        for (const check of checks) {
            console.log({ check });
            check.baselineId && (check.baselineId = mongoose.Types.ObjectId(check.baselineId));
            check.actualSnapshotId && (check.actualSnapshotId = mongoose.Types.ObjectId(check.actualSnapshotId));
            check.actualSnapshotId && (check.diffId = mongoose.Types.ObjectId(check.diffId));
        }
        return resolve(res.json(checks));
    });
};


