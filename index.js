const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())

// jwt verification function
const jwtVerify = (req, res, next) => {
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: 'Invalid token'})
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded) {
    if(err){
      return res.status(401).send({error: true, message: 'Unauthorized access token'})
    }
    req.decoded = decoded;
    next()
  });
}

// mongodb database start

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.hoynchx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //all data table here
    const usersCollections = client.db("fastFoodsBD").collection("users");
    const allFastFoodsCollections = client.db("fastFoodsBD").collection("allFastFoods");
    const cartsCollections = client.db("fastFoodsBD").collection("carts");

    //jwt token authentication
    app.post('/jwt', (req, res) => {
      const email = req.body;
      const token = jwt.sign( email, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
      res.send({token})
    })

    //check admin and verify admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = {email : email}
      const user = await usersCollections.findOne(query)
      if(user?.role !== 'admin'){
        return res.status(401).send({error: true, message: 'Unauthorized access token'})
      }
      next()
    }

    // get allFastFoods data
    app.get('/allFastFoods', async (req, res) => {
      const allFastFoods = await allFastFoodsCollections.find().toArray();
      res.send(allFastFoods);
    })

    // post allFastFoods data
    app.post('/allFastFoods', jwtVerify, verifyAdmin, async (req, res) => {
      const data = req.body;
      const result = await allFastFoodsCollections.insertOne(data);
      res.send(result)
    })

    // delete allFastFoods data
    app.delete('/allFastFoods/:id', jwtVerify, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await allFastFoodsCollections.deleteOne(query);
      res.send(result)
    })

    //get all users data from database
    app.get('/users', jwtVerify, verifyAdmin, async (req, res) => {
      const result = await usersCollections.find().toArray();
      res.send(result)
    })

    //patch the user data to create admin
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      };
      const result = await usersCollections.updateOne(filter, updateDoc);
      res.send(result)
    })

    //get admin in users
    app.get('/users/admin/:email', jwtVerify, async (req, res) => {
      const email = req.params.email;

      if(req.decoded?.email !== email){
        res.send({admin: false})
      }

      const query = {email : email}
      const user = await usersCollections.findOne(query)
      const result = {admin: user?.role === 'admin'}
      res.send(result)
    })

    //create user data
    app.post('/users', async (req, res) => {
      const data = req.body;
      const query = {email: data.email}
      const existingUser = await usersCollections.findOne(query);
      if(existingUser){
        return res.send({message: 'user already existing'})
      }
      const result = await usersCollections.insertOne(data);
      res.send(result)
    })

    //post single user carts data
    app.post('/carts', async (req, res) => {
      const data = req.body;
      const result = await cartsCollections.insertOne(data);
      res.send(result);
    })

    //get sing user carts data from email address
    app.get('/carts', jwtVerify, async (req, res) => {
      let query = {}
      if(req.query?.email){
        query = {email: req.query?.email}
      }
      const decoded = req.decoded.email;
      if(req.query?.email !== decoded){
        return res.status(403).send({error: true, message: 'Unauthorized access token'})
      }
      const result = await cartsCollections.find(query).toArray();
      res.send(result);
    })

    //put the single user data quantity
    app.put('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = {_id : new ObjectId(id)}
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          quantity: parseInt(body.quantity, 10)
        },
      };
      const result = await cartsCollections.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    //delete single user cart data
    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id : new ObjectId(id)};
      const result = await cartsCollections.deleteOne(query);
      res.send(result)
    });



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// mongodb database end



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})