const express = require('express');

const db = require("./dbConnectExec.js")

const app = express();
app.use(express.json());

app.listen(5000,()=>{console.log(`app is running on port 5000`)});

app.get("/hi",(req, res)=>{res.send("hello world")});

app.get("/",(req,res)=>{res.send("API is running")});

// app.post()
// app.put()

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

