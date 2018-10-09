const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

//Loading Models
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// Loading Validation
const validateProfileInput = require("../../validation/profile");

router.get("/test", (req, res) => {});

/* 
 @Route:     GET api/profile/current 
 @Desc:      Get current user profile 
 @Access:    Private 
 */
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    Profile.findOne({ user: req.user.id })
      .populate("user", ["name", "avatar"])
      .then(profile => {
        if (!profile) {
          errors.noprofile = "There is no profile for this user";
          return res.status(404).json(errors);
        }
        res.json(profile);
      })
      .catch(err => res.status(404).json(err));
  }
);

/* 
 @Route:     GET api/profile 
 @Desc:      Create / Edit user profile 
 @Access:    Private 
 */
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Validation
    const { errors, isValid } = validateProfileInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }

    // Get fields
    const profileFields = {};
    // converting object id string to => mongoose objectId
    profileFields.user = req.user.id;
    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.status) profileFields.status = req.body.status;
    if (req.body.githubusername)
      profileFields.githubusername = req.body.githubusername;

    // Skills - split into array. The value will be comma separated
    if (typeof req.body.skills !== "undefined") {
      profileFields.skills = req.body.skills.split(",");
    }

    // Social - to save undefined error, we initialize social object
    profileFields.social = {};
    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;

    //res.json({ objectId: profileFields.user });
    userId = profileFields.user;
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        if (profile) {
          // Update Profile
          Profile.findOneAndUpdate(
            { user: req.user.id },
            { $set: profileFields }
          )
            .then(profile => res.json(profile))
            .catch(err => res.status(400).json(err));
        } else {
          // Create Profile
          //Check if handle exists -- we are checking handle for SEO search purpose
          Profile.findOne({ handle: profileFields.handle })
            .then(profile => {
              if (profile) {
                errors.handle = "That handle already exists";
                return res.status(400).json(errors);
              }

              // Save Profile
              new Profile(profileFields)
                .save()
                .then(profile => res.json(profile))
                .catch(err => res.json(err));
            })
            .catch(err => res.status(400).json(err));
        }
      })
      .catch(err => res.status(400).json(err));
  }
);

module.exports = router;
