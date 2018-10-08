const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");

// Load Input validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

// Load the User Model
const User = require("../../models/User");

router.get("/test", (req, res) => {
  res.json({ msg: "Users Work" });
});

/* 
  @route    POST api/users/register
  @desc     Register User
  @access   Public
*/
router.post("/register", (req, res) => {
  // vaidation
  const { isValid, errors } = validateRegisterInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email })
    .then(user => {
      if (user) {
        return res.status(400).json({ email: "Email Already Exists!" });
      } else {
        const avatar = gravatar.url(req.body.email, {
          s: "200", // size of the picture
          r: "pg", // rating
          d: "mm" // Default
        });

        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          avatar,
          password: req.body.password
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) {
              throw err;
            } else {
              newUser.password = hash;
              newUser
                .save()
                .then(user => res.json(user))
                .catch(err => console.log(err));
            }
          });
        });
      }
    })
    .catch(err => {
      console.log(err);
    });
});

/* 
  @route    POST api/users/login
  @desc     Login User / Returning JWT Token
  @access   Public
*/
router.post("/login", (req, res) => {
  // vaidation
  const { isValid, errors } = validateLoginInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  // Find user by email
  User.findOne({ email }).then(user => {
    //Check for user
    if (!user) {
      errors.email = "User not found";
      return res.status(400).json(errors);
    } else {
      //check password
      bcrypt.compare(password, user.password).then(isMatch => {
        if (isMatch) {
          // Creating JWT payload
          const payload = { id: user.id, name: user.name, avatar: user.avatar };

          // Sign Token == Creating Token
          jwt.sign(
            payload,
            keys.secretKey,
            { expiresIn: 3600 },
            (err, token) => {
              res.json({
                success: true,
                token: "Bearer " + token
              });
            }
          );
        } else {
          errors.password = "Incorrect Password!";
          return res.status(400).json(errors);
        }
      });
    }
  });
});

/* 
  @route    GET api/users/current
  @desc     Returning current user
  @access   Private
*/
router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({
      name: req.user.name,
      email: req.user.email,
      id: req.user.id
    });
  }
);
module.exports = router;
