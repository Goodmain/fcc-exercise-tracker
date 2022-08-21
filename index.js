const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let User = mongoose.model('User', new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
}));

let Exercise = mongoose.model('Exercise', new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  date: Date
}));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: 'false' }));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app
  .route('/api/users')
  .get((req, res) => {
    User.find({}, (err, data) => res.json(data))
  })
  .post((req, res) => {
    const user = new User({
      username: req.body.username
    });

    user.save((err, data) => {
      if (err) {
        res.json({ error: err.message });
      } else {
        res.json({
          _id: data._id,
          username: data.username
        });
      }
    });
  });

app.post('/api/users/:id/exercises', (req, res) => {
  User.findById({
    _id: req.params.id
  }, (err, user) => {
    if (err) {
      res.json({ error: err.message });
    } else {
      const exercise = new Exercise({
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date,
        username: user.username
      });

      exercise.save((err, data) => {
        if (err) {
          res.json({ error: err.message });
        } else {
          res.json({
            _id: user._id,
            description: data.description,
            duration: data.duration,
            username: data.username,
            date: new Date(req.body.date).toDateString()
          });
        }
      });
    }
  });
});

app.get('/api/users/:id/logs', (req, res) => {//[from][&to][&limit]
  User.findById({
    _id: req.params.id
  }, (err, user) => {
    if (err) {
      res.json({ error: err.message });
    } else {
      let filter = { username: user.username };

      if (req.query.from || req.query.from) {
        filter = { ...filter, date: {} }

        if (req.query.from) {
          filter = { ...filter, date: { ...filter.date, $gte: new Date(req.query.from) }}
        }
        
        if (req.query.to) {
          filter = { ...filter, date: { ...filter.date, $lte: new Date(req.query.to) }}
        }
      }

      Exercise.find(filter)
      .limit(req.query?.limit)
      .exec((err, exercises) => {
        if (err) {
          res.json({ error: err.message });
        } else {
          res.json({
            _id: user._id,
            username: user.username,
            count: exercises.length,
            log: exercises.map((item) => {
              return {
                description: item.description, 
                duration: item.duration,
                date: new Date(item.date).toDateString()
              };
            })
          });
        }
      });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
