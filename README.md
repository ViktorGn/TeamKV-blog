# TeamKV-blog
article\create.hbs
<input class="form-control" id="image" type="file" name="picture">

models\Article.js
picturePath:{type:String},

controllers\article.js
    createPost: (req, res) => {
        let articleArgs = req.body;
        let picture = req.files.picture;

express.js - new middleware https://www.npmjs.com/package/express-fileupload
    app.use(fileUpload());

Other changes:
Added folder "Test pictures" with demo pictures and texts
Default user name changed to "v@m", pwd:"123":
   <input type="email" id="inputEmail" placeholder="E-mail" name="email" value="v@e"> {{! //remove value="v@e" }}
   <input type="password" id="inputPassword" placeholder="Password" name="password" value="123"> {{! //remove value="123" }}
