# Textbook Studio 📚✨

**Textbook Studio** is an AI-powered platform that empowers educators, curriculum creators, and schools to convert raw teaching notes, scanned documents, and syllabus outlines into fully structured, curriculum-aligned, printable textbooks and exportable Word (.docx) documents.

---

## 🌟 Key Features

### 1. 🤖 AI-Powered Document Processing & OCR
- **Smart Note Extraction:** Drag-and-drop or upload scanned pages, notes, or PDFs.
- **Gemini AI Analysis:** Utilizes Google Gemini to automatically transcribe, structure, and categorize handwritten or typed lesson notes into structured weekly modules.

### 2. ✏️ Human-in-the-Loop Review Gate
- **Curriculum & Structure Review:** Teachers retain 100% control over the generated content before final publishing.
- **Weekly Lesson Editor:** Edit lesson topics, table sections, subheadings, key terms, summary points, and review questions.
- **Live Side-by-Side Preview:** Switch instantly between the rich structure editor and a formatted print-ready preview.

### 3. 📄 Export & Publishing Suite
- **Microsoft Word (.docx) Export:** Generates professionally styled `.docx` files with automated Table of Contents, formatted headers, structured tables, and cover pages.
- **Printable PDF Preview:** Render clean, beautifully formatted textbook pages directly in the browser for instant printing or saving as PDF.

### 4. 🗂️ Project & Glossary Management
- **Subject & Term Libraries:** Organize textbooks by Subject (e.g., Integrated Science, Mathematics), Class Level (e.g., JSS 1-3, SSS 1-3), and Academic Term.
- **Interactive Glossary & Terminology:** Maintain subject-specific glossaries that dynamically append to exported textbooks.
- **Author Profile & Branding:** Custom author details, school names, and publication metadata embedded in exported titles.

### 5. 🔐 Secure Multi-User Authentication & Cloud Storage
- **Firebase Authentication:** Seamless Sign In / Sign Up with Email/Password or Google OAuth.
- **Firestore Database Integration:** All textbook projects, scanned page records, and user custom preferences sync securely across devices in real time.

---

## 🛠️ Technology Stack

- **Frontend Framework:** React 18 (TypeScript) with Vite
- **Styling:** Tailwind CSS (Modern, ultra-clean light aesthetic with soft neutrals and pill navigation)
- **Icons:** Lucide React
- **AI Engine:** Google Gemini AI API (`@google/genai`)
- **Document Generators:** `docx` (Word processing), `jspdf` (PDF generation)
- **Backend & Persistence:** Firebase Auth & Firestore

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd textbook-studio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file based on `.env.example`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 📄 License

This project is licensed under the MIT License.
