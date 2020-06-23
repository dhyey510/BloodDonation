const express=require('express');
const app=express();
const multer=require('multer');
const bodyParser=require('body-parser');
const dotenv=require('dotenv').config();
const path=require('path');
const session=require("express-session");
const mongoose=require('mongoose');
const passport=require('passport');
const localStrategy=require("passport-local");
const passportLocalMongoose=require('passport-local-mongoose');
const swal=require('sweetalert');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname + '/public'));

// passport config
app.use(session({
    secret:"Dhyey website",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

// mongodb connect
mongoose.connect(`mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0-z5873.mongodb.net/test`,
        {useNewUrlParser: true,useUnifiedTopology: true},
        ()=>{
    console.log(`mongoose connect `);
});
mongoose.set('useCreateIndex', true);

// schema and model
var DonorslotSchema=mongoose.Schema({
    orgname:String,
    orgimg:String,
    img:String,
    username:String,
    phone:Number,
    slotdate:String,
    reqdate:String,
    slottime:String,
    bloodgroup:String,
    reqbloodgrp:String,
    accdate:String,
    email:String,
    status:String
});
var reqSchema=new mongoose.Schema({
    orgname:String,
    bloodgrp:String,
    donorphone:Number,
    date:String,
    donorname:String,
    accdate:String
});
var UserSchema=new mongoose.Schema({
    email:String,
    password:String,
    img:String,
    isOrg:String,
    username:String,
    phone:Number,
    city:String,
    location:String,
    about:String,
    bloodgroup:{type:String,default:'none'},
    slot:[DonorslotSchema],
    appointment:[DonorslotSchema],
    schedual:[DonorslotSchema],
    requestblood:[DonorslotSchema],
    record:[DonorslotSchema]
});
UserSchema.plugin(passportLocalMongoose);

var User=mongoose.model("User",UserSchema);
var Slots=mongoose.model("Slots",DonorslotSchema);
var reqBlood=mongoose.model("reqBlood",reqSchema);

// for donor
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// multer
const storage=multer.diskStorage({
    destination:'./public/uploadas',
    filename : function(req,file,cb){
        cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }   
});

const upload=multer({
    storage:storage
}).single('img-upload');

// routes
app.get('/',function(req,res){
    res.render('index.ejs');
});

app.get('/:id/orgmain',function(req,res){
    res.render('Orgmain.ejs',{User:req.user});
});
app.post('/:id/orgmain/req',function(req,res){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; 
    var yyyy = today.getFullYear();
    if(dd<10) 
    {
        dd='0'+dd;
    } 
    if(mm<10) 
    {
        mm='0'+mm;
    } 
    today = mm+'/'+dd+'/'+yyyy;
    User.findById(req.params.id,function(err,org){
        let newReq=new Slots({
            orgname:org.username,
            reqbloodgrp:req.body.bldgroup,
            reqdate:today.toString(),
            status:"pending",
            phone:" ",
            username:" ",
            accdate:" "
        });
        org.requestblood.push(newReq);
        org.record.push(newReq);
        org.save(function(err,org1){
           if(err){
               console.log(err);
           }else{
                res.redirect(`/${org1.id}/orgmain`);
           }
        });
    });
});
app.get('/:id/orgeditprofile',function(req,res){
    res.render('orgprofile.ejs',{User:req.user});
});
app.post('/:id/orgupdate',function(req,res){
    let newUser={
        username:req.body.username,
        phone:req.body.phone,
        email:req.body.email,
        city:req.body.city,
        location:req.body.address,
        about:req.body.about
    };
    User.findByIdAndUpdate(req.params.id,newUser,function(err,user){
        if(err){
            console.log(err);
        }else{
            res.redirect(`/${req.user.id}/orgmain`);
        }
    });
});
app.get('/:id/orgrequest',function(req,res){
    res.render('orgrequset.ejs',{User:req.user});
});
app.get('/:id/orgrequest/:slotid/cnf',function(req,res){
    User.findById(req.params.id,function(err,user){
        for(let i=0;i<user.appointment.length;i++){
            if(user.appointment[i].id==req.params.slotid){
                const un=user.appointment[i].username;
                const email1=user.appointment[i].email;
                const phone1=user.appointment[i].phone;
                let findUser={
                    username:un,
                    email:email1,
                    phone:phone1,
                    isOrg:"user"
                };
                User.find(findUser,function(err,finduser){
                    if(err){
                        console.log("in err");
                    }else{
                        for(let j=0;j<finduser[0].slot.length;j++){
                            if(finduser[0].slot[j].id==req.params.slotid){
                                        
                                    finduser[0].slot[j].status="Appointment Conferm";
                                    finduser[0].save(function(err){
                                        if(err){
                                            console.log(err);
                                        }
                                    });
                                }
                        }
                    }
                });
                user.schedual.push(user.appointment[i]);
                user.appointment.splice(i,1);
                user.save(function(err){
                    if(err){
                        console.log(err);
                        res.redirect(`/${req.user.id}/orgrequest`);
                    }else{
                            res.redirect(`/${req.user.id}/orgrequest`);
                    }
                });
            }
        }
    });
});
app.get('/:id/orgrequest/:slotid/cancel',function(req,res){
    User.findById(req.params.id,function(err,user){
        for(let i=0;i<user.appointment.length;i++){
            if(user.appointment[i].id==req.params.slotid){
                const un=user.appointment[i].username;
                const email1=user.appointment[i].email;
                const phone1=user.appointment[i].phone;
                let findUser={
                    username:un,
                    email:email1,
                    phone:phone1,
                    isOrg:"user"
                };
                User.find(findUser,function(err,finduser){
                    if(err){
                        console.log("in err");
                    }else{
                        for(let j=0;j<finduser[0].slot.length;j++){
                            if(finduser[0].slot[j].id==req.params.slotid){

                                    finduser[0].slot[j].status="Appointment Cancel";
                                    finduser[0].save(function(err){
                                        if(err){
                                            console.log(err);
                                        }
                                    });
                                }
                        }
                    }
                });
                user.appointment.splice(i,1);
                user.save(function(err){
                    if(err){
                        console.log(err);

                        res.redirect(`/${req.user.id}/orgrequest`);
                    }else{
                            res.redirect(`/${req.user.id}/orgrequest`);
                    }
                });
            }
        }
    });
});
app.get('/:id/schedual',function(req,res){
    var months=['January','February','March','April','May','June','July','August','September','October','November','December'];
    var days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    const month=months[today.getMonth()]; 
    const day=days[today.getDay()];
    var yyyy = today.getFullYear();
    if(dd<10) 
    {
        dd='0'+dd;
    } 
    if(mm<10) 
    {
        mm='0'+mm;
    } 
    today = mm+'/'+dd+'/'+yyyy;
    res.render('orgschedual.ejs',{User:req.user,Date:today,currentDate:dd,currentMonth:month,currentDay:day,currentYear:yyyy});
});
app.get('/:id/schedule/:slotid/cnf',function(req,res){
    User.findById(req.params.id,function(err,user){
       for(let i=0;i<user.schedual.length;i++){
           if(user.schedual[i].id==req.params.slotid){
                var letuser;
                const un=user.schedual[i].username;
                const email1=user.schedual[i].email;
                const phone1=user.schedual[i].phone;
                const reqDate=user.schedual[i].reqdate;
                const reqBlgrp=user.schedual[i].reqbloodgrp;
                const accDate=user.schedual[i].slotdate;
                let findUser={
                    username:un,
                    email:email1,
                    phone:phone1,
                    isOrg:"user"
                };
                // console.log(user.schedual[i].username+" "+user.schedual[i].email);
                User.find(findUser,function(err,finduser){
                    if(err){
                        console.log("in err");
                    }else{
                        // letuser=finduser[0];
                        // console.log(finduser[0]+" "+"in");
                        for(let j=0;j<finduser[0].slot.length;j++){
                            if(finduser[0].slot[j].id==req.params.slotid){                     
                                    finduser[0].slot[j].status="Done";
                                    finduser[0].save(function(err){
                                        if(err){
                                            console.log(err);
                                        }   
                                    });
                            }
                        }
                    }
                });
                for(let j=0;j<user.record.length;j++){
                        if(user.record[j].orgname==req.user.username &&
                        user.record[j].reqdate==reqDate &&
                        user.record[j].reqbloodgrp==reqBlgrp &&
                        user.record[j].username){
                        user.record[j].phone=phone1;
                        user.record[j].username=un;
                        user.record[j].accdate=accDate;
                    }
                }

                for(let j=0;j<user.requestblood.length;j++){
                    if(user.requestblood[j].orgname==req.user.username &&
                        user.requestblood[j].reqdate==user.schedual[i].reqdate &&
                        user.requestblood[j].reqbloodgrp==user.schedual[i].reqbloodgrp){
                            user.requestblood.splice(j,1);
                    }
                }
                user.schedual.splice(i,1);
                user.save(function(err,us){
                    if(err){
                        console.log(err);
                        res.redirect(`/${req.user.id}/schedual`);
                    }else{
                        res.redirect(`/${req.user.id}/schedual`);
                    }
                });
           }
       } 
    });
});
app.get('/:id/schedule/:slotid/cancel',function(req,res){
    User.findById(req.params.id,function(err,user){
       for(let i=0;i<user.schedual.length;i++){
           if(user.schedual[i].id==req.params.slotid){
                var letuser;
                const un=user.schedual[i].username;
                const email1=user.schedual[i].email;
                const phone1=user.schedual[i].phone;
                const reqDate=user.schedual[i].reqdate;
                const reqBlgrp=user.schedual[i].reqbloodgrp;
                const accDate=user.schedual[i].slotdate;
                let findUser={
                    username:un,
                    email:email1,
                    phone:phone1,
                    isOrg:"user"
                };
                // console.log(user.schedual[i].username+" "+user.schedual[i].email);
                User.find(findUser,function(err,finduser){
                    if(err){
                        console.log("in err");
                    }else{
                        // letuser=finduser[0];
                        // console.log(finduser[0]+" "+"in");
                        for(let j=0;j<finduser[0].slot.length;j++){
                            if(finduser[0].slot[j].id==req.params.slotid){                     
                                    finduser[0].slot[j].status="Not Donate";
                                    finduser[0].save(function(err){
                                        if(err){
                                            console.log(err);
                                        }   
                                    });
                            }
                        }
                    }
                });

                user.schedual.splice(i,1);
                user.save(function(err,us){
                    if(err){
                        console.log(err);
                        res.redirect(`/${req.user.id}/schedual`);
                    }else{
                        res.redirect(`/${req.user.id}/schedual`);
                    }
                });
           }
       } 
    });
});

// donor route
app.get("/instruction",function(req,res){
    res.redirect(`/${req.user.id}/instruction`);
});
app.get("/:id/instruction",function(req,res){
    res.render('instruction.ejs',{User:req.user});
});
app.get('/:id/editprofile',function(req,res){
    res.render('editprofile.ejs',{User:req.user});
});
app.post('/:id/update',function(req,res){
    let newUser={
        username:req.body.username,
        phone:req.body.phone,
        bloodgroup:req.body.bldgrp,
        email:req.body.email,
        city:req.body.city,
        about:req.body.about
    };
    User.findByIdAndUpdate(req.params.id,newUser,function(err,user){
        if(err){
            console.log(err);
        }else{
            res.redirect(`/${req.user.id}/instruction`);
        }
    });
});
app.get('/:id/findorg',function(req,res){
    User.find({isOrg:"organization"},function(err,orgs){
        if(err){
            console.log(err);
        }else{
            // console.log(orgs);
            res.render('FindDonor.ejs',{User:req.user,Org:orgs,Req:req.query.search,Check:req.query.findorgby});
        }
    });
});

app.get('/:id/findorg/search',function(req,res){
    let orgname=req.query.search;
    if(req.query.findorgby){
        if(req.query.findorgby.length==2){
            if(orgname){
                User.find({username:orgname,isOrg:"organization",city:req.user.city,bloodgroup:req.user.bloodgroup},function(err,org){
                    if(err){
                        res.redirect(`/${req.user.id}/findorg`);
                    }else{
                        res.render('FindDonor.ejs',{User:req.user,Org:org,Req:req.query.search,Check:req.query.findorgby});
                    } 
                });
            }else{
                User.find({isOrg:"organization",city:req.user.city,bloodgroup:req.user.bloodgroup},function(err,org){
                    if(err){
                        res.redirect(`/${req.user.id}/findorg`);
                    }else{
                        res.render('FindDonor.ejs',{User:req.user,Org:org,Req:req.query.search,Check:req.query.findorgby});
                    } 
                });
            }
        }else if(req.query.findorgby=="near"){
            if(orgname){
                User.find({username:orgname,isOrg:"organization",city:req.user.city},function(err,org){
                    if(err){
                        res.redirect(`/${req.user.id}/findorg`);
                    }else{
                        res.render('FindDonor.ejs',{User:req.user,Org:org,Req:req.query.search,Check:req.query.findorgby});
                    } 
                });
            }else{
                User.find({isOrg:"organization",city:req.user.city},function(err,org){
                    if(err){
                        res.redirect(`/${req.user.id}/findorg`);
                    }else{
                        res.render('FindDonor.ejs',{User:req.user,Org:org,Req:req.query.search,Check:req.query.findorgby});
                    } 
                });
            }
        }else if(req.query.findorgby=="bldgrp"){
            if(orgname){
                User.find({username:orgname,isOrg:"organization",bloodgroup:req.user.bloodgroup},function(err,org){
                    if(err){
                        res.redirect(`/${req.user.id}/findorg`);
                    }else{
                        res.render('FindDonor.ejs',{User:req.user,Org:org,Req:req.query.search,Check:req.query.findorgby});
                    } 
                });
            }else{
                User.find({isOrg:"organization",bloodgroup:req.user.bloodgroup},function(err,org){
                    if(err){
                        res.redirect(`/${req.user.id}/findorg`);
                    }else{
                        res.render('FindDonor.ejs',{User:req.user,Org:org,Req:req.query.search,Check:req.query.findorgby});
                    } 
                });
            }
        }
    }else{
        User.find({username:orgname,isOrg:"organization"},function(err,org){
            if(err){
                res.redirect(`/${req.user.id}/findorg`);
            }else{
                res.render('FindDonor.ejs',{User:req.user,Org:org,Req:req.query.search,Check:req.query.findorgby});
            } 
        });
    }
});

app.get('/:id/final',function(req,res){
    User.findById(req.params.id,function(err,user){
        if(err){
            console.log(err);
        }else{
            res.render('finalStep.ejs',{User:user});
        }
    });
});
app.get('/:id/:slotid/deleteslot',function(req,res){

    User.findById(req.params.id,function(err,user){
        let slotid;
        for(let i=0;i<user.slot.length;i++){
            if(user.slot[i].id==req.params.slotid){
                slotid=user.slot[i];
                user.slot.splice(i,1);
                user.save(function(err,us){
                    if(err){
                        console.log(err);
                    }
                });
            }
        }

        User.find({username:slotid.orgname, isOrg:"organization"},function(err,org){
            if(err){
                console.log(err);
            }else{
                for(let i=0;i<org[0].appointment.length;i++){
                    if(org[0].appointment[i].id==req.params.slotid){
                        org[0].appointment.splice(i,1);
                        org[0].save(function(err,org){
                            if(err){
                                console.log(err);
                            }
                        });
                    }
                }
            }
        });
        res.redirect(`/${user.id}/final`);
    });
});
app.get('/:id/reqslot/:orgid/:slotid',function(req,res){
    User.findById(req.params.orgid,function(err,org){
        res.render('requestDonate.ejs',{User:req.user,Org:org,Slot:req.params.slotid});
    });
});
app.post('/:id/reqslot/:orgid/req/:slotid',function(req,res){
    User.findById(req.params.id,function(err,user){
        if(err){
            console.log(err);
        } else{
            User.findById(req.params.orgid,function(err,org){
                let reqslot;
                for(let i=0;i<org.requestblood.length;i++){
                    if(org.requestblood[i].id==req.params.slotid){
                        reqslot=org.requestblood[i];
                    }
                }
                // console.log(req.user.username);
                let newSlot=new Slots({
                    orgname:org.username,
                    orgimg:org.img,
                    img:req.user.img,
                    username:req.user.username,
                    phone:req.user.phone,
                    slotdate:req.body.appdate,
                    slottime:req.body.apptime,
                    bloodgroup:req.user.bloodgroup,
                    email:req.user.email,
                    reqdate:reqslot.reqdate,
                    reqbloodgrp:reqslot.reqbloodgrp,
                    status:"Pending"
                });
                org.appointment.push(newSlot);
                org.save(function(err,org){
                    if(err){
                        console.log(err);
                    }
                });
                user.slot.push(newSlot);
                user.save(function(err,USER){
                    if(err){
                        console.log(err);
                    }else{
                        res.redirect(`/${req.user.id}/final`);
                    }
                });                
            });
        }
    });
});

app.post('/:id/requsetblood',function(req,res){
    let newReq= new reqBlood({
        orgname:req.user.name,
        bloodgroup:req.body.blgrp,
        phone:req.body.phone
    });
    let currentUser=req.user;
    currentUser.requestblood.push(newReq);
    currentUser.save(function(err,user){
        if(err){
            // res.redirect();
            console.log(err);
        }else{
            // res.redirect();
            res.send("success add req");   
        }
    });
});

// signup route
app.get('/donorsignup',function(req,res){
    res.render('signup.ejs');
});
app.post('/signup',function(req,res){
    upload(req,res,(err)=>{
        if(err){
            console.log(err);
            res.render('signup.ejs');
        }else{
            let newUser=new User({
                email:req.body.email,
                img:req.file.filename,
                username:req.body.username,
                phone:req.body.phonei,
                city:req.body.cityi,
                isOrg:req.body.categ,
            });
            User.register(newUser,req.body.password,function(err,user){
                if(err){
                    console.log(err);
                    res.redirect('/donorsignup');
                }else{
                    passport.authenticate("local")(req,res,function(){
                        if(req.body.categ == "organization"){
                            swal("hello world");
                            res.redirect(`/${req.user.id}/orgeditprofile`);
                        }else{
                            swal("hello World");
                            res.redirect(`/${req.user.id}/editprofile`);
                        }
                    });    
                }
            });
        }
    });
});

// logn route
app.get('/donorlogin',function(req,res){
    if(req.isAuthenticated()){
        if(req.user.isOrg=="organization"){
            res.redirect(`/${req.user.id}/orgmain`);
        }else{
            res.redirect(`/${req.user.id}/instruction`);
        }
    } else{
         res.render('login.ejs');
    }
 });

//  ,passport.authenticate("local",{successRedirect:"/instruction",failureRedirect:"/donorlogin"}) ,
 app.post('/login',(req, res, next) => {
    passport.authenticate('local',
    (err, user, info) => {
      if (err) {
        return next(err);
      }
  
      if (!user) {
        return res.redirect('/donorlogin');
      }
  
      req.logIn(user, function(err) {
        if (err) {
          return next(err);
        }
        if(user.isOrg=="organization"){
            return res.redirect(`/${user.id}/orgmain`);
        }else{
            return res.redirect(`/${user.id}/instruction`);
        }
      });
  
    })(req, res, next);
 });




// login for org



app.get('/logout',function(req,res){
    req.logout();
    res.redirect('/');
});


// listen on port 3000


app.listen(3000,function(){
    console.log(`listening on 3000 : `);
});
