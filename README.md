# TeamKV-blog
article\create.hbs
<code>
<input class="form-control" id="image" type="file" name="picture">
</code>

models\Article.js <br />
picturePath:{type:String},

controllers\article.js<br />
    createPost: (req, res) => {<br />
        let articleArgs = req.body;<br />
        let picture = req.files.picture;

express.js - new middleware https://www.npmjs.com/package/express-fileupload<br />
    app.use(fileUpload());

Other changes:
Added folder "Test pictures" with demo pictures and texts<br />
Default user name changed to "v@m", pwd:"123":
<code>
   <input type="email" id="inputEmail" placeholder="E-mail" name="email" value="v@e"> {{! //remove value="v@e" }}
   <input type="password" id="inputPassword" placeholder="Password" name="password" value="123"> {{! //remove value="123" }}
</code>
