const express = require('express');

const db = require("./dbConnectExec.js");
const jwt = require("jsonwebtoken");
const rockwellConfig = require('./config.js');

const app = express();
app.use(express.json());

app.listen(5000,()=>{console.log(`app is running on port 5000`)});

app.get("/hi",(req, res)=>{res.send("hello world")});

app.get("/",(req,res)=>{res.send("API is running")});

// app.post()
// app.put()

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

