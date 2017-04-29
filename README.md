<h2>Project Description</h2>
<a href="https://docs.google.com/document/d/1T6FmUFfpttav-vMU-FJID-Ad2fJtqpKiKMxtIEgY-GY/edit?usp=sharing" target="_black">For details</a>

Web-based application e-Store


Practical Project for the Software Technologies Course @ SoftUni


The purpose of the project is to develop a simple Web-based application e-Store where the users can:
-	Browse content by categories
-	Create accounts, login and logout
-	Publish new content, upload pictures, view, edit and delete own articles
-	Send inquiries to the article authors by system generated e-mail with the question and link to the article in question
-	Select language – BG or EN and show views in the chosen language
-	Full text search
-	Article View count and unique Article ID
-	Roles – Admin and User
-	Admin panel – browsing users details, assign roles, delete user articles, delete users and their content

The project includes:
-	UX/UI design
-	Front-end and back end development
-	Documentation

This project is developed by a team of 2 members part of the “Software Technologies” course at SoftUni  - the Dream Team 

Architecture
The application is based on Model-View-Controller architecture.

Technology used is JavaScript + Express.js + MongoDB



Models and MongoDB Schema

Article
    title: {type: String, required: true},
    content: {type: String, required: true},
    author: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    date: {type: Date, default: Date.now()},
    autonumber: {type:Number, default:0},
    picturePath:{type:String},
    viewCount: {type: Number, default:0},
    category: {type: String, default:"General"}

Category
   categoryNumber: {type: String},
    bulgarian: {type: String},
    english: {type: String}

Role
    name: {type: String, required: true, unique: true},
    users:[{type: ObjectId, ref: 'User'}]

Users
    email: {type: String, required: true, unique: true},
    passwordHash: {type: String, required: true},
     fullName: {type: String, required: true},
     articles: [{ type: ObjectId, ref: 'Article' }],
     roles: [{ type: ObjectId, ref: 'Role' }],
     salt: {type: String, required: true},
    language: {type: String}

Middleware modules used
-	"body-parser": "~1.15.2",
-	"cookie-parser": "~1.4.3",
-	"debug": "~2.2.0",
-	"express": "~4.14.0",
-	"express-session": "^1.14.2",
-	"hbs": "~4.0.1",
-	"mongoose": "^4.6.6",
-	"nodemailer": "^4.0.1",
-	"passport": "^0.3.2",
-	"passport-local": "^1.0.0",
-	"serve-favicon": "~2.3.0",
-	"uuid": "~3.0.1"
