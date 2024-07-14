const mongoose = require('mongoose');
require('dotenv').config({ path: 'D:/NODE EXPRESS/Express/config.env' });
const app = require('./app.js');

const DB = process.env.DATABASE;

mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true 
})
  .then(() => {
    console.log("DB connection successful!");
  })
  .catch(() => {
    console.log("Connection Error");
  });

// 4) SERVER START
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log("UNHANDLED REJECTION ! Shutting Down...");
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException',err=>{
  console.log("UNCAUGHT ERROR ! Shutting Down...");
  console.log(err.name,err.message);
  server.close(() => {
    process.exit(1);
  });
})