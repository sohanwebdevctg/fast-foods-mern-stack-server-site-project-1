const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())

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
    const allFastFoodsCollections = client.db("fastFoodsBD").collection("allFastFoods");
    const cartsCollections = client.db("fastFoodsBD").collection("carts");


    // get allFastFoods data
    app.get('/allFastFoods', async (req, res) => {
      const allFastFoods = await allFastFoodsCollections.find().toArray();
      res.send(allFastFoods);
    })

    //post single user carts data
    app.post('/carts', async (req, res) => {
      const data = req.body;
      const result = await cartsCollections.insertOne(data);
      res.send(result);
    })

    //get sing user carts data from email address
    app.get('/carts', async (req, res) => {
      let query = {}
      if(req.query?.email){
        query = {email: req.query?.email}
      }
      const result = await cartsCollections.find(query).toArray();
      res.send(result);
    })



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