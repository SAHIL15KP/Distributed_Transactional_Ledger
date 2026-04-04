// backend/index.js
const express = require('express');
const cors = require("cors");
const rootRouter = require("./routes/index");
const { connectToDatabase } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/v1", rootRouter);

async function startServer() {
    await connectToDatabase();

    const server = app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });

    server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
            console.error(`Port ${PORT} is already in use. Stop the process using that port or run with PORT set to a different value.`);
            process.exit(1);
        }

        console.error("Failed to start HTTP server", error);
        process.exit(1);
    });
}

startServer().catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
});
