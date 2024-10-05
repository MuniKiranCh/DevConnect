const mongoose=require('mongoose');
const json=require('jsonwebtoken');
const bcrypt=require('bcrypt')

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
},{timestamps:true});

userSchema.methods.getJWT = async function(){
    const user=this;

    const token = await jwt.sign({ _id: user._id }, 'SECRET_KEY',{
        expiresIn:'7d'
    });

    return token;
}

userSchema.methods.validatePassword = async function(inputPassword){
    const user = this;
    const hashPassword=user.password;

    const isPasswordValid = await bcrypt.compare(inputPassword, hashPassword);

    return isPasswordValid;
}

module.exports = mongoose.model("User",userSchema);