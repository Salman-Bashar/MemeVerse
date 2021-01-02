const express = require("express")
const app = express()
const mongoose = require("mongoose")
const PORT = process.env.PORT || 5000
const { DB } = require("./config/keys")

mongoose.connect(DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
mongoose.connection.on("conn", () => {
  console.log("Connected to Database...")
})
mongoose.connection.on("error", (err) => {
  console.log("Error in Database connection!", err)
})

require("./models/meme")

app.use(express.json())
app.use(require("./routes/auth"))
app.use(require("./routes/meme"))

if (process.env.NODE_ENV == "production") {
  app.use(express.static("client/build"))
  const path = require("path")
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
  })
}

app.listen(PORT, () => {
  console.log("Server is running on ", PORT)
})
