const mongoose = require('mongoose');
const Role = require('mongoose').model('Role');
const ObjectId = mongoose.Schema.Types.ObjectId;
const encryption = require('./../utilities/encryption');

let userSchema = mongoose.Schema( {
        email: {type: String, required: true, unique: true},
        passwordHash: {type: String, required: true},
        fullName: {type: String, required: true},
        articles: [{ type: ObjectId, ref: 'Article' }],
        roles: [{ type: ObjectId, ref: 'Role' }],
        salt: {type: String, required: true},
        language: {type: String}
    }
);

userSchema.method ({
    authenticate: function (password) {
        let inputPasswordHash = encryption.hashPassword(password, this.salt);
        let isSamePasswordHash = inputPasswordHash === this.passwordHash;

        return isSamePasswordHash;
    },

    isAuthor: function (article) {
        if (!article || !article.author) {
            return false;
        }

        let id = article.author.id;

        if (Buffer.isBuffer(article.author.id)) {
            id = article.author;
        }

        return this.id == id;
    },

    isInRole: function (roleName) {
        return Role.findOne({name: roleName}).then(role => {
            if (!role) {
                return false;
            }

            let isInRole = this.roles.indexOf(role.id) !== -1;
            return isInRole;
        })
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;