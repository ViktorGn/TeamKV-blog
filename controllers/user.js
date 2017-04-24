const User = require('mongoose').model('User');
const Role = require('mongoose').model('Role');
const encryption = require('./../utilities/encryption');

module.exports = {
    registerGet: (req, res) => {
        res.render('user/register',  {layout: 'join.hbs'});
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

            if (errorMsg) {
                registerArgs.error = errorMsg;
                res.render('user/register', {error: errorMsg, layout: 'join.hbs'})
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
                        roles: roles
                    };

                    User.create(userObject).then(user => {
                        role.users.push(user.id);
                        role.save(err => {
                           if (err) {

                           }  else {
                               req.logIn(user, (err) => {
                                   if (err) {
                                       registerArgs.error = err.message;
                                       res.render('user/register', {error: err.message, layout: 'join.hbs'});
                                       return;
                                   }
                                   res.redirect('/');
                               })
                           }
                        });
                    })
                });
            }
        })
    },

    loginGet: (req, res) => {
        res.render('user/login', {layout: 'join.hbs'});
    },

    loginPost: (req, res) => {
        let loginArgs = req.body;
        User.findOne({email: loginArgs.email}).then(user => {
            if (!user || !user.authenticate(loginArgs.password)) {
                let errorMsg = 'Either username or password was invalid!';
                loginArgs.error = errorMsg;
                res.render('user/login', {error: errorMsg, layout: 'join.hbs'});
                return;
            }

            req.logIn(user, (err) => {
                if (err) {
                    res.render('/user/login', {error: err.message, layout: 'join.hbs'});
                    return;
                }

                let returnUrl = '/';
                if(req.session.returnUrl) {
                    returnUrl = req.session.returnUrl;

                    delete req.session.returnUrl;
                }

                res.redirect(returnUrl);
            })
        })
    },

    logout: (req, res) => {
        req.logOut();
        res.redirect('/');
    }
};
