const mongoose = require('mongoose');
const Article = mongoose.model('Article');
const User = mongoose.model('User');
const Categories = mongoose.model('Categories');

module.exports = {
    index: (req, res) => {
        let category = req.body.Category;

        Article.find({}).populate('author').then(articles => {
            if (category) {
                articles = articles.filter(a => a.category == category);
            }

            if(req.user) {
                let id = req.session.passport.user;
                User.findOne({_id: id}).then(user => {

                    req.session.language = user.language;
                    let language = req.session.language;
                    req.user.isInRole('Admin').then(isAdmin => {
                        let UAK = false;

                        if (isAdmin) {
                            req.session.UAK = 'kR0Efjbnru'; // Unique Admin Key -> kR0Efjbnru
                            UAK = true;
                        } else {
                            delete req.session.UAK;
                        }

                        res.render(language + '/home/index', {
                            layout: language + '/layout',
                            articles: articles,
                            UAK: UAK,
                        });
                    });
                });
            } else {
                if (!req.session.language) {
                    req.session.language = 'English';
                }
                let language = req.session.language;

                res.render(language + '/home/index', {layout: language + '/layout', articles: articles});
            }
        })
    },

    fullTextSearch: (req, res) => {
        let searchText = req.body.SearchInput;

        if(searchText) {
            Article.find({$text: {$search: searchText}}).limit(18).populate('author').then(articles => {
                let language = req.session.language;

                if (req.session.UAK == 'kR0Efjbnru') {
                    res.render(language + '/home/index', {UAK: true, layout: language + '/layout', articles: articles});
                } else {
                    res.render(language + '/home/index', {layout: language + '/layout', articles: articles});
                }
            })
        } else {
            res.redirect('/');
        }
    },

    language: (req, res) => {
        let selectedLang = req.body.Language;

        if (req.session.passport) {
            let id = req.session.passport.user;

            User.update({_id: id}, {$set: {language: selectedLang}}).then(user => {
                res.redirect('/');
            });
        } else {
            req.session.language = selectedLang;
            res.redirect('/');
        }
    }
};