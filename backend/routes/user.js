// backend/routes/user.js
const express = require('express');

const router = express.Router();
const zod = require("zod");
const { User, Account } = require("../db");
const jwt = require("../jwt");
const { JWT_SECRET } = require("../config");
const  { authMiddleware } = require("../middleware");

const emailSchema = zod
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(254, "Email address must be 254 characters or fewer")
    .transform((value) => value.toLowerCase());

const firstNameSchema = zod
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or fewer");

const lastNameSchema = zod
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name must be 50 characters or fewer");

const passwordSchema = zod
    .string()
    .min(6, "Password must be at least 6 characters");

const signupBody = zod.object({
    username: emailSchema,
	firstName: firstNameSchema,
	lastName: lastNameSchema,
	password: passwordSchema
});

function getZodErrorMessage(error) {
    return error.issues?.[0]?.message || "Incorrect inputs";
}

function getMongooseErrorMessage(error) {
    if (error?.name === "ValidationError") {
        const firstValidationError = Object.values(error.errors || {})[0];
        return firstValidationError?.message || "Invalid account details";
    }

    if (error?.code === 11000) {
        return "Email already taken";
    }

    return null;
}

router.post("/signup", async (req, res) => {
    const parsedBody = signupBody.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({
            message: getZodErrorMessage(parsedBody.error)
        })
    }

    const { username, firstName, lastName, password } = parsedBody.data;

    try {
        const existingUser = await User.findOne({
            username
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already taken"
            });
        }

        const user = await User.create({
            username,
            password,
            firstName,
            lastName,
        });
        const userId = user._id;

        await Account.create({
            userId,
            balance: 1 + Math.random() * 10000
        });

        const token = jwt.sign({
            userId: userId.toString()
        }, JWT_SECRET);

        res.json({
            message: "User created successfully",
            token: token
        });
    } catch (error) {
        const message = getMongooseErrorMessage(error);

        if (message) {
            return res.status(400).json({
                message
            });
        }

        console.error("Failed to create account", error);
        return res.status(500).json({
            message: "Unable to create account right now"
        });
    }
});


const signinBody = zod.object({
    username: emailSchema,
	password: passwordSchema
});

router.post("/signin", async (req, res) => {
    const parsedBody = signinBody.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({
            message: getZodErrorMessage(parsedBody.error)
        })
    }

    const { username, password } = parsedBody.data;

    const user = await User.findOne({
        username,
        password
    });

    if (user) {
        const token = jwt.sign({
            userId: user._id.toString()
        }, JWT_SECRET);
  
        res.json({
            token: token
        })
        return;
    }

    
    res.status(401).json({
        message: "Error while logging in"
    })
})

const updateBody = zod.object({
	password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
})

router.put("/", authMiddleware, async (req, res) => {
    const { success } = updateBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Error while updating information"
        })
    }

    await User.updateOne({
        _id: req.userId
    }, req.body)

    res.json({
        message: "Updated successfully"
    })
})

router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})

module.exports = router;
