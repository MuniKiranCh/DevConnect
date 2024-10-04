const express=require('express')
const {connectDB}=require('./config/database')
const app=express();
const User=require("./models/user");
const adminAuth=require('./middlewares/auth')

app.use('/admin',adminAuth)

app.get('/user',(req,res)=>{
    console.log('Hi, this user route!');
    res.send('Hello, user route 1');
})

app.get('/admin/getnames',(req,res)=>{
    console.log('Hi, this admin route!');
    res.send('Hello, admin');
})

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

app.use('/',(err,req,res,next)=>{
    if(err){
        res.status(500).send('Internal server error');
    }
    else next();
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
