const adminAuth=(req,res,next)=>{
    console.log("Admin auth is getting checked!");
    const token="xyz";
    const isAdmin= token==="xyz";

    if(isAdmin){
        next();
    }else{
        res.status(401).send('Unauthorized request')
    }
}

module.exports=adminAuth;