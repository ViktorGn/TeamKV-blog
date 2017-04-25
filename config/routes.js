const userController = require('./../controllers/user');
const articleController = require('./../controllers/article');
const homeController = require('./../controllers/home');

module.exports = (app) => {
    app.get('/', homeController.index);
    app.post('/search',homeController.fullTextSearch);
    app.post('/language', homeController.language);

    app.get('/user/register', userController.registerGet);
    app.post('/user/register', userController.registerPost);

    app.get('/user/login', userController.loginGet);
    app.post('/user/login', userController.loginPost);

    app.get('/user/logout', userController.logout);

    app.get('/article/create', articleController.createGet);
    app.post('/article/create', articleController.createPost);

    app.get('/article/edit/:id', articleController.editGet);
    app.post('/article/edit/:id', articleController.editPost);

    app.get('/article/delete/:id', articleController.delete);
    app.post('/article/delete/:id', articleController.confirmDelete);

    app.get('/article/details/:id', articleController.details);

    app.get('/article/myArticles', articleController.myArticles);
};

