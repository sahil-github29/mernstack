const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// Loading Models
const Post = require("../../models/Post");
const User = require("../../models/User");
const Profile = require("../../models/Profile");

// Loading validaton
const validatePostInput = require("../../validation/post");

/* 
 @Route:     GET api/posts 
 @Desc:      Get posts 
 @Access:    Public 
 */
router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(400).json({ nopostfound: "No posts found" }));
});

/* 
 @Route:     GET api/posts/:id
 @Desc:      Get posts by id 
 @Access:    Public 
 */
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err =>
      res.status(400).json({ nopostfound: "No post found with that Id" })
    );
});

/* 
 @Route:     POST api/posts 
 @Desc:      Create post
 @Access:    Private 
 */
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // vaidation
    const { isValid, errors } = validatePostInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });

    // Saving post
    newPost
      .save()
      .then(post => res.json(post))
      .catch(err => res.status(400).json(err));
  }
);

/* 
 @Route:     DELETE api/posts/:id
 @Desc:      Delete post by id
 @Access:    Private 
 */
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // we want to make sure that the user that deleting this post is the owner of the post
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        if (!profile) {
          return res
            .status(400)
            .json({ profile: "There is no profile for this user id" });
        }
        Post.findById(req.params.id).then(post => {
          if (!post) {
            return res
              .status(400)
              .json({ post: "Post with this Id does not exist!" });
          }
          // check for post owner
          /* user as ObjectId coming from DB is not a string, but user id coming from passport is a           string so we used "toString()" method */
          if (post.user.toString() !== req.user.id) {
            return res
              .status(400)
              .json({ notauthorised: "User not authorized!" });
          }
          post.remove().then(() => res.json({ Success: true }));
        });
      })
      .catch(err => res.status(400).json(err));
  }
);

/* 
 @Route:     POST api/posts/like/:id
 @Desc:      Like post
 @Access:    Private 
 */
router.post(
  "/like/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // we want to make sure that the user that deleting this post is the owner of the post
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        if (!profile) {
          return res
            .status(400)
            .json({ profile: "There is no profile for this user id" });
        }
        Post.findById(req.params.id).then(post => {
          if (!post) {
            return res
              .status(400)
              .json({ post: "Post with this Id does not exist!" });
          }
          // if user already like this post
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyliked: "User already liked this post" });
          }

          // Add user id to likes array
          post.likes.unshift({ user: req.user.id });

          // saving post
          post.save().then(post => res.json(post));
        });
      })
      .catch(err => res.status(400).json(err));
  }
);

/* 
 @Route:     POST api/posts/unlike/:id
 @Desc:      Unlike post
 @Access:    Private 
 */
router.post(
  "/unlike/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // we want to make sure that the user that deleting this post is the owner of the post
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        if (!profile) {
          return res
            .status(400)
            .json({ profile: "There is no profile for this user id" });
        }
        Post.findById(req.params.id)
          .then(post => {
            if (!post) {
              return res
                .status(400)
                .json({ post: "Post with this Id does not exist!" });
            }
            // if user did not like this post ealiar
            if (
              post.likes.filter(like => like.user.toString() === req.user.id)
                .length === 0
            ) {
              return res
                .status(400)
                .json({ alreadyliked: "You have not yet liked this post" });
            }

            // Get remove like index
            const removeIndex = post.likes
              .map(item => item.user.toString())
              .indexOf(req.user.id);

            // Removing like
            post.likes.splice(removeIndex, 1);

            // saving post
            post.save().then(post => res.json(post));
          })
          .catch(err => res.status(400).json(err));
      })
      .catch(err => res.status(400).json(err));
  }
);

/* 
 @Route:     POST api/posts/comment/:id
 @Desc:      Add comment to post
 @Access:    Private 
 */
router.post(
  "/comment/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // vaidation
    const { isValid, errors } = validatePostInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }

    Post.findById(req.params.id).then(post => {
      if (!post) {
        return res
          .status(400)
          .json({ post: "Post with this Id does not exist!" });
      }
      const newComment = {
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id
      };

      // Add to comments array
      post.comments.unshift(newComment);

      // Saving post
      post
        .save()
        .then(post => res.json(post))
        .catch(err => res.status(400).json(err));
    });
  }
);

/* 
 @Route:     DELETE api/posts/comment/:id
 @Desc:      Delete comment from post
 @Access:    Private 
 */
router.delete(
  "/comment/:id/:comment_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.id).then(post => {
      if (!post) {
        return res
          .status(400)
          .json({ post: "Post with this Id does not exist!" });
      }
      // check to see if comment exists
      if (
        post.comments.filter(comment => comment.user.toString() === req.user.id)
          .length === 0
      ) {
        return res
          .status(400)
          .json({ commentnotexist: "Comment does not exist" });
      }

      // Get remove like index
      const removeIndex = post.comments
        .map(item => item._id.toString())
        .indexOf(req.params.comment_id);

      // Removing like
      post.comments.splice(removeIndex, 1);

      // Saving post
      post
        .save()
        .then(post => res.json(post))
        .catch(err => res.status(400).json(err));
    });
  }
);

module.exports = router;
