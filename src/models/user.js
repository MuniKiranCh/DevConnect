const mongoose=require('mongoose');

const userSchema=new mongoose.Schema({
    firstName: {
        type:String,
        required:true
    },
    lastName: {
        type:String
    },
    emailId: {
        type:String,
        required:true,
        unique:true
    },
    password: {
        type:String
    },
    age:{
        type:String,
        min:18
    },
    gender:{
        type:String
    }
});

module.exports = mongoose.model("User",userSchema);