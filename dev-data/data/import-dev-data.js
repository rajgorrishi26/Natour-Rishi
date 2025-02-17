const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

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

//   Read JSON File 
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`,'utf-8'));
const reivews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`,'utf-8'));

// Import Data Into DB 
const importdata = async ()=>{
    try {
        await Tour.create(tours);
        await User.create(users,{validateBeforeSave:false});
        await Review.create(reivews);
        console.log("data successfully Added!!");
    } catch (error) {
        console.log(error);
    }
    process.exit();
}

const DeleteData = async ()=>{
   try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log("data Deleted Successfully !!");
  
   } catch (error) {
    console.log(error);
   }
   process.exit();
}

if (process.argv[2]==='--import') {
    importdata();
} else if(process.argv[2]=='--delete'){
    DeleteData();
}


