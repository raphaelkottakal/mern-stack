const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const router = express.Router();

const Profile = require('../../models/Profile');
const User = require('../../models/User');

const validateProfileInput = require('../../validataion/profile');
const validateExperienceInput = require('../../validataion/experience');
const validateEducationInput = require('../../validataion/education');

router.get('/test', (req, res) => {
  res.json({ message: 'Hello profile!' });
});

router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const errors = {};
  
  Profile.findOne({ user: req.user.id })
    .populate('user', ['name', 'avatar'])
    .then( profile => {
      if(!profile) {
        errors.noprofile = 'There is no profile for this user'
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch( err => res.status(404).json(err) );
});

router.get('/all', (req, res) => {
  const errors = {};
  Profile.find()
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
      if (!profiles) {
        errors.noprofiles = 'There are no profiles';
        return res.status(404).json(errors);
      }
      res.json(profiles);
    })
    .catch(err => res.status(404).json(err));
});

router.get('/handle/:handle', (req, res) => {
  const errors = {};
  Profile.findOne({ handle: req.params.handle })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

router.get('/user/:userid', (req, res) => {
  const errors = {};
  Profile.findOne({ user: req.params.userid })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {

  const { errors, isValid } = validateProfileInput(req.body);

  if(!isValid) {
    return res.status(400).json(errors);
  }
  const profileFields = {};
  profileFields.user = req.user.id;
  if(req.body.handle) profileFields.handle = req.body.handle;
  if(req.body.company) profileFields.company = req.body.company;
  if(req.body.website) profileFields.website = req.body.website;
  if(req.body.location) profileFields.location = req.body.location;
  if(req.body.bio) profileFields.bio = req.body.bio;
  if(req.body.status) profileFields.status = req.body.status;
  if(req.body.githubusername) profileFields.githubusername = req.body.githubusername;

  if(typeof req.body.skills !== 'undefined') {
    profileFields.skills = req.body.skills.split(',');
  };

  profileFields.social = {};
  if(req.body.youtube) profileFields.social.youtube = req.body.youtube;
  if(req.body.twitter) profileFields.social.twitter = req.body.twitter;
  if(req.body.facebook) profileFields.social.facebook = req.body.facebook;
  if(req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
  if(req.body.instagram) profileFields.social.instagram = req.body.instagram;

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      if (profile) {
        Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true })
          .then(profile => res.json(profile));
      } else {
        Profile.findOne({ handle: profileFields.handle })
          .then(profile => {
            if(profile) {
              errors.handle = 'That handle already existes'
              return res.status(400).json(errors);
            }
            new Profile(profileFields).save().then(profile => res.json(profile));
          })
      }
    })

});

router.post('/experience', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateExperienceInput(req.body);
  if(!isValid) {
    return res.status(400).json(errors);
  }
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      const { title, company, location, from, to, current, description } = req.body;
      const newExp = { title, company, location, from, to, current, description };
      profile.experience.unshift(newExp);
      profile.save().then(profile => res.json(profile));
    })
});

router.post('/education', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateEducationInput(req.body);
  if(!isValid) {
    return res.status(400).json(errors);
  }
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      const { school, degree, fieldofstudy, from, to, current, description  } = req.body;
      const newEdu = { school, degree, fieldofstudy, from, to, current, description };
      profile.education.unshift(newEdu);
      profile.save().then(profile => res.json(profile));
    })
});

router.delete('/experience/:experienceid', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      const removeIndex = profile.experience
        .map(item => item.id)
        .indexOf(req.params.experienceid);

      profile.experience.splice(removeIndex, 1);
      profile.save().then(profile => res.json(profile));
    })
    .catch(err => res.status(404).json(err));
});

router.delete('/education/:educationid', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      console.log(profile);
      console.log(req.params.educationid);
      const removeIndex = profile.education
        .map(item => item.id)
        .indexOf(req.params.educationid);
      console.log(removeIndex)
      if (removeIndex < 0) {
        return res.status(404).json({ delete: 'Id does not exist'})
      }
      profile.education.splice(removeIndex, 1);
      profile.save().then(profile => res.json(profile));
    })
    .catch(err => res.status(404).json(err));
});

router.delete('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      User.findOneAndRemove({ _id: req.user.id })
      .then(() => res.json({ success: true }));
    })
    .catch(err => res.status(404).json(err));
});

module.exports = router;
