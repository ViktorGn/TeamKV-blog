const Article = require('mongoose').model('Article');
const PersistentStore = require('mongoose').model('PersistentStore');
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
            articleArgs.picturePath = './public/pictures/'+filename;
                picture.mv('./public/pictures/'+filename, err => {
                if (err) {
                    console.log(err.message);
                }
            });
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
            res.render('article/details', article);
        })
    },
};