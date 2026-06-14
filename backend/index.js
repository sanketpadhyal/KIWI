import express from "express";
import cors from "cors";
import { db } from "./firebaseAdmin.js";

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AdSync Engine By Stack Smashers");
});

app.post("/engine", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userSnap.data() || {};
    const now = Date.now();
    const activity = user.activity || {};

    const views = [...new Set(activity.views || [])];
    const clicks = [...new Set(activity.clicks || [])];
    const cartAdd = [...new Set(activity.cartAdd || [])];
    const cartRemove = [...new Set(activity.cartRemove || [])];

    const airdrop = Array.isArray(user.airdrop) ? user.airdrop : [];
    const validAirdrops = airdrop.filter(
      (item) => item && item.expiresAt && item.expiresAt > now,
    );
    const activeAirdrop = validAirdrops.find((item) => item.expiresAt > now);

    if (activeAirdrop) {
      await userRef.set(
        {
          activity: {
            views: [],
            clicks: [],
            cartAdd: [],
            cartRemove: [],
          },
        },
        { merge: true },
      );

      return res.json({
        type: "active-airdrop",
        message: "You already have an active offer",
        productId: activeAirdrop.productId,
      });
    }

    const totalActivity =
      views.slice(-5).length +
      clicks.slice(-5).length +
      cartAdd.slice(-5).length +
      cartRemove.slice(-5).length;

    if (totalActivity < 5) {
      return res.json({
        type: "incomplete-cycle",
        message: "Complete 5 interactions to unlock smart ads",
      });
    }

    const productsSnap = await db.collection("products").get();

    if (productsSnap.empty) {
      return res.json({
        type: "no-products",
        message: "No products available",
      });
    }

    const products = productsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const scoreMap = {};
    const addScore = (id, value) => {
      if (!id) return;
      scoreMap[id] = (scoreMap[id] || 0) + value;
    };

    views.slice(-5).forEach((id) => addScore(id, 1));
    clicks.slice(-5).forEach((id) => addScore(id, 2));
    cartAdd.slice(-5).forEach((id) => addScore(id, 4));
    cartRemove.slice(-5).forEach((id) => addScore(id, 3));

    const sorted = Object.entries(scoreMap).sort((a, b) => b[1] - a[1]);
    let productId = sorted.length ? sorted[0][0] : null;

    if (!productId) {
      const preferred = products
        .filter((product) => (user.interestedIn || []).includes(product.category))
        .sort((a, b) => (b.offerPrice ? 1 : 0) - (a.offerPrice ? 1 : 0));

      productId = preferred[0]?.id;
    }

    if (!productId) {
      const fallback = products.sort(
        (a, b) => (b.offerPrice ? 1 : 0) - (a.offerPrice ? 1 : 0),
      );

      productId = fallback[0]?.id;
    }

    if (!productId) {
      return res.json({
        type: "no-product",
        message: "No product selected",
      });
    }

    const selectedProduct = products.find((product) => product.id === productId);
    const basePrice =
      selectedProduct?.offerPrice !== undefined &&
      selectedProduct?.offerPrice !== null
        ? Number(selectedProduct.offerPrice)
        : Number(selectedProduct.price);

    const score = scoreMap[productId] || 0;
    const discount =
      selectedProduct?.offerPrice !== undefined &&
      selectedProduct?.offerPrice !== null
        ? score >= 10
          ? 5
          : score >= 6
            ? 4
            : 3
        : score >= 10
          ? 7
          : score >= 6
            ? 6
            : 5;

    const finalPrice = Math.round(basePrice - (basePrice * discount) / 100);
    const expiresAt = now + 60 * 60 * 1000;
    const newAirdrop = {
      productId,
      expiresAt,
      discount,
      finalPrice,
    };

    await userRef.set(
      {
        airdrop: [...validAirdrops, newAirdrop],
        engine: {
          lastRecommendedProduct: productId,
          lastDiscount: discount,
          lastTriggerAt: now,
          cycleActive: false,
        },
        activity: {
          views: [],
          clicks: [],
          cartAdd: [],
          cartRemove: [],
        },
      },
      { merge: true },
    );

    return res.json({
      type: "success",
      productId,
      discount,
      finalPrice,
      expiresAt,
      message: "Ad unlocked using 5-layer behavioral engine",
    });
  } catch (error) {
    console.log("ENGINE ERROR:", error);

    return res.json({
      type: "safe-fallback",
      message: "Engine recovered safely",
    });
  }
});

app.post("/engine/reset", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    const userRef = db.collection("users").doc(userId);

    await userRef.set(
      {
        activity: {
          views: [],
          clicks: [],
          cartAdd: [],
          cartRemove: [],
        },
        airdrop: [],
        engine: {
          lastRecommendedProduct: null,
          lastDiscount: 0,
          lastTriggerAt: null,
          cycleActive: false,
        },
      },
      { merge: true },
    );

    res.json({ success: true });
  } catch (error) {
    console.log("RESET ERROR:", error);
    res.json({ success: false });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
