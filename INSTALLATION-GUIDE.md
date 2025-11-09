# 🚀 Installation & Setup Guide

## Coupon Management API - Complete Setup Documentation

---

## 📋 Table of Contents

1. [Pre-requirements](#pre-requirements)
2. [System Installation](#system-installation)
3. [Project Setup](#project-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running the Project](#running-the-project)
6. [Testing](#testing)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)
9. [API Usage Examples](#api-usage-examples)

---

## ✅ Pre-requirements

Before starting, ensure you have the following installed on your computer:

### 1. Node.js (v14 or higher)

**Windows/Mac/Linux:**
- Download from: https://nodejs.org/
- Download the LTS (Long Term Support) version
- Run the installer and follow the setup wizard

**Verify installation:**
```bash
node --version
npm --version
```

You should see version numbers (e.g., v18.12.0)

### 2. Git

**Windows/Mac/Linux:**
- Download from: https://git-scm.com/
- Run the installer with default settings

**Verify installation:**
```bash
git --version
```

You should see a version number (e.g., git version 2.40.0)

### 3. MongoDB Atlas Account

**Create free account:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Sign Up"
3. Create an account with email/password
4. Verify your email

**Create a cluster:**
1. Click "Create a deployment"
2. Select "M0 Free" tier (free forever)
3. Choose your cloud provider (AWS/Google/Azure)
4. Select a region near you
5. Click "Create Cluster"
6. Wait 3-5 minutes for cluster to be created

**Get connection string:**
1. Click "Connect" on your cluster
2. Click "Connect your application"
3. Copy the connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database`)
4. Save this for later

### 4. Text Editor / IDE (Optional but recommended)

- **VS Code**: https://code.visualstudio.com/ (recommended)
- **WebStorm**: https://www.jetbrains.com/webstorm/
- **Sublime Text**: https://www.sublimetext.com/

---

## 🖥️ System Installation

### Step 1: Install Node.js

**Windows:**
1. Download from https://nodejs.org/
2. Double-click the `.msi` file
3. Follow the installer steps
4. Keep default settings
5. Click "Finish"

**Mac:**
1. Download from https://nodejs.org/
2. Double-click the `.pkg` file
3. Follow the installer steps
4. Click "Finish"

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2: Install Git

**Windows:**
1. Download from https://git-scm.com/download/win
2. Double-click the `.exe` file
3. Follow the installer (keep defaults)
4. Click "Finish"

**Mac:**
```bash
brew install git
```

**Linux:**
```bash
sudo apt-get install git
```

### Step 3: Verify both are installed

Open terminal/command prompt and run:

```bash
node --version
npm --version
git --version
```

You should see three version numbers.

---

## 📦 Project Setup

### Step 1: Clone the Repository

Open terminal/command prompt and run:

```bash
git clone https://github.com/BhanuSurisetty/coupon-management-api.git
```

This will download the project to your computer.

### Step 2: Navigate to project folder

```bash
cd coupon-management-api
```

### Step 3: Install dependencies

```bash
npm install
```

This will install all required packages. Takes 2-5 minutes depending on internet speed.

---

## 🔧 Environment Configuration

### Step 1: Create `.env` file

In the project folder, create a new file named `.env` (note: starts with a dot)

**On Windows:**
- Open Notepad
- Paste the content below
- File → Save As
- Filename: `.env` (with the dot)
- Save location: Your project root folder
- File type: All Files (not .txt)

**On Mac/Linux:**
```bash
touch .env
```

### Step 2: Add configuration to `.env`

Open `.env` file and add:

```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/coupons?retryWrites=true&w=majority
PORT=3000
NODE_ENV=development
```

**Replace `username:password@cluster0.xxxxx` with your MongoDB connection string**

Example (this is just for reference, use your actual string):
```
MONGODB_URI=mongodb+srv://user123:pass456@cluster0.rimlinb.mongodb.net/coupons?retryWrites=true&w=majority
PORT=3000
NODE_ENV=development
```

### Step 3: Verify `.env` file exists

Run in terminal:

```bash
cat .env
```

You should see the contents you added.

---

## ▶️ Running the Project

### Start the development server

Run in terminal:

```bash
npm run dev
```

You should see output like:

```
✓ Server running on port 3000
✓ Connected to MongoDB
```

If successful, your API is now running locally!

---

## 🧪 Testing

### Run Unit Tests

In another terminal (keep server running), run:

```bash
npm test discountCalculator.test.js
```

You should see:

```
PASS  tests/discountCalculator.test.js
  ✓ All tests passed (27/27)
```

### Test API endpoints with Postman

1. Download Postman from https://www.postman.com/downloads/
2. Open Postman
3. Create new request:
   - **Method:** POST
   - **URL:** http://localhost:3000/coupons
   - **Headers:** Content-Type: application/json
   - **Body (raw JSON):**
   ```json
   {
     "code": "TEST_COUPON",
     "type": "CART_WISE",
     "discount": {"type": "PERCENTAGE", "value": 10},
     "conditions": {"minimum_cart_value": 100}
   }
   ```
4. Click "Send"

You should get a `201 Created` response.

---

## ✅ Verification

### Verify server is running

Open your browser and go to:

```
http://localhost:3000
```

You might see a 404 (which is fine - the root path doesn't have a response).

### Verify MongoDB connection

Check terminal output. You should see:

```
✓ Connected to MongoDB
```

### Verify API is working

Using Postman or curl:

```bash
curl http://localhost:3000/coupons
```

You should get a response (likely an empty array or some coupons).

---

## 🔍 Troubleshooting

### Error: `Cannot find module 'express'`

**Solution:**
```bash
npm install
```

### Error: `MONGODB_URI is not set`

**Solution:**
Check your `.env` file has the correct `MONGODB_URI` value.

### Error: `Port 3000 is already in use`

**Solution:**
Change PORT in `.env` to another number like 3001 or 5000.

### MongoDB connection times out

**Solution:**
1. Verify MongoDB URI is correct
2. Check internet connection
3. Whitelist your IP in MongoDB Atlas:
   - Go to https://cloud.mongodb.com/
   - Click "Security" → "Network Access"
   - Click "Add IP Address"
   - Add your IP or "Allow access from anywhere"

### npm install fails

**Solution:**
```bash
npm cache clean --force
npm install
```

---

## 📡 API Usage Examples

### Create a Coupon

```bash
curl -X POST http://localhost:3000/coupons \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUMMER25",
    "type": "CART_WISE",
    "discount": {"type": "PERCENTAGE", "value": 10},
    "conditions": {"minimum_cart_value": 100}
  }'
```

### Get All Coupons

```bash
curl http://localhost:3000/coupons
```

### Check Applicable Coupons

```bash
curl -X POST http://localhost:3000/coupons/check/applicable \
  -H "Content-Type: application/json" \
  -d '{
    "cartItems": [
      {"product_id": "P1", "price": 150, "quantity": 2}
    ]
  }'
```

### Apply Coupon

```bash
curl -X POST http://localhost:3000/coupons/{couponId}/apply \
  -H "Content-Type: application/json" \
  -d '{
    "cartItems": [
      {"product_id": "P1", "price": 150, "quantity": 2}
    ]
  }'
```

Replace `{couponId}` with actual coupon ID from the create response.

---

## 📝 Quick Checklist

- [ ] Node.js installed (check with `node --version`)
- [ ] Git installed (check with `git --version`)
- [ ] Project cloned (`git clone ...`)
- [ ] Dependencies installed (`npm install`)
- [ ] MongoDB cluster created on Atlas
- [ ] `.env` file created with MONGODB_URI
- [ ] Server running (`npm run dev`)
- [ ] Tests passing (`npm test`)
- [ ] Can access http://localhost:3000

---

## 🎉 You're Ready!

Your Coupon Management API is now set up and running!

**Next steps:**
1. Use Postman to test API endpoints
2. Review API documentation in README.md
3. Explore the source code
4. Make your own modifications
5. Deploy to production when ready

---

## 📞 Support

If you encounter issues:

1. Check the Troubleshooting section above
2. Review error messages carefully
3. Check MongoDB connection
4. Verify `.env` file has correct values
5. Check internet connection

---

**Happy coding! 🚀**

Last Updated: November 9, 2025