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
  // ssl: {
  //   rejectUnauthorized: true,
  // },
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Sign In
app.use("/login", async (req, res) => {
  const { username, password } = req.body;

  // validate password
  const validatePassword = (password) => {
    if (password.length < 6) {
      return "Password must be at least 7 character long";
    } else if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    } else if (!/[A-Z]/.test(password)) {
      return "Password must contain al least one uppercase letter";
    } else if (!/\d/.test(password)) {
      return "Password must contain at least one number";
    } else if (!/[!@#$%^&*]/.test(password)) {
      return "Password must contain at least one special character";
    } else {
      // if password is valid return nothing
      return password;
    }
  };
  const validatedPassword = validatePassword(password);

  try {
    const user = await pool.query(
      `SELECT user_id, firstname, lastname, password FROM accounts WHERE username = $1`,
      [username]
    );

    if (user.rows.length === 0) {
      res.status(401).json({ error: "Invalid username" });
      return;
    }
    const storedHash = user.rows[0].password;
    const passwordMatch = await bcrypt.compare(validatedPassword, storedHash);

    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid password" });
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

//Sign Up
app.use("/signup", async (req, res) => {
  const { firstname, lastname, username, password, email } = req.body;

  const validatePassword = (password) => {
    if (password.length < 6) {
      return "Password must be at least 7 character long";
    } else if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    } else if (!/[A-Z]/.test(password)) {
      return "Password must contain al least one uppercase letter";
    } else if (!/\d/.test(password)) {
      return "Password must contain at least one number";
    } else if (!/[!@#$%^&*]/.test(password)) {
      return "Password must contain at least one special character";
    } else {
      // if password is valid return nothing
      return password;
    }
  };
  const validatedPassword = validatePassword(password);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(validatedPassword, salt);

  try {
    const user = await pool.query(
      `insert into accounts (firstname, lastname,username,password,email) values ($1,$2,$3,$4,$5)`,
      [firstname, lastname, username, hashedPassword, email]
    );

    if (user.rowCount > 0) {
      res.status(200).json({ message: "You sign up successfully" });
    } else {
      res.status(500).json({ message: "Try again registration failed" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

app.get("/words", async (req, res) => {
  try {
    const allWords = await pool.query("select * from year3and4words");

    res.status(200).json(allWords.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

app.post("/session-Record", async (req, res) => {
  const {
    userId,
    correctSpeltWords,
    wrongSpeltWords,
    countedCorrectWords,
    countedWrongWords,
    session_accuracy_percentage,
  } = req.body;

  console.log(req.body);
  try {
    // write the insert query
    const sessionRecord = await pool.query(
      `insert into sessions (user_id,correctWordsList,wrongWordsList,number_of_correct_words,number_of_incorrect_words,session_accuracy_percentage) values ($1,$2,$3,$4,$5,$6)`,
      [
        userId,
        correctSpeltWords,
        wrongSpeltWords,
        countedCorrectWords,
        countedWrongWords,
        session_accuracy_percentage,
      ]
    );

    sessionRecord.rowCount > 0
      ? res.status(200).json({ message: "Session recorded successfully" })
      : res.status(500).json({ message: "Session Not recorded" });
  } catch (error) {
    console.error(error);
  }
});

app.get("/sessions_data", async (req, res) => {
  try {
    const getData = await pool.query(`select * from sessions`);
    const sessionsData = getData.rows;
    res.status(200).json(sessionsData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
});

app.get("/overall_progress_data/:userId", async (req, res) => {
  const userId = +req.params.userId;
  console.log(userId);

  const userOverallProgressRecord = await pool.query(
    `select session_id, session_accuracy_percentage from sessions where user_id = $1`,
    [userId]
  );

  userOverallProgressRecord.rowCount > 0
    ? res.status(200).send(userOverallProgressRecord.rows)
    : res.status(500).json({ message: "record not found" });
  try {
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});
app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
