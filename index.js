import express from 'express'
import {fileURLToPath} from 'url'
import {dirname} from 'path'
import {join} from 'path'
import pg from 'pg'
import bodyParser from 'body-parser'
import  bcrypt from 'bcrypt'
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import dotenv from 'dotenv';



dotenv.config();
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express();
const Port = process.env.PORT;
const saltRound = 8
app.set('view engine', 'ejs')
app.set('views', join(__dirname, 'views'))



app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(join(__dirname, 'public')));
app.use('/textillate/assets', express.static(__dirname + '/path/to/textillate/assets', { type: 'text/css' }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000*3600*48
    }
})
);

app.use(passport.initialize());
app.use(passport.session());



const db = new pg.Client({
    connectionString:process.env.EXT_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // This will allow self-signed certificates (not recommended for production)
      }
});
db.connect()
    .then(() => {
        console.log('Connected to the database');

    })




async function generateRandomPassWord() {
    const randomNum = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(randomNum, saltRound)
    return console.log(hashedPassword)}




const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;
const date = now.getDate();
const time =`${date}-${month}-${year}`





app.get("/", (req, res) => {
    const Authenticated =  req.isAuthenticated()
    res.render("index", { Authenticated });
})

app.get("/About",  (req, res) => {
    const Authenticated =  req.isAuthenticated()
    res.render("about", { Authenticated });
})

app.get("/Login",  (req, res) => {
    const Authenticated =  req.isAuthenticated()
    res.render("login", {Authenticated} )
})

app.get("/creat-post",  (req, res) => {
    const Authenticated =  req.isAuthenticated()
    res.render("post", { Authenticated });
})

app.get("/SignUp",  (req, res)=>{
    const Authenticated =  req.isAuthenticated()
    res.render("signup", { Authenticated});
})

app.get("/blog-library",  async (req, res)=> {
    console.log(req.user);
    let contents = []
    if (req.isAuthenticated()) {
        const currentUser = req.user
        if (currentUser === 1 ){
            const blogPen = await db.query("SELECT * FROM plog");
            contents = blogPen.rows;
        } else {
            // Other users can see blog posts visible to everyone
            const blogPen = await db.query("SELECT * FROM plog WHERE user_id = 1");
            contents = blogPen.rows;
        }
        const Authenticated = req.isAuthenticated();
        res.render("index-blog", { contents, currentUser, Authenticated });

    }else {
        res.redirect("login")
    }
})

app.get(
    "/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account",
        accessType: "offline"

    })
)

app.get("/auth/google/blog-library", passport.authenticate("google",{
    successRedirect: "/blog-library",
    failureRedirect: "/login"

}))


app.get("/blog/:id",   async (req, res)=> {
    const userIdString = req.params.id.trim();

    if (!/^\d+$/.test(userIdString)) {
        return res.status(400).send('Invalid user ID');
    }
    const userId = parseInt(userIdString, 10);
    if (isNaN(userId)) {
        return res.status(400).send('Invalid user ID');
    }

    try {
        const result = await db.query('SELECT * FROM plog WHERE id = $1', [userId]);
        const content = result.rows[0];

        if (!content) {
            return res.status(404).send('Blog post not found');
        }
        const Authenticated = req.isAuthenticated
        res.render('blog', { content, Authenticated });
    } catch (err) {
        console.error('Error fetching blog post:', err);
        res.status(500).send('Internal Server Error');
    }
});


// register route post request
app.post("/register",  async  (req, res) =>{
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const email = req.body.email;
    const password = req.body.password;
    console.log(firstname, lastname, email, password)
    try {
        const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
            email,
        ]);
        if (checkResult.rows.length > 0) {
            res.redirect("/login")
        } else {
                 bcrypt.hash(password, saltRound, async (err, hash) => {
                if (err) {
                    console.error("error hashing password, try again", err)
                } else {
                    console.log("hashing password successful", hash)
                    const result = await db.query(
                        "INSERT INTO users (firstname, lastname, email, password) VALUES ($1, $2, $3, $4) RETURNING *",
                        [firstname, lastname, email, hash]);
                    const user = result.rows[0];
                    req.login(user, (err) => {
                        console.log(err)
                        res.redirect("/blog-library")
                    })

                }
            })
        }
    }catch (err) {
        console.log(err);
    }
});

// login route post request.

app.post('/login',
    passport.authenticate('local', {
        successRedirect: '/blog-library',
        failureRedirect: '/login',
        failureFlash: true
    }))



passport.use( 'local', new Strategy(
    { usernameField: 'email', passwordField: 'password', passReqToCallback: true },
    async (req, email, password, done) => {
        try {
            const Result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
            if (Result.rows.length > 0) {
                const user = Result.rows[0];
                console.log(user.id)
                const storedHashPassword = user.password;

                bcrypt.compare(password, storedHashPassword, (err, isMatch) => {
                    if (err) {
                        return done(err);
                    } else {
                        if (isMatch) {
                            return done(null, user);
                        } else {
                            return done(null, false);
                        }
                    }
                });
            } else {
                req.res.redirect("/SignUp");
            }
        } catch (err) {
            return done(err);
        }
    }
));



passport.use('google', new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.SECRETKEY,
    callbackURL: "http://localhost:3000/auth/google/blog-library",
}, async (accessToken, refreshToken, profile, cb) => {
    try{
        const result = await db.query("SELECT * FROM users WHERE email = $1", [profile.email])
        if (result.rows.length === 0) {
            const newUser = await db.query("INSERT INTO users (email, password, firstname, lastName) VALUES ($1, $2, $3, $4)",
                [profile.email, generateRandomPassWord(), profile.name.givenName, profile.name.familyName])
            return cb(null, newUser.rows[0]);
        } else{
                return cb(null, result.rows[0])
            }


    }catch(err){
        return  cb(err);
    }}
))


app.post("/create-post", async (req, res) => {
    const image = req.body.image;
    const Author = req.body.author;
    const tittle = req.body.tittle;
    const subTittle = req.body.subTittle;
    const content = req.body.largeText;

    const currentUser = req.user.id
    console.log(image, Author, currentUser, content)


    try {

        const result = await db.query("INSERT INTO plog (author, user_id, tittle, subtittle, imageurl, content, createdat) VALUES ($1,$2,$3,$4,$5,$6, $7)  RETURNING *",
            [Author, currentUser, tittle, subTittle, image, content, time])
        console.log(result);

        if (result) {
            res.redirect("/blog-library")
        }else{
            console.log("no info right here bro")
        }
    } catch (err) {
        // Log the error for better debugging
        console.error("Error inserting data into plog:", err);
        throw err;
    }
})

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error("Error during logout:", err);
            return next(err);
        }
        res.redirect('/');
    });
});
passport.serializeUser((user, cb) =>{
    cb(null, user);
});

passport.deserializeUser((user, cb)=>{
    cb(null, user);
});

app.listen(Port, () => {
    console.log(`Sever is running on port ${Port}`)
})