const mongoose = require('mongoose');

let PersistentStoreSchema = mongoose.Schema({
    articleAutoCount: {type: Number, default:1},
    categories:{type:[String]},
    conf_id:{type: Number, default:1}
});

var PersistentStore = mongoose.model('PersistentStore', PersistentStoreSchema);
//var seedRec = new PersistentStore({
//articleAutoCount: 1,
//categories: ["General"]
//});
//seedRec.save();
//console.log("Persistent")
module.exports = PersistentStore;