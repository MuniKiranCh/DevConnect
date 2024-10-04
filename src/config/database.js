const mongoose=require('mongoose');

const connectDB=async ()=> {
    await mongoose.connect("mongodb+srv://munikiran:Qwertycs12345@cluster0.vqw73pn.mongodb.net/devTinder");
};

module.exports={connectDB}
