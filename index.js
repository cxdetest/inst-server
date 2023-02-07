const mongoose = require("mongoose");
const { ApolloServer } = require("apollo-server");
const typeDefs = require("./gql/schema");
const resolvers = require("./gql/resolver");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: ".env" });

mongoose.connect(
  process.env.BBDD,
  /*   {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
    useCreateIndex: true,
  }, */
  (err, _) => {
    if (err) {
      console.log("error de coneccion");
    } else {
      server();
    }
  }
);

function server() {
  const serverApollo = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const token = req.headers.authorization;

      if (token) {
        try {
          const jwtoken = jwt.verify(
            token.replace("Bearer", ""),
            process.env.SECRET_KEY
          );
          return {
            user,
          };
        } catch (error) {
          console.log(error);
          throw new Error("Token invalido");
        }
      }
    },
  });

  serverApollo.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`server on ${url}`);
  });
}
