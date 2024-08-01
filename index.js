const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Cashfree } = require('cashfree-pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Cashfree
Cashfree.XClientId = process.env.CLIENT_ID;
Cashfree.XClientSecret = process.env.CLIENT_KEY;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

function generateOrderId() {
  const uniqueId = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256');
  hash.update(uniqueId);
  const orderId = hash.digest('hex');
  return orderId.substr(0, 12);
}

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/payment', async (req, res) => {
  try {
    const { amount, customer_id, customer_phone, customer_name, customer_email } = req.body;

    const request = {
      order_amount: amount,
      order_currency: "INR",
      order_id: await generateOrderId(),
      customer_details: {
        customer_id,
        customer_phone,
        customer_name,
        customer_email
      }
    };

    const response = await Cashfree.PGCreateOrder("2023-08-01", request);
    console.log("Order Creation Response:", response.data);
    res.json(response.data);

  } catch (error) {
    console.error("Error in /payment:", error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Internal server error', error: error.response ? error.response.data : error.message });
  }
});

app.post('/verify', async (req, res) => {
  try {
    const { orderId } = req.body;
    const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
    res.json(response.data);

  } catch (error) {
    console.error("Error in /verify:", error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Internal server error', error: error.response ? error.response.data : error.message });
  }
});

app.listen(8000, () => {
  console.log('Server is running on port 8000');
});
