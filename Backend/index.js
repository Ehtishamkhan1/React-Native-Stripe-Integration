require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors());
app.use(bodyParser.raw({ type: 'application/json' })); 


const paymentStatuses = {};


app.post('/pay', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Name is required" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(10 * 100), // $10
            currency: "usd",
            payment_method_types: ["card"],
            metadata: { name },
        });

        const clientSecret = paymentIntent.client_secret;

        // Store initial payment status as pending
        paymentStatuses[clientSecret] = 'pending';

        res.json({ message: "Payment initiated", clientSecret });
    } catch (error) {
        console.error("Error creating PaymentIntent:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
});

app.post('/stripe', (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("Error validating webhook signature:", err.message);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }

    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('PaymentIntent was successful!', paymentIntent);
            paymentStatuses[paymentIntent.client_secret] = 'succeeded';
            break;
        case 'payment_intent.payment_failed':
            const failedPaymentIntent = event.data.object;
            console.log('Payment failed!', failedPaymentIntent);
            paymentStatuses[failedPaymentIntent.client_secret] = 'failed';
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

app.post('/check-payment', (req, res) => {
    const { clientSecret } = req.body;

    if (!clientSecret || !paymentStatuses[clientSecret]) {
        return res.status(404).json({ message: 'Payment status not found' });
    }

    const status = paymentStatuses[clientSecret];
    res.json({ status });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
