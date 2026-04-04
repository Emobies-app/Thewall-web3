export const config = {
  api: {
    bodyParser: true,
  },
};

export default function handler(req, res) {
  try {
    if (req.method === "POST") {
      console.log("BASE webhook received:", req.body);
      return res.status(200).json({ ok: true });
    }

    // For browser testing
    return res.status(200).send("Webhook endpoint is live");
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ ok: false });
  }
}
