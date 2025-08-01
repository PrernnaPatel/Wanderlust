if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

const express =  require("express");
const app = express();
const mongoose =require("mongoose");
const path = require("path");
const methodoverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listings.js");
const reviewRouter = require("./routes/reviews.js");
const userRouter = require("./routes/user.js");

const dburl = process.env.ATLASDB_URL;

main().then(()=>{
    console.log("connected to db");
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(dburl);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodoverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
    mongoUrl:dburl,
    crypto: {
    secret: process.env.SECRET,
  },
  touchAfter:24 * 3600,
});

store.on("error",()=>{
    console.log("ERROR in MONGO SESSION STORE",err);
});

const sessionOptions = {
    store,
    secret : process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires: Date.now() + 7 * 24 * 60* 60* 1000,
        maxAge : 7 * 24 * 60* 60* 1000,
        httpOnly : true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    console.log("Current user:", req.user);
    res.locals.currUser=req.user || null;
    next();
});

app.get("/",(req,res)=>{
  res.render("listings/home")
});


app.use("/listings",listingRouter);

app.use("/",userRouter);
app.use("/listings/:id/reviews",reviewRouter);

// app.all("*", (req, res, next) => {
//     next(new ExpressError(404, "Page Not Found"));
// });

// app.use((err, req, res, next) => {
//     let { statusCode = 500, message = "Something went wrong" } = err;
//     res.status(statusCode).send(message);
// });


app.use((err,req,res,next)=>{
    let {statusCode=404,message="something wrong"}=err;
    res.status(statusCode).render("error", { message });
});

app.listen(8080,()=>{
    console.log("server is listening 8080");
});