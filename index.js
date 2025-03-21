const express = require('express');
const cors = require('cors');
const jwt =require('jsonwebtoken');
const cookieParser=require('cookie-parser')
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
}));
app.use(express.json());
app.use(cookieParser())
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const logger =(req,res,next) =>{
  console.log('insate user loger');
  next()
}
const varifyToken =(req,res,next) =>{
  const token =req.cookies?.token;
  if(!token){
    return req.status(401).send({message:'Unauthorized access'})
  }

  jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
    if(err){
      return res.status(401).send({message:'Authorage Access'})
    }
    req.user=decoded
    next()
  })


}

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

    const jobCollections = client.db('job-portal-1').collection('jobs');
    const jobApplicatinCollection = client.db('job-portal-1').collection('job-application');

    app.post('/jwt',async(req,res) =>{
      const user =req.body;
      const token =jwt.sign(user,process.env.JWT_SECRET,{expiresIn:'1hr'});
      res
      .cookie('token',token,{
        httpOnly:true,
        secure:false, // http://localhost:5173/signin
      })
      .send({success:true})
      console.log(token)
    })

    app.get('/jobs',logger, async (req, res) => {

      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email }
      }

      const cursor = jobCollections.find(query);
      const result = await cursor.toArray();
      res.send(result)
    })



    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobCollections.findOne(query);
      res.send(result)
    })

    app.post('/jobs', async (req, res) => {
      const newJob = req.body;
      const result = await jobCollections.insertOne(newJob);
      res.send(result)
    })

    app.get('/job-application/jobs/:job_id', async (req, res) => {
      const jobId = req.params.job_id;
      const query = { job_id: jobId };
      const result = await jobApplicatinCollection.find(query).toArray();
      res.send(result)
    })

    app.get('/job-application',varifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email };
      const result = await jobApplicatinCollection.find(query).toArray();

      if(req.user.email !== req.query.email){
        // return res.status(404).send({message:'forbenden'})
      }

      console.log('cookis data',req.cookies)

      for (application of result) {
        console.log(application.job_id);
        const query1 = { _id: new ObjectId(application.job_id) }
        const job = await jobCollections.findOne(query1);
        if (job) {
          application.title = job.title;
          application.company = job.company;
          application.location = job.location;
          application.company_logo = job.company_logo
        }
      }
      res.send(result)

    })

    app.get('/job-application/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobApplicatinCollection.findOne(query);
      res.send(result)
    })

    app.post('/job-application', async (req, res) => {
      const application = req.body;
      const result = await jobApplicatinCollection.insertOne(application);


      const id = application.job_id;
      const query = { _id: new ObjectId(id) }
      const job = await jobCollections.findOne(query);
      console.log(job)
      let newCount = 0;
      if (job.applicationCount) {
        newCount = job.applicationCount + 1
      }
      else {
        newCount = 1
      }
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          applicationCount: newCount
        }
      }
      const updateResult = await jobCollections.updateOne(filter, updatedDoc)
      res.send(result)

    })

    app.patch('/job-application/:id', async (req, res) => {
      const id = req.params.id;
      const data =req.body;
      const filter = { _id: new ObjectId(id) }
      const updateDoc ={
        $set:{
          status:data.status
        }
      }
      const result =await jobApplicatinCollection.updateOne(filter,updateDoc);
      res.send(result)
    })

    app.delete('/job-application/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobApplicatinCollection.deleteOne(query);
      res.send(result)
    })


  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('ami job pasi')
})

app.listen(port, () => {
  console.log(`job is waiting of ${port}`)
})