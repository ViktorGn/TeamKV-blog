const Article = require('mongoose').model('Article');
const PersistentStore = require('mongoose').model('PersistentStore');
const fileSystem = require('fs');

module.exports = {
    createGet: (req, res) => {
        if(!req.isAuthenticated()) {
            errorMsg = 'You should be logged in to make articles!';
            res.render('user/login', {error: errorMsg, layout: 'join.hbs'});
            return;
        }
        res.render('article/create');
    },

    createPost: (req, res) => {
        let articleArgs = req.body;
        let picture = req.files.picture;
        if (picture) {
            let filename = picture.name;

            articleArgs.picturePath = '/pictures/' + filename;
                picture.mv('./public/pictures/' + filename, err => {
                if (err) {
                    console.log(err.message);
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
            res.render('article/create', {error: errorMsg});
            return;
        }

        articleArgs.author = req.user.id;
 //       console.log(PersistentStore.articleAutoCount);

        Article.create(articleArgs).then(article => {
            req.user.articles.push(article.id);
            req.user.save(err => {
                if (err) {
                    res.redirect('/', {error: err.message});
                } else {
                    res.redirect('/');
                }
            })
        })
    },

    details: (req, res) => {
        let id = req.params.id;

        Article.findById(id).populate('author').then(article => {
            let viewCount = article.viewCount + 1;

            Article.update({_id: id}, {$set: {viewCount: viewCount}}).then(updateStatus => {
                res.render('article/details', article);
            });
        })
    },

    editGet: (req, res) => {
      let id = req.params.id;

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

              res.render('article/edit', article)
          });
      });
    },

    editPost: (req, res) => {
        let id = req.params.id;
        let articleArgs = req.body;
        let errorMessage = '';

        if (!articleArgs.title) {
            errorMessage = 'Invalid title!';
        } else if (!articleArgs.content) {
            errorMessage = 'Please enter article description.';
        }

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

                if (errorMessage) {
                    res.render('article/edit', {error: errorMessage})
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

                res.render('article/delete', article)
            });
        });
    },

    confirmDelete: (req, res) => {
        let id = req.params.id;

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
                        res.render('article/delete', {error: errorMessage});
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
    }
};