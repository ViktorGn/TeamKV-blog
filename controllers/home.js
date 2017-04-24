const mongoose = require('mongoose');
const Article = mongoose.model('Article');

module.exports = {
  index: (req, res) => {
      Article.find({}).limit(6).populate('author').then(articles => {
          res.render('home/index',{articles: articles});
      })
  },
  fullTextSearch: (req, res) => {
      let searchText = req.body.SearchInput;
      Article.find({$text : { $search : searchText}}).limit(6).populate('author').then(articles => {
          res.render('home/index', {articles: articles});
      })
  }
};