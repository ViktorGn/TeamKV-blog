const User = require('mongoose').model('User');
const Role = require('mongoose').model('Role');
const Article = require('mongoose').model('Article');
const encryption = require('./../utilities/encryption');
const nodemailer = require('nodemailer');
const fileSystem = require('fs');

module.exports = {
    registerGet: (req, res) => {
        if (!req.session.language) {
            req.session.language = 'English';
        }
        let language = req.session.language;

        res.render(language + '/user/register',  {layout: language + '/join.hbs'});
    },

    registerPost:(req, res) => {
        let registerArgs = req.body;

        User.findOne({email: registerArgs.email}).then(user => {
            let errorMsg = '';
            let passwordLength = registerArgs.password.length;

            if (passwordLength < 6) {
                errorMsg = 'Password too short';
            }

            if (user) {
                errorMsg = 'The email address you have entered is already registered.';
            } else if (registerArgs.password !== registerArgs.repeatedPassword) {
                errorMsg = 'Passwords do not match!'
            }

            if (!req.session.language) {
                req.session.language = 'English';
            }
            let language = req.session.language;

            if (errorMsg) {
                registerArgs.error = errorMsg;
                res.render(language + '/user/register', {error: errorMsg, layout: language + '/join.hbs'})
            } else {
                let salt = encryption.generateSalt();
                let passwordHash = encryption.hashPassword(registerArgs.password, salt);
                let roles = [];


                Role.findOne({name: 'User'}).then(role => {
                    roles.push(role.id);

                    let userObject = {
                        email: registerArgs.email,
                        passwordHash: passwordHash,
                        fullName: registerArgs.fullName,
                        salt: salt,
                        roles: roles,
                        language: language
                    };

                    User.create(userObject).then(user => {
                        role.users.push(user.id);
                        role.save(err => {
                           if (err) {
                               console.log(err)
                           }
                        });

                        let englishTemplate =
                            '<div style="font-size: 18px"><p>Welcome <b>' + user.fullName +
                            '</b>!</p><p><br />We are very happy to see you!</p><p>Stay cool and keep browsing!</p><br /><p>Have a wonderful day!</p><p><a href="http://localhost:3000">Dream Store</a></p><br /></div>' +
                            '<br /><p>For contacts: dreamstoreweb@gmail.com</p>';
                        let bulgarianTemplate =
                            '<div style="font-size: 18px"><p>Добре дошъл <b>' + user.fullName +
                            '</b>!</p><p><br />Добре дошъл в нашия магазин!</p><p>Дано намериш всичко желано.</p><br /><p>Приятен ден!</p><p><a href="http://localhost:3000">Dream Store</a></p><br /></div>' +
                            '<br /><p>За контакти: dreamstoreweb@gmail.com</p>';
                        let messageTemplate = englishTemplate;

                        if (language == 'Bulgarian') {
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
                            to: user.email, //authorEmail, // list of receivers
                            subject:  'Dream Store', // Subject line
                            html: messageTemplate
                        };

                        transporter.sendMail(mailOptions, function(error, info){
                            if(error){
                                console.log(error);
                            }else{
                                console.log('Message sent !' + info.response);
                            }
                        });

                        req.logIn(user, (err) => {
                            res.redirect('/');
                        })
                    })
                });
            }
        })
    },

    loginGet: (req, res) => {
        if (!req.session.language) {
            req.session.language = 'English';
        }
        let language = req.session.language;

        res.render(language + '/user/login', {layout: language + '/join.hbs'});
    },

    loginPost: (req, res) => {
        let loginArgs = req.body;

        User.findOne({email: loginArgs.email}).then(user => {
            if (!user || !user.authenticate(loginArgs.password)) {
                let errorMsg = 'Either username or password was invalid!';
                loginArgs.error = errorMsg;
                res.render('English/user/login', {error: errorMsg, layout: 'English/join.hbs'});
                return;
            }

            if (!req.session.language) {
                req.session.language = 'English';
            }
            let language = req.session.language;

            req.logIn(user, (err) => {
                if (err) {
                    res.render(language + '/user/login', {error: err.message, layout: language + '/join.hbs'});
                    return;
                }

                let returnUrl = '/';
                if(req.session.returnUrl) {
                    returnUrl = req.session.returnUrl;

                    delete req.session.returnUrl;
                }

                let id = req.session.passport.user;

                User.findOne({_id: id}).then(user => {
                    req.session.language = user.language;
                    res.redirect(returnUrl);
                });
            })
        })
    },

    logout: (req, res) => {
        delete req.session.UAK;
        delete req.session.passport;
        req.logOut();
        res.redirect('/');
    },

    addAdminsGet: (req, res) => {
        if(!req.user) {
            res.status(404).send('Not found');
            return;
        }

        if (!req.session.language) {
            req.session.language = 'English';
        }
        let language = req.session.language;

        req.user.isInRole('Admin').then(isAdmin => {
            if (!isAdmin) {
                res.status(404).send('Not found');
                return;
            }
            let UAK = false;

            if (isAdmin) {
                req.session.UAK = 'kR0Efjbnru'; // Unique Admin Key -> kR0Efjbnru
                UAK = true;
            } else {
                delete req.session.UAK;
            }

            Role.find({}).then(roles => {
                let roleAdmin = roles.find(r => r.name === 'Admin');
                let roleUser = roles.find(r => r.name === 'User');

                User.find({}).then(users => {
                    for (user of users) {
                        if (user.roles.find(r => r == roleAdmin.id)) {
                            user.displayRole = 'Admin';
                        } else if (user.roles.find(r => r == roleUser.id)) {
                            user.displayRole = 'User';
                        }
                    }
                    User.findOne({_id: req.session.passport.user}).then(currentUser => {

                        res.render(language + '/user/panel', {layout: language + '/layout.hbs', allUser: users, user: currentUser, UAK: UAK})
                    });
                });
            });

        });
    },

    addAdminsPost: (req, res) => {
        if(!req.user) {
            res.status(404).send('Not found');
            return;
        }

        req.user.isInRole('Admin').then(isAdmin => {
            if (!isAdmin) {
                res.status(404).send('Not found');
                return;
            }

            let makeAdmin = req.body.makeAdmin;
            let removeAdmin = req.body.removeAdmin;
            let deleteUser = req.body.delete;
            let id = makeAdmin || removeAdmin || deleteUser;

            Role.find({}).then(roles => {
                let roleAdmin = roles.find(r => r.name === 'Admin');
                let roleUser = roles.find(r => r.name === 'User');

                User.findOne({_id: id}).then(user => {
                    let focusUserAdmin = user.roles.find(r => r == roleAdmin.id);

                    if (makeAdmin && !focusUserAdmin) {
                        user.roles = [];
                        user.roles.push(roleAdmin.id);
                        user.save(err => {
                            if (err) {
                                console.log(err);
                            }
                        });

                        let index = roleUser.users.indexOf(id);
                        roleUser.users.splice(index, 1);
                        roleUser.save(err => {
                            if (err) {
                                console.log(err);
                            }
                        });

                        roleAdmin.users.push(id);
                        roleAdmin.save(err => {
                            if (err) {
                                console.log(err);
                            }
                        });
                    } else if (removeAdmin && focusUserAdmin) {
                        user.roles = [];
                        user.roles.push(roleUser.id);
                        user.save(err => {
                            if (err) {
                                console.log(err);
                            }
                        });

                        let index = roleAdmin.users.indexOf(id);
                        roleAdmin.users.splice(index, 1);
                        roleAdmin.save(err => {
                            if (err) {
                                console.log(err);
                            }
                        });

                        roleUser.users.push(id);
                        roleUser.save(err => {
                            if (err) {
                                console.log(err);
                            }
                        });
                    } else if (deleteUser && !focusUserAdmin) {
                        User.findOneAndRemove({_id: id}).then(removedUser => {
                            if (removedUser.articles) {
                                for (article of removedUser.articles) {
                                    Article.findOneAndRemove({_id: article}).then(article => {
                                        if (article.picturePath !== "/pictures/noPicture.jpg") {
                                            fileSystem.unlink('./public' + article.picturePath, msg => {
                                                console.log('Deleted - ' + article.picturePath)
                                            });
                                        }
                                    });
                                }
                            }
                        });

                        let index = roleUser.users.indexOf(id);
                        roleUser.users.splice(index, 1);
                        roleUser.save(err => {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }
                    res.redirect('/admin/panel')
                });
            });
        });
    }
};
