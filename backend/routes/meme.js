const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const requireLogin = require("../middleware/requireLogin")
const Meme = mongoose.model("Meme")

router.get("/memes", requireLogin, (req, res) => {
  Post.find()
    .populate("postedBy", "_id name")
    .populate("comments.postedBy", "_id name")
    .sort("-createdAt")
    .then((posts) => {
      res.json({ posts })
    })
    .catch((err) => {
      console.log(err)
    })
})

router.post("/creatememe", requireLogin, (req, res) => {
  const { title, pic } = req.body
  if (!title || !pic) {
    return res.status(422).json({ error: "Plase add all the fields" })
  }
  req.user.password = undefined
  const meme = new Meme({
    title,
    photo: pic,
    postedBy: req.user,
  })
  meme
    .save()
    .then((result) => {
      res.json({ meme: result })
    })
    .catch((err) => {
      console.log(err)
    })
})

router.get("/mypost", requireLogin, (req, res) => {
  Meme.find({ postedBy: req.user._id })
    .populate("PostedBy", "_id name")
    .then((mymeme) => {
      res.json({ mymeme })
    })
    .catch((err) => {
      console.log(err)
    })
})

router.put("/like", requireLogin, (req, res) => {
  Meme.findByIdAndUpdate(
    req.body.postId,
    {
      $push: { likes: req.user._id },
    },
    {
      new: true,
    }
  ).exec((err, result) => {
    if (err) {
      return res.status(422).json({ error: err })
    } else {
      res.json(result)
    }
  })
})
router.put("/unlike", requireLogin, (req, res) => {
  Meme.findByIdAndUpdate(
    req.body.postId,
    {
      $pull: { likes: req.user._id },
    },
    {
      new: true,
    }
  ).exec((err, result) => {
    if (err) {
      return res.status(422).json({ error: err })
    } else {
      res.json(result)
    }
  })
})

router.put("/comment", requireLogin, (req, res) => {
  const comment = {
    text: req.body.text,
    postedBy: req.user._id,
  }
  Meme.findByIdAndUpdate(
    req.body.postId,
    {
      $push: { comments: comment },
    },
    {
      new: true,
    }
  )
    .populate("comments.postedBy", "_id name")
    .populate("postedBy", "_id name")
    .exec((err, result) => {
      if (err) {
        return res.status(422).json({ error: err })
      } else {
        res.json(result)
      }
    })
})

router.delete("/deletepost/:postId", requireLogin, (req, res) => {
  Meme.findOne({ _id: req.params.postId })
    .populate("postedBy", "_id")
    .exec((err, meme) => {
      if (err || !meme) {
        return res.status(422).json({ error: err })
      }
      if (meme.postedBy._id.toString() === req.user._id.toString()) {
        post
          .remove()
          .then((result) => {
            res.json(result)
          })
          .catch((err) => {
            console.log(err)
          })
      }
    })
})

module.exports = router
