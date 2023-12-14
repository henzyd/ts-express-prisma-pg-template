import { NODE_ENV, PORT } from "./env";
import "./db";
import app from "./app";

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT} at ${NODE_ENV}`);
});
