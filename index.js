const express = require('express');
const cors = require('cors');
const app =express();
require('dotenv').config()
const port =process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// db_user=job-hunter-1
// db pass =RUhPIlPcSJBOY2pN



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e72gk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // jobs collection

    const jobCollections =client.db('job-portal-1').collection('jobs');
    const jobApplicatinCollection =client.db('job-portal-1').collection('job-application')

    app.get('/jobs',async(req,res ) =>{
        const cursor =jobCollections.find();
        const result =await cursor.toArray();
        res.send(result)
    })
    app.get('/jobs/:id',async(req,res) =>{
      const id =req.params.id;
      const query ={_id:new ObjectId(id)}
      const result = await jobCollections.findOne(query);
      res.send(result)
    })

    app.get('/job-application',async(req,res) =>{
      const email =req.query.email;
      const query ={applicant_email:email};
      const result =await jobApplicatinCollection.find(query).toArray();
      res.send(result)
    })

    app.post('/job-application',async(req,res) =>{
      const application =req.body;
      const result = await jobApplicatinCollection.insertOne(application);
      res.send(result)
    })


  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req,res) =>{
    res.send('ami job pasi')
} )

app.listen(port,() =>{
    console.log(`job is waiting of ${port}`)
})