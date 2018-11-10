const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const validatePostInput = require('../../validataion/post');

const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Hello posts!' });
});

router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {

  const {errors, isValid } = validatePostInput(req.body);

  if(!isValid) {
    return res.status(400).json(errors);
  }

  const newPost = new Post({
    text: req.body.text,
    user: req.body.name,
    avatar: req.body.avatar,
    user: req.user.id
  });

  newPost.save().then(post => res.json(post));
});

router.get('/', (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({error: 'No posts found with that id'}));
});

router.get('/:id', (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err => res.status(404).json({error: 'No post found with that id'}));
});

router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if(post.id.toString() !== req.params.id) {
            return res.status(401).json({ noauth: 'You are not autherized to delete this post' });
          }

          post.remove()
          .then(() => res.json({ success: true }));
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found'}));
    })
});

router.post('/like/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
          const removeIndex = post.likes.map(item => item.user.toString()).indexOf(req.user.id);
          post.likes.splice(removeIndex, 1);
          return post.save().then(post => res.json(post));
        }
          
          post.likes.unshift({ user: req.user.id });
          post.save().then(post => res.json(post));

        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found'}));
    })
});

router.post('/comment/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  const {errors, isValid } = validatePostInput(req.body);

  if(!isValid) {
    return res.status(400).json(errors);
  }
  Post.findById(req.params.id)
    .then(post => {
      const newComment = {
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id
      };

      post.comments.unshift(newComment);
      post.save().then(post => res.json(post));
    });
});

router.delete('/comment/:id/:commentId', passport.authenticate('jwt', { session: false }), (req, res) => {
  Post.findById(req.params.id)
    .then(post => {

      if(post.comments.filter(comment => comment._id.toString() === req.params.commentId).length === 0) {
        return res.status(404).json({error: 'Comment does not exist'});
      }
      const removeIndex = post.comments
        .map(item => item.user.toString())
        .indexOf(req.user.id);
      post.comments.splice(removeIndex, 1);
      post.save().then(post => res.json(post));
    });
});

module.exports = router;
