# 🥝 Kiwi — Powered by AdSync Engine

> A next-gen smart eCommerce platform that understands user behavior and delivers personalized product ads with dynamic pricing.

---

## 🚨 Hackathon Notice

> ⚡ This project was built for **KBT Nashik Hackathon**  
> 👥 Team: **Stack Smashers**  
> 🔓 This project is OpenSourced.
> ❎ This Project is not selected.

---

## 🧠 What is Kiwi?

Kiwi is not a normal eCommerce website.

It is a **behavior-driven intelligent shopping system** powered by our custom-built **AdSync Engine**, which tracks user interactions and shows highly relevant product offers.

---

## ⚡ Core Idea

> “Show the right product to the right user at the right time — with the right price.”

---

## 🔥 Key Features

### 🧠 AdSync Engine (Core Innovation)

* Tracks real-time user behavior  
* Uses a scoring system to detect interest  
* Runs on a **5-layer interaction cycle**  
* Resets after each cycle for accuracy  

---

### 🎯 Behavior Tracking System

Tracks:

* 👁️ Product Views  
* 👆 Clicks  
* 🛒 Add to Cart  
* ❌ Remove from Cart  

Each action contributes to a **score-based engine**

---

### ⚡ Smart Product Detection

* Identifies most relevant product using scoring  
* Prioritizes:
  * High interaction products  
  * User preferred categories  

---

### 💸 Dynamic Pricing System

* Personalized discounts based on interest level  

| Scenario                   | Discount   |
|--------------------------|----------|
| High Interest            | up to 20%  |
| Medium Interest          | ~10–15%    |
| Already Discounted Product | extra 3–5% |

✅ Always applies discount on **offerPrice if available**  
❌ Never uses original price incorrectly  

---

### 🎁 Airdrop Offer System

* Selected product is sent as a **limited-time offer**  
* Duration: **1 hour**  
* Stored in user’s cart as an **airdrop**  

---

### 🔁 Smart Cycle Reset

After an ad is generated:

* Clears all activity data  
* Prevents biased recommendations  
* Starts fresh tracking cycle  

---

### 🛡️ Secure Backend System

* Built with **Node.js + Express**  
* Uses **Firebase Firestore**  
* Role-based data protection  
* Backend-driven logic (no frontend manipulation)  

---

## 🏗️ Tech Stack

### Frontend

* React.js  
* CSS  
* Firebase SDK  

### Backend

* Node.js  
* Express.js  
* Firebase Admin SDK  

### Database

* Firebase Firestore  

---

## ⚙️ How It Works

1. User interacts with products  
2. System tracks last 5 actions  
3. Assigns scores to products  
4. Finds highest scoring product  
5. Applies dynamic pricing  
6. Sends product as a timed **airdrop**  
7. Clears activity → restarts cycle  

---

## 🚀 Getting Started

### 🔹 Frontend

cd frontend  
npm install  
npm start  

### 🔹 Backend

cd backend  
npm install  
node index.js  

---

## 🌐 Deployment

Frontend:

npm run build  
serve -s build  

Backend:

* Hosted on Google Cloud / Replit  

---

## 🧪 Demo Flow

1. Open products  
2. Interact with 5 items  
3. Click **“Show Ad”**  
4. Watch:
   * Smart product selection  
   * Dynamic pricing  
   * Airdrop system  

---

## 🏆 Why This Project Stands Out

* Not a basic eCommerce clone  
* Real-time behavioral intelligence  
* Personalized marketing engine  
* Dynamic pricing logic  
* Clean backend architecture  

---

## 📈 Future Scope

* AI-based recommendation enhancement  
* Real-time analytics dashboard  
* Multi-user segmentation  
* Advanced pricing algorithms  

---

## 👨‍💻 Developers

### 🚀 Leadership

Driving product direction, development pace, and execution across the Kiwi storefront and AdSync workflow.

**Team Leader**  
**Sanket Prashant Padhyal**  
Full Stack Developer • CSE • First Year  

---

### ⚙️ Execution Team

Supporting research, interface refinement, backend hosting, and the broader delivery of the hackathon product.

**Research Support**  
Jidnyasa Chandrakant Nil  
Images generation • CSE • First Year  

**UI/UX Support**  
Aarushi Mahendra Chaudhari  
Helped in UI/UX • CSE • First Year  

**Backend Hosting**  
Harshada Avinash Patil  
Hosted and managed backend • DS • First Year  

---

## 💡 Final Thought

> “This project transforms traditional eCommerce into an intelligent system that adapts to user behavior in real-time, making digital marketing more precise, efficient, and impactful.”

---

⭐ If you like this project, give it a star!
