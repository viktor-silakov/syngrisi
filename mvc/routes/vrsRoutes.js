'use strict';

const { default: PQueue } = require('p-queue');

const queue = new PQueue({ concurrency: 1 });
const passport = require('passport');
const { ensureLoggedIn, ensureApiKey } = require('../../lib/ensureLogin/ensureLoggedIn');

module.exports = async function (app) {
    const UI = require('../controllers/ui/ui_controller');
    const API = require('../controllers/api/api_controller');

    await app
        .delete('/checks/:id', ensureLoggedIn(), async (req, res, next) => {
            API.removeCheck(req, res)
                .catch(next);
        })
        .put('/checks/:id', ensureLoggedIn(), async (req, res, next) => {
            API.updateCheck(req, res)
                .catch(next);
        })
        .put('/snapshots/:id', ensureLoggedIn(), async (req, res, next) => {
            API.updateSnapshot(req, res)
                .catch(next);
        })
        .get('/', ensureLoggedIn(),
            (req, res, next) => {
                UI.index(req, res)
                    .catch(next)
                    .catch(next);
            })
        .get('/runs', ensureLoggedIn(),
            (req, res, next) => {
                UI.runs(req, res)
                    .catch(next)
                    .catch(next);
            })
        .get('/affectedelements', ensureApiKey(), async function (req, res, next) {
            API.affectedElements(req, res)
                .catch(next)
                .catch(next);
        })
        .get('/checksgroupview', ensureLoggedIn(), async function (req, res, next) {
            UI.checksGroupView(req, res)
                .catch(next);
        })
        .get('/snapshootview', ensureLoggedIn(), async function (req, res, next) {
            UI.snapshotView(req, res)
                .catch(next);
        })
        .get('/diffview', ensureLoggedIn(), async function (req, res, next) {
            UI.diffView(req, res)
                .catch(next);
        })
        .get('/admin', ensureLoggedIn(), async function (req, res, next) {
            UI.admin(req, res)
                .catch(next);
        })
        .get('/changepassword', ensureLoggedIn(), (req, res) => {
            UI.changePasswordPage(req, res);
        })
        .get('/users', ensureLoggedIn(), async function (req, res, next) {
            API.getUsers(req, res)
                .catch(next);
        })
        .post('/password', ensureLoggedIn(), (req, res) => {
            API.changePassword(req, res);
        })
        .post('/checks', ensureApiKey(), async (req, res, next) => {
            req.log.trace(`post '/checks' queue pending count: `, queue.pending);
            await queue.add(() => API.createCheck(req, res)
                .catch(next));
        })
        .post('/users', ensureLoggedIn(), async (req, res, next) => {
            req.log.trace(`post '/users' queue pending count: `, queue.pending);
            await queue.add(() => API.createUser(req, res)
                .catch(next));
        })
        .put('/users', ensureLoggedIn(), async (req, res, next) => {
            req.log.trace(`put '/users' queue pending count: `, queue.pending);
            await queue.add(() => API.updateUser(req, res)
                .catch(next));
        })
        .post('/tests', ensureApiKey(), async (req, res, next) => {
            req.log.trace(`post '/tests' queue pending count: `, queue.pending);
            await queue.add(() => API.createTest(req, res)
                .catch(next));
        })
        .delete('/tests/:id', ensureLoggedIn(), async (req, res, next) => {
            API.removeTest(req, res)
                .catch(next);
        })
        .delete('/users/:id', ensureLoggedIn(), async (req, res, next) => {
            API.removeUser(req, res)
                .catch(next);
        })
        .get('/apikey/', ensureLoggedIn(), async (req, res, next) => {
            API.generateApiKey(req, res)
                .catch(next);
        })
        .delete('/suites/:id', ensureLoggedIn(), async (req, res, next) => {
            API.removeSuite(req, res)
                .catch(next);
        })
        .delete('/runs/:id', ensureLoggedIn(), async (req, res, next) => {
            API.removeRun(req, res)
                .catch(next);
        })
        // .put('/tests/:id', async (req, res, next) => {
        //     API.updateTest(req, res).catch(next);
        // })
        .post('/session/:testid', ensureApiKey(), async (req, res, next) => {
            API.stopSession(req, res)
                .catch(next);
        })
        .get('/checks', ensureLoggedIn(), async (req, res, next) => {
            req.log.trace(`get '/checks' queue pending count: `, queue.pending);
            await queue.add(() => API.getChecks(req, res)
                .catch(next));
        })
        .get('/snapshot/:id', ensureLoggedIn(), async (req, res, next) => {
            API.getSnapshot(req, res)
                .catch(next);
        })
        .get('/check/:id', ensureLoggedIn(), async (req, res, next) => {
            API.getCheck(req, res)
                .catch(next);
        })
        .get('/checks/byident/:testid', async (req, res, next) => {
            API.checksGroupByIdent(req, res)
                .catch(next);
        })
        .get('/check/:id', ensureLoggedIn(), async (req, res, next) => {
            API.getCheck(req, res)
                .catch(next);
        })
        .get('/test/:id', ensureLoggedIn(), async (req, res, next) => {
            API.getTestById(req, res)
                .catch(next);
        })
        .get('/logout', (req, res) => {
            req.logout();
            return res.redirect('/login');
        })
        .get('/userinfo', ensureLoggedIn(), async (req, res, next) => {
            UI.userinfo(req, res)
                .catch(next);
        })
        .get('/login', (req, res) => {
            UI.login(req, res);
        })
        .post('/login', (req, res, next) => {
            const origin = req.query.origin ? req.query.origin : '/';

            passport.authenticate('local',
                (err, user, info) => {
                    if (err) {
                        return next(err);
                    }

                    if (!user) {
                        return res.redirect('/login?info=' + JSON.stringify(info));
                    }

                    req.logIn(user, (err) => {
                        if (err) {
                            return next(err);
                        }

                        // console.log({user})
                        return res.redirect(origin);
                    });

                })(req, res, next);
        })
        // maintenance
        .get('/loadTestUser', ensureLoggedIn(), async (req, res, next) => {
            API.loadTestUser(req, res)
                .catch(next);
        })
        .get('/migration', ensureLoggedIn(), async (req, res, next) => {
            API.fixDocumentsTypes(req, res)
                .catch(next);
        })
        .get('/task_remove_empty_tests', ensureLoggedIn(), async (req, res, next) => {
            req.log.trace(`get '/task_remove_empty_tests' queue pending count: `, queue.pending);
            await queue.add(() => API.task_remove_empty_tests(req, res)
                .catch(next));
        })
        .get('/task_remove_empty_runs', ensureLoggedIn(), async (req, res, next) => {
            req.log.trace(`get '/task_remove_empty_runs' queue pending count: `, queue.pending);
            await queue.add(() => API.task_remove_empty_runs(req, res)
                .catch(next));
        });
};
