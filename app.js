const express = require("express");
const pool = require("./db_config").pool;
const bcrypt = require("bcrypt");
const flash = require("express-flash");
const session = require("express-session");
const app = express();

// TODO catch de successful login msg
// video minutes 101

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(
  session({ secret: "keyboard cat", resave: false, saveUninitialized: false })
);
app.use(flash());

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/users/register", (req, res) => {
  res.render("register");
});

app.get("/users/login", (req, res) => {
  res.render("login");
});

app.get("/users/dashboard", (req, res) => {
  res.render("dashboard", { user: "Simon" });
});

app.post("/users/register", async (req, res) => {
  let { firstname, lastname, username, email, password, password2 } = req.body;

  let errors = [];

  if (!firstname || !lastname || !username || !email || !password || !password2)
    errors.push({ message: "All fields are required." });

  if (password.length < 6) {
    errors.push({ message: "Password must be at least 6 characters." });
  }

  if (password !== password2) {
    errors.push({ message: "Passwords do not match." });
  }

  if (errors.length > 0) {
    res.render("register", { errors });
  } else {
    let hashedpassword = await bcrypt.hash(password, 10);

    // Checking if email already exists
    pool.query(`SELECT * FROM users WHERE email='${email}'`, (err, result) => {
      if (err) throw err;

      if (result.rows.length > 0) {
        errors.push({ message: "Email already in use." });
        res.render("register", { errors });
      } else {
        // Inserting
        pool.query(
          `INSERT INTO users (firstname, lastname, username, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING id, password`,
          [firstname, lastname, username, email, hashedpassword],
          (err, result) => {
            if (err) throw err;

            console.log(result.rows);
            req.flash("success_msg", "You have successfully registered!");

            res.redirect("/users/login");
          }
        );
      }
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
