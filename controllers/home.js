const mongoose = require('mongoose');
const Article = mongoose.model('Article');
const User = mongoose.model('User');

module.exports = {
    index: (req, res) => {
      Article.find({}).limit(18).populate('author').then(articles => {

          if(req.user) {
              let id = req.session.passport.user;

              User.findOne({_id: id}).then(user => {

                  req.session.language = user.language;
                  let language = req.session.language;

                  req.user.isInRole('Admin').then(isAdmin => {

                      if (isAdmin) {
                          req.session.UAK = 'kR0Efjbnru'; // Unique Admin Key -> kR0Efjbnru
                          res.render(language + '/home/index', {layout: language + '/layout' ,articles: articles, UAK: true, isAdmin: isAdmin});
                      } else {
                          delete req.session.UAK;
                          res.render(language + '/home/index', {layout: language + '/layout' ,articles: articles})
                      }
                  });
              });
          } else {
              req.session.language = 'English';
              res.render('English/home/index', {layout: 'English/layout' ,articles: articles})
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
        }
    },

    language: (req, res) => {
        let language = req.body.Language;

        if (req.session.passport.user) {
            let id = req.session.passport.user;

            User.update({_id: id}, {$set: {language: language}}).then(user => {
                res.redirect('/');
            });
        } else {
            req.session.language = language;
            res.redirect('/');
        }
    }
};