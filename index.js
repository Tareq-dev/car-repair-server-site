const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

//Verify token

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  // console.log(token);
  jwt.verify(token, process.env.ACCESS_KEY_ID, (err, decoded) => {
    if (err) {
      res.status(403).send({ message: "Forbidded access" });
    }
    // console.log("decoded", decoded);
    req.decoded = decoded;
    next();
  });
}

app.get("/", (req, res) => {
  res.send("Running Car Repair");
});
app.get("/heroku", (req, res) => {
  res.send("Hero Meets heroku");
});


//connect MONGODB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5hqwk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("carRepair").collection("service");
    const orderCollection = client.db("carRepair").collection("order");

    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    //POST

    app.post("/service", async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });

    // DELETE

    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });

    //order collection
    app.get("/order", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      } else {
        res.status(403).send({ message: "Forbidden access" });
      }
    });

    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    //auth JWT
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_KEY_ID, {
        expiresIn: "1d",
      });
      res.send(accessToken);
    });
  } finally {
    //
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("Listening to port", port);
});
