const Article = require('mongoose').model('Article');
const PersistentStore = require('mongoose').model('PersistentStore');
const fileSystem = require('fs');
var uuid = require('uuid');


module.exports = {
    createGet: (req, res) => {
        if (!req.session.language) {
            req.session.language = 'English';
        }
        let language = req.session.language;

        if(!req.isAuthenticated()) {
            errorMsg = 'You should be logged in to make articles!';

            req.session.returnUrl = '/article/create/';
            res.render(language + '/user/login', {error: errorMsg, layout: language + '/join.hbs'});
            return;
        }

        if (req.session.UAK == 'kR0Efjbnru') {
            res.render(language + '/article/create', {UAK: true, layout: language + '/layout.hbs'});
        } else {
            res.render(language + '/article/create', {layout: language + '/layout.hbs'});
        }
    },

    createPost: (req, res) => {
        let articleArgs = req.body;
        let picture = req.files.picture;

        if (!req.session.language) {
            req.session.language = 'English';
        }
        let language = req.session.language;

        if (picture) {
            // get the extension and rename to unique filename
            pictureFilenameExt=picture.name.split('.').pop();
            let filename =  uuid.v4() + pictureFilenameExt; /* instead of picture.name */
            articleArgs.picturePath = '/pictures/' + filename;
                picture.mv('./public/pictures/' + filename, err => {
                if (err) {
                    consol.e.log(err.message);
                }
            });
        } else {
            articleArgs.picturePath = '/pictures/noPicture.jpg';
        }

        let errorMsg = '';
        if(!req.isAuthenticated()){
            errorMsg = 'You should be logged in to make articles!'
        } else if (!articleArgs.title){
            errorMsg = 'Invalid title!';
        } else if (!articleArgs.content){
            errorMsg = 'Invalid content!';
        }

        if (errorMsg) {
            res.render(language + '/article/create', {error: errorMsg, layout: language + '/layout.hbs'});
            return;
        }

        articleArgs.author = req.user.id;

        Article.create(articleArgs).then(article => {
            req.user.articles.push(article.id);
            req.user.save(err => {
                if (err) {
                    res.redirect('/', {error: err.message});
                } else {
                    res.redirect('/article/details/' + article.id);
                }
            })
        })
    },

    details: (req, res) => {
        let id = req.params.id;
        let UAK = false;
        let language = req.session.language;

        if (req.session.UAK == 'kR0Efjbnru') {
            UAK = true;
        }

        if (!req.session.language) {
            req.session.language = 'English';
        }

        Article.findById(id).populate('author').then(article => {
            let viewCount = article.viewCount + 1;
            let category = article.category;

            if (!req.user) {
                res.render(language + '/article/details', {
                    article: article,
                    category: category,
                    isUserAuthorized: false,
                    layout: language + '/layout.hbs'
                });
            } else {
                req.user.isInRole('Admin').then(isAdmin => {
                    let isUserAuthorized = isAdmin || req.user.isAuthor(article);

                    Article.update({_id: id}, {$set: {viewCount: viewCount}}).then(updateStatus => {
                        res.render(language + '/article/details', {
                            UAK: UAK,
                            article: article,
                            category: category,
                            isUserAuthorized: isUserAuthorized,
                            layout: language + '/layout.hbs'
                        });
                    });
                });
            }
        })
    },

    editGet: (req, res) => {
        let id = req.params.id;
        if (!req.session.language) {
            req.session.language = 'English';
        }
        let language = req.session.language;

        if (!req.user || !req.isAuthenticated()) {
            req.session.returnUrl = '/article/edit/' + id;
            res.redirect('/user/login');
            return;
        }

        Article.findById(id).then(article => {

            req.user.isInRole('Admin').then(isAdmin => {
                if(!isAdmin && !req.user.isAuthor(article)) {
                    res.redirect('/');
                    return;
                }

                if (req.session.UAK == 'kR0Efjbnru') {
                    res.render(language + '/article/edit', {UAK: true, article: article, layout: language + '/layout.hbs'})
                } else {
                    res.render(language + '/article/edit', {article: article, layout: language + '/layout.hbs'})
                }
            });
        });
    },

    editPost: (req, res) => {
        let id = req.params.id;
        let articleArgs = req.body;
        let errorMessage = '';
        if (!req.session.language) {
            req.session.language = 'English';
        }
        let language = req.session.language;

        if (!articleArgs.title) {
            errorMessage = 'Invalid title!';
        } else if (!articleArgs.content) {
            errorMessage = 'Please enter article description.';
        }

        if (!req.user || !req.isAuthenticated()) {
            req.session.returnUrl = language + '/article/edit/' + id;

            res.redirect('/user/login');
            return;
        }

        Article.findById(id).then(article => {
            req.user.isInRole('Admin').then(isAdmin => {
                if(!isAdmin && !req.user.isAuthor(article)) {
                    res.redirect('/');
                    return;
                }

                if (errorMessage) {
                    res.render(language + '/article/edit', {error: errorMessage, layout: language + '/layout.hbs'})
                } else {
                    let picture = req.files.picture;

                    if (picture) {
                        let filename = picture.name;

                        picture.mv('./public/pictures/' + filename, err => {
                            if (err) {
                                console.log(err.message);
                            }
                        });

                        Article.update({_id: id}, {$set: {title: articleArgs.title, content: articleArgs.content, picturePath: '/pictures/' + filename}})
                            .then(updateStatus => {
                                res.redirect('/article/details/' + id);
                            })
                    } else {
                        Article.update({_id: id}, {$set: {title: articleArgs.title, content: articleArgs.content}})
                            .then(updateStatus => {
                                res.redirect('/article/details/' + id);
                            })
                    }
                }
            });
        });
    },

    delete: (req, res) => {
        let id = req.params.id;
        if (!req.session.language) {
            req.session.language = 'English';
        }
        let language = req.session.language;

        if (!req.user || !req.isAuthenticated()) {
            req.session.returnUrl = '/article/delete/' + id;

            res.redirect('/user/login');
            return;
        }

        Article.findById(id).then(article => {
            req.user.isInRole('Admin').then(isAdmin => {
                if(!isAdmin && !req.user.isAuthor(article)) {
                    res.redirect('/');
                    return;
                }

                if (req.session.UAK == 'kR0Efjbnru') {
                    res.render(language + '/article/delete', {UAK: true, article: article, layout: language + '/layout.hbs'})
                } else {
                    res.render(language + '/article/delete', {article: article, layout: language + '/layout.hbs'})
                }
            });
        });
    },

    confirmDelete: (req, res) => {
        let id = req.params.id;
        if (!req.session.language) {
            req.session.language = 'English';
        }
        let language = req.session.language;

        if (!req.user || !req.isAuthenticated()) {
            req.session.returnUrl = '/article/delete/' + id;

            res.redirect('/user/login');
            return;
        }

        Article.findById(id).then(article => {
            req.user.isInRole('Admin').then(isAdmin => {
                if(!isAdmin && !req.user.isAuthor(article)) {
                    res.redirect('/');
                    return;
                }
                Article.findOneAndRemove({_id: id}).populate('author').then(article => {
                    let author = article.author;
                    let index = author.articles.indexOf(article.id);

                    if (article.picturePath !== "/pictures/noPicture.jpg") {
                        fileSystem.unlink('./public' + article.picturePath, msg => {
                            console.log('Deleted - ' + article.picturePath)
                        });
                    }

                    if(index < 0) {
                        let errorMessage = 'Article was not found';
                        res.render(language + '/article/delete', {error: errorMessage, layout: '/layout.hbs'});
                    } else {
                        let count = 1;
                        author.articles.splice(index, count);
                        author.save().then((user) => {

                            res.redirect('/');
                        });
                    }
                })
            });
        });
    },

    myArticles: (req, res) => {
        if (!req.session.language) {
            req.session.language = 'English';
        }
        let language = req.session.language;

        if (!req.user) {
            res.redirect('/user/login');
            return
        }

        let UAK = false;
        if (req.session.UAK == 'kR0Efjbnru') {
            UAK = true;
        }

        let id = req.session.passport.user;

        Article.find({}).then(articles => {
            if (!articles) {
                res.redirect('/');
                return;
            }

            res.render(language + '/home/index', {
                UAK: UAK,
                layout: language + '/layout.hbs',
                articles: articles.filter(a => a.author == id)
            });
        });
    }
};