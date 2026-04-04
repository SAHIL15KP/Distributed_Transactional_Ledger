const mongoose = require("mongoose");
const CONNECT_TIMEOUT_MS = 10000;

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://sahilexp1_db_user:MeCc4gn0yW6lSYFd@cluster0.zeldome.mongodb.net/paytm";

if (!global.mongooseCache) {
  global.mongooseCache = {
    conn: null,
    promise: null
  };
}

const mongooseCache = global.mongooseCache;

async function connectToDatabase() {
  if (mongooseCache.conn) {
    return mongooseCache.conn;
  }

  if (!mongooseCache.promise) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `MongoDB connection timed out after ${CONNECT_TIMEOUT_MS}ms. Check MONGODB_URI, network access, and Atlas IP allowlist settings.`
          )
        );
      }, CONNECT_TIMEOUT_MS);
    });

    mongooseCache.promise = Promise.race([
      mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 5000
      }),
      timeoutPromise
    ]).catch((error) => {
      mongooseCache.promise = null;
      throw error;
    });
  }

  mongooseCache.conn = await mongooseCache.promise;
  return mongooseCache.conn;
}

// Create a Schema for Users
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: 3,
        maxLength: 254
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    }
});

const accountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to User model
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        required: true
    }
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Account = mongoose.models.Account || mongoose.model("Account", accountSchema);

module.exports = {
	connectToDatabase,
	User,
    Account
};
