var express = require('express');
var router = express.Router();

var db = require('../db');

/* GET query against users. 
input age : Number or Number Range - The age of the user/'s to be queried. Can be a distinct integer or range such as 25-29 
input income : Number or Number Range - The income of the user/'s to be queried. Can be a distinct integer or range such as 30000-40000 
input living_environment : String - The living environment of the user/'s to be queried. Possible values include "Suburban", "Urban", "Rural"
input sex : String - The gender of the user/'s to be queried. Possible values include "Male", "M", "Female", "F"

output result : Array of Objects - A list of message id's and text that is returned from the database after the query has run
*/
router.get('/users', function(req, res, next) {

  const query = constructQuery(req.query);
  if (query) {
    console.log("Query: ", query + '\n')
    db.all(query).then((result)=>{
      if (result.length > 0) {
        res.status(200).json(result); 
      } else {
        res.status(200).json("No results found")
      }
    });
  } else {
    res.status(200).json("Query params empty");
  }
  
});

/* GET query against messages. 
input text : String - An alphanumeric string that the database will attempt to match the message text to

output result : Array of Objects - A list of message id's and text that is returned from the database after the query has run
*/
router.get('/messages', function(req, res, next) {

  let sql = 
  `SELECT messages.id AS messageId, 
          messages.text AS messageText
  FROM messages
	WHERE text GLOB '*${req.query.text}*';`

  db.all(sql).then((result)=>{
    if (result.length > 0) {
      res.status(200).json(result); 
    } else {
      res.status(200).json("No results found")
    }
  });

});

/* GET query against questions. 
input text : String - An alphanumeric string that the database will attempt to match the question text to

output result : Array of Objects - A list of message id's and text that is returned from the database after the query has run
*/
router.get('/questions', function(req, res, next) {

  let sql = 
  `SELECT messages.id AS messageId, 
          messages.text AS messageText
  FROM messages
  INNER JOIN questions on questions.id = messages.question_id
  WHERE questions.text GLOB '*${req.query.text}*';`

  db.all(sql).then((result)=>{
    if (result.length > 0) {
      res.status(200).json(result); 
    } else {
      res.status(200).json("No results found")
    }
  });
  
});

/* GET query against votes. 
input id : Number - A number that represents the id of a vote that the database will try to match a message to

output result : Array of Objects - A list of message id's and text that is returned from the database after the query has run
*/
router.get('/votes', function(req, res, next) {
  
  let sql = 
  `SELECT messages.id AS messageId, 
          messages.text AS messageText
  FROM votes
  INNER JOIN messages on votes.message_id = messages.id
  WHERE votes.id = ${req.query.id};`
  
  db.all(sql).then((result)=>{
    if (result.length > 0) {
      res.status(200).json(result); 
    } else {
      res.status(200).json("No results found")
    }
  });

});

/* constructQuery will check for the existance of possible parameters. If they exist, a handler function is called 
that processes the param into a SQL compliant format. All the processed params are then appended to a base query.

input params : Object - An object containing the parameters from the request. Only req.query should be passed into the function

output sql : String - A formatted string that is ready to be passed into a sql database to query
*/
function constructQuery (params) {
  //Initialize query body
  let sql = 
  `SELECT messages.id AS messageId, 
          messages.text AS messageText
	FROM messages
	INNER JOIN users on messages.creator_id = users.id
  WHERE `

  let queryArr = []

  //Check for the existance of the parameters
  if (params.age) {
    queryArr.push(handleParam(params.age, constructAge));  
  }

  if (params.income) {
    queryArr.push(handleParam(params.income, constructIncome));
  }

  if (params.living_environment) {
    queryArr.push(handleParam(params.living_environment, constructLiving));
  }

  if (params.sex) {
    queryArr.push(handleParam(params.sex, constructSex));
  }

  //If there are formatted parameters to use, concatenate them onto the query
  if (!queryArr.length) {
    return false
  } else {
    for (var i = 0; i < queryArr.length; i++) {
      if (i === 0) {
        sql += queryArr[i];
      } else {
        sql += " AND ";
        sql += queryArr[i]; 
      }
    }
    sql += ";";
    return sql
  }
}

