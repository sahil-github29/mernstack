const express = require("express");
const mongoose = require("mongoose");

const users = require("./routes/api/users");
const profile = require("./routes/api/profile");
const posts = require("./routes/api/posts");

const app = express();

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

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Use Routes
app.use("api/users", users);
app.use("api/profile", profile);
app.use("api/posts", posts);

app.listen(5000, () => {
  console.log("App listening on port 5000!");
});
