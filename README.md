# ☁️ S3 CloudDrive - Secure AWS S3 Management System

A production-grade, Google Drive-style web application for managing AWS S3 Buckets and Access Point Aliases. Built with **React 18**, **Vite**, **Lucide Icons**, **Express.js**, and **AWS SDK v3**.

---

## 🔒 Security & Architecture Overview

S3 CloudDrive uses a **100% Production-Secure Backend Proxy Architecture**:
- **Zero Client Key Exposure**: AWS Access Keys (`AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`) are kept strictly server-side inside `server.js` / `.env`.
- **Short-Lived S3 Presigned URLs**: Uploads use temporary S3 Presigned `PUT` URLs (valid 15 mins). Downloads and view links use temporary S3 Presigned `GET` URLs.
- **Fail-Safe Demo Mode**: Automatically activates interactive demo mode if server connectivity or credentials are unavailable.

---

## ✨ Features

- 📁 **Folder & Object Management**: Create virtual directories, list contents, calculate recursive folder sizes, and perform recursive folder deletions.
- 📦 **Download Entire Folder (.zip)**: Client and server streaming of folder directory trees into compressed `.zip` archives.
- 🔗 **Presigned URL Generator**: Generate shareable download links with customizable expiry times (1 hour to 7 days).
- 🎨 **Google Drive UI/UX**: Dark/Light mode toggle, Search filtering, Category filters (Images, Docs, Videos, Audio, Code, Archives), Grid and List Table views.
- 🐳 **Docker Ready**: Multi-stage build Dockerfile, Docker Compose orchestration, and Nginx SPA routing.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js `>= 18.x`
- npm `>= 9.x`

### 2. Installation
```bash
git clone https://github.com/therahulpatil/S3-Drive.git
cd S3-Drive
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
AWS_BUCKET_NAME=therahulpatil-s3-dri-rcon1rds9z49mbwho9zdezjgojrkqaps3b-s3alias
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=YOUR_IAM_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_IAM_SECRET_KEY
PORT=5000
```

### 4. Running Servers
```bash
# Terminal 1: Start Express API Backend (Port 5000)
npm run server

# Terminal 2: Start Vite Dev Server (Port 3000)
npm run dev
```

Open **`http://localhost:3000`** in your browser.

---

## 🐳 Docker Deployment

Deploy full-stack production containers in 1 command:

```bash
docker compose up -d --build
```

Access the deployed application at **`http://localhost:8080`**.

---

## 🛡️ Required AWS IAM Policy

Attach the AWS managed policy `AmazonS3FullAccess` or assign custom IAM permissions to your user:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

---

## 📄 License
Licensed under the [MIT License](LICENSE).
