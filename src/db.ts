import { PrismaClient } from "@prisma/client";
import { DATABASE_URL, NODE_ENV } from "./env";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
  ],
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

(async () => {
  try {
    await prisma.$connect();
    console.log("Connected to db");
  } catch (error) {
    console.error("Error occured on db connection\n", error);
  }
})();

//? You can remove this if you don't want multiple logs in your console
prisma.$on("query", (e) => {
  if (NODE_ENV === "production") {
    console.log("--------------------------------------------------");
    console.log("Query: " + e.query);
    console.log("Params: " + e.params);
    console.log("Duration: " + e.duration + "ms");
    console.log("--------------------------------------------------");
  }
});
export default prisma;
