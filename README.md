# 🏥 Decentralized Healthcare Management System using Blockchain

A decentralized healthcare management system (DApp) built using blockchain technology to securely manage patient records, doctor access, telemedicine consultations, and secure medical data sharing.

This project ensures:

* Secure and immutable storage of patient data
* Doctor verification and controlled access
* Patient-owned medical records
* NFT-based access permissions
* Telemedicine and AI assistant support

---

## 📌 Project Overview

Traditional healthcare systems use centralized servers that are vulnerable to:

* Data breaches
* Unauthorized access
* Record tampering
* Single point of failure

This project solves these problems using Ethereum blockchain and smart contracts.

The system allows patients, doctors, and administrators to interact securely through a decentralized application.

---

## 🎯 Objectives

* Secure storage of patient medical records
* Decentralized access control
* Prevent unauthorized doctor access
* Enable doctor verification
* Maintain transparency and trust
* Support future healthcare technologies

---

## 🚀 Main Features

### 👤 Patient Module

* Register as a patient
* View profile and medical details
* View total medical records
* Grant or revoke doctor access
* Access telemedicine services

### 🩺 Doctor Module

* Register with name, specialization, and license
* Wait for admin verification
* View authorized patient records
* Add new medical records
* Join telemedicine meetings

### 🛠️ Admin Module

* Verify registered doctors
* Manage the system securely
* Control doctor approvals

### 🔗 Blockchain Features

* Smart contract-based data storage
* Immutable patient records
* Event logging for all actions
* Ethereum wallet authentication

---

## 🆕 Advanced Features

### 📞 Telemedicine

* Patients can request appointments
* Doctors can approve appointments
* Online consultation using meeting links
* Remote healthcare access

### 🪙 NFT-Based Access Control

* Patients can receive NFT access tokens
* Doctors need valid NFT permission to access records
* Better privacy and secure authorization

### 🤖 AI Health Assistant

* Provides basic health suggestions
* Helps users understand symptoms
* Future-ready AI support module

### ☁️ IPFS Integration

* Store large medical files securely
* Reduce blockchain storage cost
* Retrieve files using hash references

---

## 🏗️ Tech Stack

| Layer                 | Technology |
| --------------------- | ---------- |
| Frontend              | React.js   |
| Blockchain            | Ethereum   |
| Smart Contracts       | Solidity   |
| Web3 Integration      | Web3.js    |
| Development Framework | Truffle    |
| Local Blockchain      | Ganache    |
| Wallet                | MetaMask   |
| File Storage          | IPFS       |

---

## 📂 Project Structure

```text
healthcare-dapp/
├── contracts/
│   ├── Healthcare.sol
│   ├── Telemedicine.sol
│   └── AccessNFT.sol
│
├── migrations/
│   ├── 2_deploy_contracts.js
│   └── 3_deploy_access_and_healthcare.js
│
├── client/
│   └── src/
│       ├── components/
│       │   ├── Doctor.js
│       │   ├── Patient.js
│       │   ├── Navbar.js
│       │   ├── ProtectedRoute.js
│       │   └── EventViewer.js
│       │
│       ├── pages/
│       │   ├── Admin.js
│       │   ├── DoctorPage.js
│       │   ├── PatientPage.js
│       │   ├── LoginPage.js
│       │   ├── RegisterChoice.js
│       │   ├── MeetingRoom.js
│       │   └── AIHealthAssistant.js
│       │
│       ├── contracts/
│       ├── utils/
│       ├── App.js
│       ├── contractConfig.js
│       └── ipfs.js
│
├── build/contracts/
├── test/
├── truffle-config.js
└── README.md
```

---

## ⚙️ Installation and Setup

### Prerequisites

* Node.js
* npm
* MetaMask browser extension
* Ganache
* Truffle

Install Truffle globally:

```bash
npm install -g truffle
```

---

## ▶️ Run the Project

### 1. Clone Repository

```bash
git clone https://github.com/your-username/decentralized-healthcare-dapp.git
cd decentralized-healthcare-dapp
```

### 2. Install Dependencies

```bash
cd client
npm install
```

### 3. Start Ganache

* Open Ganache
* Start a local Ethereum blockchain
* Use port `7545`

### 4. Deploy Smart Contracts

```bash
truffle compile
truffle migrate --reset
```

### 5. Configure MetaMask

* Connect MetaMask to Ganache
* RPC URL: `http://127.0.0.1:7545`
* Chain ID: `1337`
* Import Ganache account private key

### 6. Start Frontend

```bash
cd client
npm start
```

Open:

```text
http://localhost:3000
```

---

## 🔐 Important Smart Contract Functions

### Healthcare.sol

* `registerPatient(name, age, gender)`
* `registerDoctor(name, specialization, license)`
* `authorizeDoctor(address)`
* `addRecord(patientAddress, record)`
* `getRecords(patientAddress)`
* `revokeDoctor(address)`

### Telemedicine.sol

* `requestAppointment()`
* `approveAppointment()`
* `completeAppointment()`
* `payConsultation()`
* `rateDoctor()`

### AccessNFT.sol

* `mintAccessNFT()`
* `verifyNFTAccess()`

---

## 🔒 Security Features

* Role-based access control
* Patient-controlled authorization
* Ethereum wallet-based identity
* Immutable blockchain storage
* Smart contract validation
* NFT-secured permissions

---

## ✅ Advantages

* No central authority
* Tamper-proof medical records
* Full transparency
* Better patient privacy
* Secure doctor verification
* Easy remote consultation

---

## ⚠️ Limitations

* Blockchain gas fees
* Requires MetaMask
* Large files should be stored in IPFS
* Local Ganache network only

---

## 🔮 Future Enhancements

* Deploy on Ethereum testnet
* Mobile application support
* Advanced AI diagnostics
* Video call integration
* QR-based hospital authentication
* Multi-hospital integration

---

## 📸 Screenshots

Add screenshots of:

* Login Page
* Patient Dashboard
* Doctor Dashboard
* Admin Verification Panel
* Telemedicine Appointment Screen

---

## 👨‍💻 Author

Varun
Blockchain Healthcare DApp Project

---

## 📌 Conclusion

This project demonstrates how blockchain technology can revolutionize healthcare by providing secure, decentralized, transparent, and patient-controlled medical record management.
