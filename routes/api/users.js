const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const validateRegisterInput = require('../../validataion/register');
const validateLoginInput = require('../../validataion/login');

const User = require('../../models/User');
const keys = require('../../config/keys');

const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Hello users!' });
});

router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  User.findOne({ email: req.body.email })
    .then(user => {
      if (user) {
        res.status(400).json({ email: 'Email already exists' });
      } else {
        const avatar = gravatar.url(req.body.email, {
          s: 200,
          r: 'pg',
          d: 'mm'
        });
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          avatar,
          password: req.body.password
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser.save()
              .then(user => res.json(user))
              .catch((err) => console.log(err));
          });
        });
      }
    })
    .catch();
});

router.post('/login', (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const { email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        errors.email = 'User not found';
        return res.status(404).json(errors);
      }
      const { id, name, avatar } = user;
      bcrypt.compare(password, user.password)
        .then((isMatch) => {
          if(isMatch) {
            const paylode = {
              id,
              name,
              avatar
            }
            jwt.sign(
              paylode,
              keys.secret,
              { expiresIn: '1d' },
              (err, token) => {
                res.json({
                  success: true,
                  token: 'Bearer ' + token
                })
              }
            );
          } else {
          errors.password = 'Password incorrect';
          res.status(400).json(errors);
          };
        })
    });
});

router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { id, email, avatar } = req.user;
  res.json({ id, email, avatar });
});

module.exports = router;
