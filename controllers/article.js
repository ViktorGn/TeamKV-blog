const Article = require('mongoose').model('Article');
const User = require('mongoose').model('User');
const Categories = require('mongoose').model('Categories');
//const PersistentStore = require('mongoose').model('PersistentStore');
const fileSystem = require('fs');
var uuid = require('uuid');

//Mail
//run command
// npm install nodemailer --savein
// from/in the directory ...\TeamKV-blog
const nodemailer = require('nodemailer');

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
            let filename =  uuid.v4() + '.' + pictureFilenameExt; /* instead of picture.name */
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

        if  (!req.session.language) {
            req.session.language = 'English';
        }

        let language = req.session.language;

        if (req.session.UAK == 'kR0Efjbnru') {
            UAK = true;
        }

        if (!req.session.language) {
            req.session.language = 'English';
        }

        Article.findById(id).populate('author').then(article => {
            let viewCount = article.viewCount + 1;
            let articleCategory = article.category;

            Categories.findOne({english: articleCategory}).then(category => {
                let currentCategory = category.english;

                if (req.session.language == 'Bulgarian') {
                    currentCategory = category.bulgarian;
                }

                if (!req.user) {
                    res.render(language + '/article/details', {
                        article: article,
                        category: currentCategory,
                        isUserAuthorized: false,
                        layout: language + '/layout.hbs'
                    });
                } else {
                    req.user.isInRole('Admin').then(isAdmin => {
                        let isUserAuthorized = isAdmin || req.user.isAuthor(article);
                        let isAuthor = req.user.isAuthor(article);

                        Article.update({_id: id}, {$set: {viewCount: viewCount}}).then(updateStatus => {
                            res.render(language + '/article/details', {
                                UAK: UAK,
                                article: article,
                                category: currentCategory,
                                isUserAuthorized: isUserAuthorized,
                                isAuthor: isAuthor,
                                layout: language + '/layout.hbs'
                            });
                        });
                    });
                }
            });
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
                if (!isAdmin && !req.user.isAuthor(article)) {
                    res.redirect('/');
                    return;
                }
                Categories.findOne({english: article.category}).then(category => {
                    let currentCategory = category.english;

                    if (req.session.language == 'Bulgarian') {
                        currentCategory = category.bulgarian;
                    }

                    let UAK = false;

                    if (req.session.UAK == 'kR0Efjbnru') {
                        UAK = true;
                    }

                    res.render(language + '/article/edit', {
                        UAK: UAK,
                        article: article,
                        layout: language + '/layout.hbs'
                    })
                });
            });
        })
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

                Categories.findOne({english: article.category}).then(category => {
                    let currentCategory = category.english;

                    if (req.session.language == 'Bulgarian') {
                        currentCategory = category.bulgarian;
                    }

                    let UAK = false;

                    if (req.session.UAK == 'kR0Efjbnru') {
                        UAK = true;
                    }

                    res.render(language + '/article/delete', {UAK: UAK, article: article,category: currentCategory, layout: language + '/layout.hbs'})
                });
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
    },

    messageGet: (req, res) => {
        let id = req.params.id;

        Article.findById({_id: id}).then(article => {
            let UAK = false;

            if (req.session.UAK == 'kR0Efjbnru') {
                UAK = true;
            }

            if (!req.session.language) {
                req.session.language = 'English';
            }
            let language = req.session.language;

            res.render(language + '/article/message', {
                UAK: UAK,
                article: article,
                layout: language + '/layout.hbs'
            })
        });
    },

    messagePost: (req, res) => {
        let message = req.body.messageContent;
        let returnEmail = req.body.returnEmail;
        let id = req.params.id;
        let currentDate = new Date().toDateString();

        Article.findById({_id: id}).then(article => {
            let authorId = article.author;
            let title = 'RE:' + article.title;

            User.findById({_id: authorId}).then(author => {
                let authorEmail = author.email;
                let englishTemplate =
                    '<div style="font-size: 18px"><p>Hello <b>' + author.fullName +
                    '</b>, you have a new message:</p></p><p><br />' + message +
                    '<br /><br /><p>from: '+ returnEmail +
                    '<p>Article link: <a href="' + req.headers.origin + '/article/details/' + article.id + '">here.</a></p>' +
                    '</p></p><br /><p>Have a wonderful day!</p><p><a href="http://localhost:3000">Dream Store</a></p><br />' + currentDate +
                    '</div>';
                let bulgarianTemplate =
                    '<div style="font-size: 18px"><p>Привет <b>' + author.fullName +
                    '</b>, имаш ново съобщение:</p></p><p><br />' + message +
                    '<br /><br /><p>от: '+ returnEmail +
                    '<p>Линк към обявата: <a href="' + req.headers.origin + '/article/details/' + article.id + '">тук.</a></p>' +
                    '</p></p><br /><p>Приятен ден</p><p><a href="http://localhost:3000">Dream Store</a></p><br />' + currentDate +
                    '</div>';
                let messageTemplate = englishTemplate;

                if (author.language == 'Bulgarian') {
                    messageTemplate = bulgarianTemplate;
                }

                //Enable IMAP in Gmail //https://support.google.com/a/answer/105694?hl=en
                // Enable less secure app access ! https://myaccount.google.com/lesssecureapps
                // Creating a transport object
                let transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'dreamstoreweb@gmail.com', // Your email id XXXX
                        pass: 'blogblog' // Your password YYYY
                    }
                });

                //Create a simple JSON object with the necessary values for send­ing the email.
                // https://nodemailer.com/message/
                let mailOptions = {
                    to: authorEmail, //authorEmail, // list of receivers
                    subject:  title, // Subject line
                    html: messageTemplate
                };

                transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        console.log(error);
                    }else{
                        console.log('Message sent !' + info.response);
                    }
                });

                res.redirect('/');
            });
        });
    }
};