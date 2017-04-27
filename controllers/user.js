const User = require('mongoose').model('User');
const Role = require('mongoose').model('Role');
const encryption = require('./../utilities/encryption');
const nodemailer = require('nodemailer');

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

                           }  else {
                               req.logIn(user, (err) => {
                                   if (err) {
                                       registerArgs.error = err.message;
                                       res.render(language + '/user/register', {error: err.message, layout: language + '/join.hbs'});
                                   }
                               })
                           }
                        });

                        let englishTemplate =
                            '<div style="font-size: 18px"><p>Welcome <b>' + user.fullName +
                            '</b>!</p><p><br />We are very happy to see you!</p><p>Stay cool and keep browsing!</p><br /><p>Have a wonderful day!</p><p><a href="http://localhost:3000">Dream Store</a></p><br /></div>';
                        let bulgarianTemplate =
                            '<div style="font-size: 18px"><p>Добре дошъл <b>' + user.fullName +
                            '</b>!</p><p><br />Добре дошъл в нашия магазин!</p><p>Дано намериш всичко желано.</p><br /><p>Приятен ден!</p><p><a href="http://localhost:3000">Dream Store</a></p><br /></div>';
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

                        res.redirect('/');
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
    }
};
