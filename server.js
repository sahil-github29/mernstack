const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");

// Routes
const users = require("./routes/api/users");
const profile = require("./routes/api/profile");
const posts = require("./routes/api/posts");

const app = express();

//Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Use Routes
app.use("/api/users", users);
app.use("/api/profile", profile);
app.use("/api/posts", posts);

// DB Config
const db = require("./config/keys").mongoURI;

//Connet to MongoDB
mongoose
  .connect(
    db,
    { useNewUrlParser: true }
  )
  .then(() => console.log("MongoDb Connected"))
  .catch(err => console.log(err));

const port = process.env.PORT || 5000;

// Passport middleware
app.use(passport.initialize());

// Passport config
require("./config/passport")(passport);

app.listen(5000, () => {
  console.log("App listening on port 5000!");
});