/* handleParam is a utility function for handling possible parameter combinations. First it checks to see if there
are multiple parameters passed separated by a comma such as "age=25,30" and if there are, process them one by one 
and then bundle them up in an OR query string. If there is only a single parameter, simply call the handler.

input param : String or Set of Strings - The raw parameter to be processed by the handler function. It is either 
a single string or set of strings separated by a comma
input handler : function - The function to be called to process the param string

output queryStr : String - A query string meant to be inserted into a SQL WHERE clause. It can be a single clause
or a set of clauses separated by OR's and surrounded by paraentheses
 */
function handleParam (param, handler) {
  let queryStr = ""
  param = param.split(',');
  if (param.length > 1) {
    queryStr += "("
    param.map((s, i)=>{
      if (i === 0) {
        queryStr += handler(s);
      } else {
        queryStr += " OR ";
        queryStr += handler(s);
      }
    })
    queryStr += ")"
    return queryStr
  } else {
    queryStr = handler(param[0]);
    return queryStr
  }
}

/* constructAge is used to parse an age parameter. It tries to match the age ranges listed in the ages array directly
first. If it can't, then it looks for what range the age will fit into and returns that range.

input age : Number or Number Range - The age of the user to be queried for. Can be a single integer or a range that
  matches one of the ranges listed in ages such as "25-29"

output string : String - A single string that defines a conditional to be queried for in a SQL database
*/
function constructAge (age) {
  console.log(age)
  const ages = 
  ["18-24",
  "25-29",
  "30-39",
  "40-49",
  "50-59",
  "60-64"];

  //Short circut if an age range is passed in
  if (ages.indexOf(age) !== -1) {
    return `users.age = "${age}"`
  } else if (age === "65+") {
    return `users.age = "65+"`
  }

  //Iterate through the possible ages and try to find one that matches the inputted age
  for (var i = 0; i < ages.length; i++) {
    if (age >= 65) {
      return `users.age = "65+"`
    } else if (age < 18) {
      return `users.age < 18`
    } else {
      const ageRange = ages[i].split('-');
      if (age >= ageRange[0] && age <= ageRange[1]) {
        return `users.age = "${ages[i]}"`
      }
    }
  };
};

/* constructIncome is used to parse an income parameter. It tries to match the income ranges listed in the 
incomes array directly first. If it can't, then it looks for what range the income will fit into and returns that range.

input income : Number or Number Range - The income of the user to be queried for. Can be a single integer or a range that
  matches one of the ranges listed in incomes such as "40000-50000"

output string : String - A single string that defines a conditional to be queried for in a SQL database
*/
function constructIncome (income) {
  const incomes = 
  {"20000-30000": "20\\,000-30\\,000",
  "30000-40000": "30\\,000-40\\,000",
  "40000-50000": "40\\,000-50\\,000",
  "50000-60000": "50\\,000-60\\,000",
  "60000-70000": "60\\,000-70\\,000",
  "70000-80000": "70\\,000-80\\,000",
  "80000-90000": "80\\,000-90\\,000",
  "90000-100000": "90\\,000-100\\,000"}

  //Short circut if an income range is passed in
  if (income === "100,000+") {
    return `users.income = "100\\,000+"`
  } else if (income === "<20,000") {
      return `users.income = "<20\\,000"`
  } else {
    for (var key in incomes) {
      if (key === income) {
        return `users.income = "${incomes[key]}"`
      }
    }
  }

  //Iterate through the possible incomes and try to find one that matches the inputted income
  for (var key in incomes) {
    if (income > 100000) {
      return `users.income = "100\\,000+"`
    } else if (income < 20000) {
      return `users.income = "<20\\,000"`
    } else {
      const incomeRange = incomes[key].split('-');
      incomeRange[0] = Number(incomeRange[0].split("\\,").join(""));
      incomeRange[1] = Number(incomeRange[1].split("\\,").join(""));
      if (income >= incomeRange[0] && income <= incomeRange[1]) {
        return `users.income = "${incomes[key]}"`
      }
    }
  };
};

//Parse and process the living_environment parameter
function constructLiving (le) {
  le = le.toUpperCase();
  if (le === "SUBURBAN") {
    return `users.living_environment = "Suburban"`
  } else if (le === "RURAL") {
    return `users.living_environment = "Rural"`
  } else if (le === "URBAN") {
    return `users.living_environment = "Urban"`
  }
}

//Parse and process the sex parameter
function constructSex (sex) {
  sex = sex.toUpperCase();
  if (sex === "M" || sex === "MALE") {
    return `users.sex = "M"`;
  } else if (sex === "F" || sex === "FEMALE") {
    return `users.sex = "F"`;
  }
}

module.exports = router;