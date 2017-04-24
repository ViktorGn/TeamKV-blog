const mongoose = require('mongoose');

let articleSchema = mongoose.Schema({
    title: {type: String, required: true},
    content: {type: String, required: true},
    author: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    date: {type: Date, default: Date.now()},
    autonumber: {type:Number, default:0},
    picturePath:{type:String},
    viewCount: {type: Number, default:0},
    category: {type: String, default:"General"}
});

//Create Search index for title and content fields
articleSchema.index({title: 'text', content: 'text'});

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
