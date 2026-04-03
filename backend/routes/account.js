// backend/routes/account.js
const express = require('express');
const { authMiddleware } = require('../middleware');
const { Account } = require('../db');

const router = express.Router();

router.get("/balance", authMiddleware, async (req, res) => {
    const account = await Account.findOne({
        userId: req.userId
    });

    res.json({
        balance: account.balance
    })
});

router.post("/transfer", authMiddleware, async (req, res) => {
    const amount = Number(req.body.amount);
    const { to } = req.body;

    if (!to || Number.isNaN(amount) || amount <= 0) {
        return res.status(400).json({
            message: "Enter a valid transfer amount"
        });
    }

    if (String(req.userId) === String(to)) {
        return res.status(400).json({
            message: "You cannot transfer money to yourself"
        });
    }

    const debitedAccount = await Account.findOneAndUpdate(
        {
            userId: req.userId,
            balance: { $gte: amount }
        },
        {
            $inc: { balance: -amount }
        },
        {
            new: true
        }
    );

    if (!debitedAccount) {
        return res.status(400).json({
            message: "Insufficient balance"
        });
    }

    const creditedAccount = await Account.findOneAndUpdate(
        {
            userId: to
        },
        {
            $inc: { balance: amount }
        },
        {
            new: true
        }
    );

    if (!creditedAccount) {
        await Account.updateOne(
            { userId: req.userId },
            { $inc: { balance: amount } }
        );

        return res.status(400).json({
            message: "Invalid account"
        });
    }

    res.json({
        message: "Transfer successful"
    });
});

module.exports = router;
