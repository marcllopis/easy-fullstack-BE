require('dotenv').config();

const express = require('express')
const connection = require('./conf');
const app = express();
const port = process.env.PORT || 5000
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const cors = require('cors')

//global middlewares
app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.use(cors())

// DB connection
connection.connect(err => {
  if(err) {
    console.error(`DB connection failed because of Error: ${err}`)
    return;
  }
  console.log('Successfully connected to your DB!')
})



// Register a user part
app.post('/register', (req, res) => {
  bcrypt
    .hash(req.body.password, 10)
    .then(hashedPassword => {
      let user = {
        username: req.body.username,
        password: hashedPassword,
        description: req.body.description,
        age: req.body.age,
        city: req.body.city
      }
      connection.query('INSERT INTO user SET ?', user, (err) => {
        if(err){
          res.status(500).send('Error registering the user')
        } else {
          res.status(201).send('Success on registering the new user')
        }
      })
    })
    .catch(hashError => console.error(`Error with encoding your password. Error: ${hashError}`))
})

// Login part
app.post('/login', (req, res) => {
  const user = {
    username: req.body.username,
    password: req.body.password
  }
  connection.query('SELECT * FROM user WHERE username=?', user.username, (err, results) => {
    if(err) {
      res.status(500).send('Username not found')
    } else {
      bcrypt
        .compare(user.password, results[0].password)
        .then((isAMatch) => {
          if(isAMatch) {
            // there was a match with password so user should be logged in
            // assign a JWT to that user so he/she will use it on every request
            const generatedToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
            // send the token to the FE
            res.json({token: generatedToken, loggedIn: true})
          } else {
            // no match, password incorrect
            res.send('Incorrect password')
          }
        })
    }
  })
})

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if(token === undefined) return res.sendStatus(401)

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if(err) return res.sendStatus(403)
    req.foundUser = user
    next();
  })
}


app.get('/profile', authenticateToken, (req, res) => {
  connection.query('SELECT username, description, age, city FROM user WHERE username=?', req.foundUser.username, (err, results) => {
    if(err) res.sendStatus(500)
    res.json(results[0])
  })
})


app.listen(port, (err) => {
  if(err) throw new Error(`Server is not working as expected, ups! Error: ${err}`);
  console.log(`Server is working really good at port: ${port}`)
})