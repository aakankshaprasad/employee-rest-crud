var express  = require('express'),
    path     = require('path'),
    bodyParser = require('body-parser'),
    app = express(),
    expressValidator = require('express-validator'),
    swaggerJSDoc=require('swagger-jsdoc'),
    swaggerUi=require('swagger-ui-express');

var port = process.env.PORT || 3000;

var swaggerDefinition = {
  info: {
    title: 'Node Emloyee API Swagger Implementation',
    version: '1.0.0',
    description: 'API description of Employee CRUD tasks',
  },
  host: 'localhost:'+port,
  basePath: '/',
};

// options for swagger jsdoc 
var options = {
  swaggerDefinition: swaggerDefinition, // swagger definition
  apis: ['./*.js'], // path where API specification are written
};

// initialize swaggerJSDoc
var swaggerSpec = swaggerJSDoc(options);
app.use('/api-docs',swaggerUi.serve,swaggerUi.setup(swaggerSpec,true))
app.get('/api-doc.json', function(req,res){
    res.setHeader('Content-Type','application/json');
    res.send(swaggerSpec);
})

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(expressValidator());

/*MySql connection*/
var connection  = require('express-myconnection'),
    mysql = require('mysql');

app.use(

    connection(mysql,{
        host     : 'localhost',
        user     : 'root',
        password : 'root',
        database : 'test',
        debug    : false 
    },'request')

);

app.get('/',function(req,res){
    res.send('API For Employee CRUD operation');
});


//RESTful route
var router = express.Router();


router.use(function(req, res, next) {
    console.log(req.method, req.url);
    next();
});
/**
 * @swagger
 * definitions:
 *   employee:
 *     properties:
 *       empid:
 *         type: string
 *       name:
 *         type: string
 *       email:
 *         type: string
 *       age:
 *         type: string
 *       designation:
 *         type: string
 *       phone:
 *         type: string
 */
//get API

/**
 * @swagger
 * /api/user:
 *   get:
 *     description: Returns all employees
 *     produces:
 *       - application/text
 *     responses:
 *       200:
 *         description: Employee Records are returned
 *       500:
 *         description: Connection Error   
 *       
 */


var crud = router.route('/user');


//show the CRUD interface | GET
crud.get(function(req,res,next){


    req.getConnection(function(err,conn){

        if (err) res.status(500).send("Cannot Connect");

        var query = conn.query('SELECT * FROM employeeDB',function(err,rows){

            if(err){
                console.log(err);
                return next("Mysql error, check your query");
            }
            res.status(200).send(rows);
            if(rows==null) res.status(500);
         });

    });

});

//post data to db

/**
 * @swagger
 * /api/user:
 *   post:
 *     description: Creates a new employee Record
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Employee
 *         description: Employee object
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/employee'
 *     responses:
 *       200:
 *         description: Successfully created
 *       500:
 *         description: Connection Error  
 */

//post data to DB | POST
crud.post(function(req,res,next){

    //validation
    req.assert('name','Name is required').notEmpty();
    req.assert('email','A valid email is required').isEmail();
    var errors = req.validationErrors();
    if(errors){
        res.status(422).json(errors);
        return;
    }

    //get data
    var data = {
        emp_id:req.body.empid,
        emp_name:req.body.name,
        emp_emailid:req.body.email,
        emp_age:req.body.age,
        emp_designation:req.body.designation,
        phone:req.body.phone
     };

    //inserting into mysql
    req.getConnection(function (err, conn){

        if (err) return next("Cannot Connect");

        var query = conn.query("INSERT INTO employeeDB set ? ",data, function(err, rows){

           if(err){
                console.log(err);
                return next("Mysql error, check your query");
           }

          res.sendStatus(200);

        });

     });

});


//now for Single route (GET,DELETE,PUT)
var crud2 = router.route('/user/:user_id');
crud2.all(function(req,res,next){
    console.log(req.params);
    next();
});


/**
 * @swagger
 * /api/user/{user_id}:
 *   put:
 *     description: Edit an existing employee Record
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: user_id
 *         description: Employee ID
 *         in: path
 *         required: true
 *       - name: Employee object
 *         description: Employee data
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/employee'
 *     responses:
 *       200:
 *         description: Successfully created
 *       500:
 *         description: Connection Error 
 *       404:
 *         description: Record not Found  
 */

//update data
crud2.put(function(req,res,next){
    var emp_id = req.params.user_id;
    var data = {
        emp_id:req.body.empid,
        emp_name:req.body.name,
        emp_emailid:req.body.email,
        emp_age:req.body.age,
        emp_designation:req.body.designation,
        phone:req.body.phone
     };

    //inserting into mysql
    req.getConnection(function (err, conn){

        if (err) return next("Cannot Connect");
         var query = conn.query('SELECT * FROM employeeDB where emp_id=?',[emp_id],function(err,results,rows){
            console.log("row values"+ results.length)
            if(results.length==0){
                return res.status(404).send('Record Not Found')
            }
            else{



                var query = conn.query("UPDATE employeeDB set ? WHERE emp_id = ? ",[data,emp_id], function(err, rows){

                   if(err){
                        console.log(err);
                        return next("Mysql error, check your query");
                   }

                  res.sendStatus(200);

                });
             }
        });
     });

});
/**
 * @swagger
 * /api/user/{user_id}:
 *   delete:
 *     description: Deletes an employee Record
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: user_id
 *         description: Employee id
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Successfully created
 *       500:
 *         description: Connection Error 
 *       404:
 *         description: Record not Found   
 */
//delete data
crud2.delete(function(req,res,next){

    var user_id = req.params.user_id;

     req.getConnection(function (err, conn) {

        if (err) return next("Cannot Connect");

        var query = conn.query('SELECT * FROM employeeDB where emp_id=?',[user_id],function(err,results,rows){
            console.log("row values"+ results.length)
            if(results.length==0){
                return res.status(404).send('Record Not Found')
            }
            else{
         
                
                var query = conn.query("DELETE FROM employeeDB  WHERE emp_id = ? ",[user_id], function(err,results, rows){

                     if(err){
                        console.log(err);
                        return next("Mysql error, check your query");
                     }
                    else
                     res.sendStatus(200);
                 });
            }
        });
     
     });
});


app.use('/api', router);


var server = app.listen(port,function(){

   console.log("Listening to port %s",server.address().port);

});
