const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const User = mongoose.model("User")
const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { JWT_SECRET } = require("../config/keys")
const requireLogin = require("../middleware/requireLogin")
const nodemailer = require("nodemailer")
const sendgridTransport = require("nodemailer-sendgrid-transport")
const { SENDGRID_API, EMAIL } = require("../config/keys")
//

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: SENDGRID_API,
    },
  })
)

router.post("/register", (req, res) => {
  const { name, email, password } = req.body
  if (!email || !password || !name) {
    return res.status(422).json({ error: "All field is required!" })
  }
  User.findOne({ email: email })
    .then((savedUser) => {
      if (savedUser) {
        return res
          .status(422)
          .json({ error: "Please use a different email. Thank you." })
      }
      bcrypt.hash(password, 12).then((hashedpassword) => {
        const user = new User({
          email,
          password: hashedpassword,
          name,
        })

        user
          .save()
          .then((user) => {
            // transporter.sendMail({
            //     to:user.email,
            //     from:"no-reply@memeverse.com",
            //     subject:"Thank you for joining MemeVerse",
            //     html:"<h1>welcome to MemeVerse</h1>"
            // })
            res.json({ message: "Saved Successfully" })
          })
          .catch((err) => {
            console.log(err)
          })
      })
    })
    .catch((err) => {
      console.log(err)
    })
})

router.post("/login", (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(422).json({ error: "Email & Password is required." })
  }
  User.findOne({ email: email }).then((savedUser) => {
    if (!savedUser) {
      return res.status(422).json({ error: "Invalid Email or Password" })
    }
    bcrypt
      .compare(password, savedUser.password)
      .then((doMatch) => {
        if (doMatch) {
          // res.json({message:"successfully signed in"})
          const token = jwt.sign({ _id: savedUser._id }, JWT_SECRET)
          const { _id, name, email } = savedUser
          res.json({
            token,
            user: { _id, name, email },
          })
        } else {
          return res.status(422).json({ error: "Invalid Email or Password" })
        }
      })
      .catch((err) => {
        console.log(err)
      })
  })
})

router.post("/reset-password", (req, res) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err)
    }
    const token = buffer.toString("hex")
    User.findOne({ email: req.body.email }).then((user) => {
      if (!user) {
        return res
          .status(422)
          .json({ error: "User not found. Please try again." })
      }
      user.resetToken = token
      user.expireToken = Date.now() + 3600000
      user.save().then((result) => {
        transporter.sendMail({
          to: user.email,
          from: "no-replay@memeverse.com",
          subject: "Password Reset Link",
          html: `
                     <p>You requested for a password reset</p>
                     <h5>Click <a href="${EMAIL}/here/${token}">link</a> to reset your password</h5>
                     `,
        })
        res.json({ message: "Check your email" })
      })
    })
  })
})

router.post("/new-password", (req, res) => {
  const newPassword = req.body.password
  const sentToken = req.body.token
  User.findOne({ resetToken: sentToken, expireToken: { $gt: Date.now() } })
    .then((user) => {
      if (!user) {
        return res.status(422).json({ error: "Try again session expired" })
      }
      bcrypt.hash(newPassword, 12).then((hashedpassword) => {
        user.password = hashedpassword
        user.resetToken = undefined
        user.expireToken = undefined
        user.save().then((saveduser) => {
          res.json({ message: "Password updated successfully" })
        })
      })
    })
    .catch((err) => {
      console.log(err)
    })
})

module.exports = router
