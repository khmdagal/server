require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 8080;

const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.use("/login", async (req, res) => {
//     const { username, password } = req.body;

//     const salt = await bcrypt.genSalt(10);

//     await bcrypt.hash(password, salt);

//     console.log("===>", username, password);

//   try {
//     const user = await pool.query(
//       `select firstname,lastname from accounts where username = $1 and password= $2`,
//       [username, password]
//     );
//     res.status(200).json(user.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send(err);
//   }
// });

app.get('/',(req, res)=> {
  res.status(200).json('Hello world')
})

app.use("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await pool.query(
      `SELECT user_id, firstname, lastname, password FROM accounts WHERE username = $1`,
      [username]
    );

    if (user.rows.length === 0) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }
    const storedHash = user.rows[0].password;
    const passwordMatch = await bcrypt.compare(password, storedHash);

    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    } else {
      const token = jwt.sign(
        {
          id: user.rows[0].user_id,
          firstname: user.rows[0].firstname,
          lastname: user.rows[0].lastname,
        },
        process.env["jwtPrivateKey"] // env is objec [xxx] you are accessing the key of the object
      );
      console.log("===>", token, passwordMatch);
      res.status(200).json({
        // JWT
        token,
        user: {
          id: user.rows[0].user_id,
          firstname: user.rows[0].firstname,
          lastname: user.rows[0].lastname,
        },
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

app.get("/words", async (req, res) => {
  try {
    const allWords = await pool.query("select * from year3and4");
    res.status(200).json(allWords.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

app.listen(PORT, () =>
  console.log("API is running on http://localhost:8080/login")
);
