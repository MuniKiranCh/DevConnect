const express=require('express');
const profileRouter=express.Router();
const { userAuth } = require('../middlewares/auth');
const {validateProfile}=require('../utils/validation');
const User=require('../models/user')

// Get User Profile Route

profileRouter.get('/profile/view', userAuth, async (req, res) => {
    try {
        const user = req.user;
        res.send(user);
    }catch (err) {
        res.status(400).send(`ERROR: ${err.message}`);
    }
});

// Get All Users Profile Route
profileRouter.get('/profile/feed', userAuth, async (req, res) => {
    try {
        const users = await User.find();

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.send(users);
    }catch (err) {
        res.status(400).send(`ERROR: ${err.message}`);
    }
});

// Edit User Profile Route
profileRouter.patch('/profile/edit', userAuth, async (req, res) => {
    try {
        if(!validateProfile(req)) throw new Error("Invalid Edit Request!!!");

        const loggedInuser=req.user;
    
        const updatedUser=await User.findByIdAndUpdate(loggedInuser._id,req.body,{new:true});
        res.send(`Profile Updated Successfully!!!`);

    } catch (err) {
        res.status(400).send(`ERROR: ${err.message}`);
    }
});

module.exports=profileRouter;