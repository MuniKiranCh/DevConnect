const express=require('express')
const connectDB=require('./config/database')
const app=express();
const User=require("./models/user");

app.post('/signup',async (req,res)=>{
    const user=new User({
        firstName:'Muni',
        lastName:'Kiran',
        emailId:'munikiranch@gmail.com',
        password:'kiran@123'
    });

    await user.save();

    res.send('User added successfully!')
})


connectDB()
    .then(()=>{
    console.log(`Database connected successfully!`);
        app.listen(3000,()=>{
            console.log('server is running on port 3000')
        })
    })
    .catch((err)=>{
    console.log(`Database cannot be connected!`)
    });
