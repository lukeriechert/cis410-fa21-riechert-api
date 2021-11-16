const jwt = require("jsonwebtoken");

let myToken = jwt.sign({pk: 289234},"secret password",{expiresIn: "60 minutes"});

console.log("my token", myToken);

let verificationTest = jwt.verify(myToken,"secret password");

console.log("verification test", verificationTest);