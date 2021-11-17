const jwt = require("jsonwebtoken");
const rockwellConfig = require("../config.js");
const db = require("../dbConnectExec.js");

const auth = async(req,res, next)=>{
    // console.log("in the middleware", req.header("Authorization"));
    // next();
    try{
        let myToken = req.header("Authorization").replace("Bearer ","");
        // console.log("token", myToken);

        let decoded = jwt.verify(myToken, rockwellConfig.JWT);
        console.log(decoded);

        let scoutPK = decoded.pk;

// compare with database
        let query = `SELECT ScoutPK, NameFirst, NameLast, Email
        FROM Scout
        WHERE ScoutPK=${scoutPK} and token = '${myToken}'`

        let returnedUser = await db.executeQuery(query);
        console.log("returned user", returnedUser);

        // save infor
        if(returnedUser[0]){
            req.scout = returnedUser[0];
            next();
        }
        else{
            return res.status(401).send("Invalid credentials");
        }
    }
    catch(err){
        return res.status(401).send("Invalid credentials");
    }

}

module.exports = auth;