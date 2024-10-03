const express=require('express')
const app=express();

app.use('/',(req,res)=>{
    console.log(`Hello world`)
    res.send('Hello world');
})

app.listen(3000,()=>{
    console.log('server is running on port 3000')
})