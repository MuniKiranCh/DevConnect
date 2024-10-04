const express=require('express')
const {connectDB}=require('./config/database')
const app=express();
const User=require("./models/user");
const adminAuth=require('./middlewares/auth')

app.use('/admin',adminAuth)
app.use(express.json());

app.post('/signup',async (req,res)=>{
    /*
        {
        firstName:'Muni',
        lastName:'Kiran',
        emailId:'munikiranch@gmail.com',
        password:'kiran@123'
        }
    */
    const user=new User(req.body);

    await user.save();

    res.send('User added successfully!')
})

app.get('/user',async (req,res)=>{
    const userEmail=req.body.emailId;

    try{
        const user=await User.findOne({emailId : userEmail})

        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        else{
            res.send(user);
        }
    }
    catch(err){
        res.status(400).send(`Something went wrong!`);
    }
})


app.get('/feed',async (req,res)=>{
    const userEmail=req.body.emailId;

    try{
        const users=await User.find({emailId : userEmail});

        if(users.length===0){
            return res.status(404).json({message:"User not found"});
        }
        else{
            res.send(users);
        }
    }catch(err){
        res.status(400).send(`Something went wrong!`);
    }
})

// app.get('/admin/getnames',(req,res)=>{
//     console.log('Hi, this admin route!');
//     res.send('Hello, admin');
// })

app.delete('/user',async (req,res)=>{
    const userId=req.body.userId;

    try{
        const user=await User.findByIdAndDelete({_id: userId});

        res.send('User deleted successfully!');
    }catch(err){
        res.status(400).send('Something went wrong!')
    }
    // console.log('This is delete route!');
})

app.patch('/user',async (req,res)=>{
    const userId=req.body.userId;

    const data=req.body;

    try{
        const user=await User.findByIdAndUpdate({_id: userId},data);
        res.send('User updated successfully!');
    }
    catch(err){
        res.status(400).send('Something went wrong!')
    }
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
