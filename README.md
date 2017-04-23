# TeamKV-blog
article\create.hbs<br />
&lt;input class="form-control" id="image" type="file" name="picture"&gt;

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
Default user name changed to "v@m", pwd:"123":<br />
   &lt;input type="email" id="inputEmail" placeholder="E-mail" name="email" value="v@e"&gt; {{! //remove value="v@e" }}<br />
   &lt;input type="password" id="inputPassword" placeholder="Password" name="password" value="123"&gt; {{! //remove value="123" }}
