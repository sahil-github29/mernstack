const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

//Loading Models
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// Loading Validation
const validateProfileInput = require("../../validation/profile");
const validateExperienceInput = require("../../validation/experience");
const validateEducationInput = require("../../validation/education");

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
 @Route:     GET api/profile/handle/:handle 
 @Desc:      Get profile by handle 
 @Access:    Public 
 */
router.get("/handle/:handle", (req, res) => {
  const errors = {};
  Profile.findOne({ handle: req.params.handle })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There is no profile for this user";
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

/* 
 @Route:     GET api/profile/user/:user_id 
 @Desc:      Get profile by user_id 
 @Access:    Public 
 */
router.get("/user/:user_id", (req, res) => {
  const errors = {};
  Profile.findOne({ user: req.params.user_id })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There is no profile for this user";
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    // if the Id is not valid, it wil throw this error
    // "Cast to ObjectId failed for value \"5bbc58868abf180516a208685\"
    // so we sending customize error
    .catch(err =>
      res.status(404).json({ Profile: "There is no profile for this user Id" })
    );
});

/* 
 @Route:     GET api/profile/user/:user_id 
 @Desc:      Get profile by user_id 
 @Access:    Public 
 */
router.get("/all", (req, res) => {
  const errors = {};
  Profile.find()
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There are no profiles";
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json({ Profile: "There are no profiles" }));
});

/* 
 @Route:     POST api/profile 
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

/* 
 @Route:     POST api/profile/experience 
 @Desc:      Add experience to profile 
 @Access:    Private 
 */
router.post(
  "/experience",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Validation
    const { errors, isValid } = validateExperienceInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id })
      .then(profile => {
        if (!profile) {
          return res.status(400).json({
            Error: "User does not have a profile to add experience"
          });
        }
        const newExp = {
          title: req.body.title,
          company: req.body.company,
          location: req.body.location,
          from: req.body.from,
          to: req.body.to,
          current: req.body.current,
          description: req.body.description
        };

        // Add experience to array
        profile.experience.unshift(newExp);

        // Save to DB
        profile
          .save()
          .then(profile => res.json(profile))
          .catch(err => res.status(400).json(err));
      })
      .catch(err => res.status(400).json(err));
  }
);

/* 
 @Route:     POST api/profile/education 
 @Desc:      Add education to profile 
 @Access:    Private 
 */
router.post(
  "/education",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Validation
    const { errors, isValid } = validateEducationInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id })
      .then(profile => {
        const newEdu = {
          school: req.body.school,
          degree: req.body.degree,
          fieldofstudy: req.body.fieldofstudy,
          from: req.body.from,
          to: req.body.to,
          current: req.body.current,
          description: req.body.description
        };

        // Add experience to array
        profile.education.unshift(newEdu);

        // Save to DB
        profile
          .save()
          .then(profile => res.json(profile))
          .catch(err => res.status(400).json(err));
      })
      .catch(err => res.status(400).json(err));
  }
);

/* 
 @Route:     DELETE api/profile/experience/:exp_id 
 @Desc:      Delete experience from profile
 @Access:    Private 
 */
router.delete(
  "/experience/:exp_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        // Get remove index
        const removeIndex = profile.experience
          .map(item => item._id)
          .indexOf(req.params.exp_id);

        // Removing experience from array
        profile.experience.splice(removeIndex, 1);

        // Save to DB
        profile
          .save()
          .then(profile => res.json(profile))
          .catch(err => res.status(400).json(err));
      })
      .catch(err => res.status(400).json(err));
  }
);

/* 
 @Route:     DELETE api/profile/education/:edu_id 
 @Desc:      Delete education from profile
 @Access:    Private 
 */
router.delete(
  "/education/:edu_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        // Get remove index
        const removeIndex = profile.education
          .map(item => item._id)
          .indexOf(req.params.exp_id);

        // Removing education from array
        profile.education.splice(removeIndex, 1);

        // Save to DB
        profile
          .save()
          .then(profile => res.json(profile))
          .catch(err => res.status(400).json(err));
      })
      .catch(err => res.status(400).json(err));
  }
);

/* 
 @Route:     DELETE api/profile/
 @Desc:      Delete user and profile
 @Access:    Private 
 */
router.delete(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOneAndRemove({ user: req.user.id })
      .then(() => {
        User.findOneAndRemove({ _id: req.user.id }).then(() =>
          res.json({ success: true })
        );
      })
      .catch(err => res.status(400).res.json(err));
  }
);

module.exports = router;
