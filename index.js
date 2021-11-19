const express = require('express');
const cors = require("cors");

const db = require("./dbConnectExec.js");
const jwt = require("jsonwebtoken");
const rockwellConfig = require('./config.js');
const auth = require("./middleware/authenticate")

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>{console.log(`app is running on port ${PORT}`)});

app.get("/hi",(req, res)=>{res.send("hello world")});

app.get("/",(req,res)=>{res.send("API is running")});

// app.post()
// app.put()

app.get("/reports/me", auth, async(req, res)=>{
    try{
        console.log(req.scout);
    let scoutFK = req.scout.ScoutPK;
    let query = `SELECT ReportPK, Hit, Power, Run, Field, Arm, PlayerFK, ScoutFK
    FROM Report
    WHERE ScoutFK = ${scoutFK}`;
    reports = await db.executeQuery(query);
    res.send(reports)
    }
    catch(err){
        console.log("error in POST /reports/me", err);
        res.status(500).send();
    }
    
})

app.post("/reports", auth, async (req, res)=>{
    try{
        let playerFK = req.body.PlayerFK;
        let hit = req.body.Hit;
        let power = req.body.Power;
        let run = req.body.Run;
        let field = req.body.Field;
        let arm = req.body.Arm;

        if(!playerFK || !hit || !power || !run || !field || !arm || !Number.isInteger(hit, power, run, field, arm)){return res.status(400).send("bad request")};

        // summary.replace("'","''");
        // console.log("summary", summary);
        // console.log("here is the contact", req.scout);

        let insertQuery = `INSERT INTO report(Hit, Power, Run, Field, Arm, PlayerFK, ScoutFK)
        OUTPUT inserted.ReportPK, inserted.Hit, inserted.Power, inserted.Run, inserted.Field, inserted.Arm, inserted.PlayerFK
        VALUES('${hit}','${power}','${run}','${field}','${arm}','${playerFK}','${req.scout.ScoutPK}')`;

        let insertedReview = await db.executeQuery(insertQuery)

        console.log("inserted review", insertedReview);

        res.send("here is the response");
    }
    catch(err){
        console.log("error in POST /reports", err);
        res.status(500).send();
    }
})

app.get("/scouts/me", auth, (req, res) =>{
    res.send(req.scout);
})

app.post("/scouts/logout", auth, (req, res)=>{
    let query = `UPDATE Scout
    SET Token = NULL
    WHERE ScoutPK = ${req.scout.ScoutPK}`;

    db.executeQuery(query)
    .then(()=>{res.status(200).send()})
    .catch((err)=>{
        console.log("error in POST /scouts/logout", err);
        res.status(500).send();
    })
})



app.post("/scouts/login", async (req, res)=>{
    // console.log('/scouts/login called', req.body);

    let email = req.body.email;
    let password = req.body.password;

    if(!email || !password){return res.status(400).send("Bad Request")}

    let query = `SELECT *
    FROM Scout
    WHERE email = '${email}'`

    let result;
    try{
       result = await db.executeQuery(query);
    }catch(myError){
        console.log("Error in /scouts/login", myError);
        return res.status(500).send();
    }
    // console.log("Result", result);

    if(!result[0]){return res.status(401).send("Invalid user credentials")};


    let user = result[0];

    if(password != user.Password){
        console.log("Invalid Password")
        return res.status(401).send("Invalid user credentials");
    }

    let token = jwt.sign({pk: user.ScoutPK},rockwellConfig.JWT,{expiresIn: "60 minutes"});
    // console.log("token", token);



    let setTokenQuery = `UPDATE Scout
    SET token = '${token}'
    WHERE ScoutPK = ${user.ScoutPK}`

    try{
        await db.executeQuery(setTokenQuery);
        res.status(200).send({
            token: token,
            user:{
                NameFirst: user.NameFirst,
                NameLast: user.NameLast,
                Email: user.Email,
                ScoutPK: user.ScoutPK,
            },
        });
    }
    catch(myError){
        console.log("error in setting user token",myError);
        res.status(500).send();
    }

})

app.post("/scouts", async (req, res)=>{
    // res.send("/scouts called");
    
    // console.log("request body", req.body);
    
    let nameFirst = req.body.nameFirst;
    let nameLast = req.body.nameLast;
    let email = req.body.email;
    let password = req.body.password;
    let organization = req.body.organization;

    let emailCheckQuery = `SELECT email
    FROM Scout
    WHERE email = '${email}'`;

    let existingUser = await db.executeQuery(emailCheckQuery);

    // console.log("existingUser", existingUser);

    if(existingUser[0]){return res.status(409).send("Duplicate email")};

    let insertQuery = `INSERT INTO Scout (NameFirst, NameLast, Email, Password, Organization)
    VALUES('${nameFirst}', '${nameLast}', '${email}', '${password}', '${organization}')`;

    db.executeQuery(insertQuery)
    .then(()=>{res.status(201).send()})
    .catch((err)=>{
        console.log("Error in POST /scouts", err)
        res.status(500).send;
    })
})

app.get("/players", (req,res)=>{
    db.executeQuery(`SELECT *
    FROM Player
    LEFT JOIN Position
    ON position.PositionPK = player.PositionFK`)
    .then((theResults)=>{
        res.status(200).send(theResults);
    })
    .catch((myError)=>{
        console.log(myError);
        res.status(500).send();
    });
});

app.get("/players/:pk", (req, res)=>{
    let pk = req.params.pk;
    // console.log(pk);
    let myQuery = `SELECT *
    FROM Player
    LEFT JOIN Position
    ON position.PositionPK = player.PositionFK
    WHERE playerpk = ${pk}`

    db.executeQuery(myQuery)
    .then((result)=>{
        // console.log("result", result);
        if(result[0]){
            res.send(result[0]);
        }else{
            res.status(404).send(`Bad request`);
        }
    })
    .catch((err)=>{
        console.log("Error in /movies/:pk", err);
        res.status(500).send();
    })
});

