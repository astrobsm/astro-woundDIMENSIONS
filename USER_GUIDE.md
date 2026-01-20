# AstroWound-MEASURE User Guide

**AI-Powered Clinical Wound Assessment Application**

---

## 🚀 Getting Started

AstroWound-MEASURE is a clinical wound measurement and tracking application that uses AI to automatically detect and measure wounds from photographs. The app works offline and stores all data securely on your device.

---

## 📱 Main Features

### 1. Dashboard
The Dashboard is your home screen showing:
- **Total Patients** — Number of registered patients
- **Active Wounds** — Wounds currently being tracked
- **Healing Wounds** — Wounds showing improvement
- **Recent Activity** — Latest wound assessments

**Quick Actions:**
- **➕ New Patient** — Register a new patient
- **📷 New Capture** — Start a wound assessment
- **⚙️ Settings** — Access app settings

---

## 👤 Patient Management

### Adding a New Patient
1. From the Dashboard, tap **"+ New Patient"**
2. Fill in required information:
   - First Name & Last Name
   - Medical Record Number (MRN)
   - Date of Birth
   - Gender
3. Optional: Add contact info, medical history, and allergies
4. Tap **"Save Patient"**

### Viewing Patient Details
1. Tap on any patient from the Dashboard list
2. View patient information, active wounds, and assessment history
3. Use the **Edit** button (✏️) to update patient details

---

## 🩹 Wound Management

### Creating a New Wound Record
1. Open a patient's profile
2. Tap **"+ Add Wound"**
3. Select wound details:
   - **Type** — Pressure ulcer, diabetic ulcer, surgical wound, etc.
   - **Location** — Body location (sacrum, heel, ankle, etc.)
   - **Location Detail** — Specific area description
4. Add any relevant notes
5. Save the wound record

### Wound Status Types
| Status | Description |
|--------|-------------|
| **Active** | Wound requires ongoing treatment |
| **Healing** | Wound showing improvement |
| **Healed** | Wound has fully healed |
| **Worsening** | Wound condition is declining |

---

## 📷 Capturing Wound Images

### Before You Start
1. **Print the Calibration Ruler**
   - Go to **Settings → Calibration Kit**
   - Print at **100% scale** (no scaling)
   - Verify accuracy against a physical ruler

### Capture Process
1. From Dashboard, tap **"📷 New Capture"** or open a patient and select a wound
2. Select the patient (if not already selected)
3. Select an existing wound or create a new one
4. **Position the calibration ruler:**
   - Place ruler on the **same plane** as the wound
   - Position **2-5 cm** from wound edge
   - Ensure ruler is fully visible
5. Tap the **capture button** to take the photo
6. The AI will automatically:
   - Detect the calibration ruler
   - Segment the wound boundary
   - Calculate measurements

### Image Quality Tips
- ✅ Use good, even lighting
- ✅ Hold camera parallel to wound surface
- ✅ Keep the ruler and wound in sharp focus
- ✅ Avoid shadows across the wound
- ❌ Don't capture at steep angles

---

## 📏 Understanding Measurements

After capture, the app displays:

| Measurement | Description |
|-------------|-------------|
| **Area** | Total wound surface in cm² |
| **Length** | Longest axis measurement in cm |
| **Width** | Perpendicular to length in cm |
| **Perimeter** | Wound edge circumference in cm |
| **Depth** | Manual entry (if applicable) |
| **Volume** | Calculated if depth is provided |

### Manual Depth Entry
1. After AI measurement, tap **"Add Depth"**
2. Enter wound depth in centimeters
3. The app will calculate volume automatically

### Reviewing Results
- The wound boundary is shown with an overlay
- Review measurements and verify accuracy
- Add clinical notes if needed
- Tap **"Save Assessment"** to store the result

---

## 📊 Tracking Progress

### Patient Timeline
1. Open a patient profile
2. Tap on a wound to view its timeline
3. See all assessments in chronological order
4. Compare measurements over time

### Healing Trends
The app automatically tracks:
- 📈 **Improving** — Area decreasing >5%
- ➖ **Stable** — Minimal change
- 📉 **Worsening** — Area increasing >5%

---

## 📄 Generating Reports

### Available Report Types
1. **Single Assessment** — One measurement snapshot
2. **Progress Report** — Multiple assessments over time
3. **Discharge Summary** — Complete wound history

### Creating a Report
1. Open the wound timeline
2. Tap **"📄 Generate Report"**
3. Select report type
4. Enter clinician name and credentials
5. Tap **"Download PDF"**

Reports include:
- Patient demographics
- Wound information
- Measurement data
- Progress charts (for progress reports)
- Clinical notes

---

## ⚙️ Settings

### AI Model Management
- **Load Model** — Pre-load AI for faster captures
- **Unload Model** — Free up device memory

### Data Management
- **Export Data** — Download all data as JSON
- **Clear Data** — Remove all patient and wound data ⚠️

### Connection Status
- 🟢 **Online** — Connected to network
- 🔴 **Offline** — Working locally (data syncs when reconnected)

---

## 🔒 Privacy & Data

- All data is stored **locally on your device**
- The app works **fully offline**
- No patient data is sent to external servers
- Export data regularly for backup

---

## ❓ Troubleshooting

### Calibration Not Detected
- Ensure ruler is printed at 100% scale
- Check lighting — avoid glare on ruler
- Keep ruler flat and fully visible
- Hold camera steady and parallel

### AI Model Won't Load
- Check device has sufficient memory
- Try refreshing the app
- Clear browser cache if using web version

### Poor Measurement Accuracy
- Verify ruler calibration is accurate
- Ensure wound and ruler are on same plane
- Avoid capturing at angles
- Use consistent lighting

---

## 📞 Quick Reference

| Task | How To |
|------|--------|
| Add Patient | Dashboard → "+ New Patient" |
| New Capture | Dashboard → "📷 New Capture" |
| View Wounds | Patient Profile → Wound List |
| Generate Report | Wound Timeline → "Generate Report" |
| Print Ruler | Settings → "Calibration Kit" |
| Export Data | Settings → "Export Data" |

---

**Version:** 1.0.0  
**AstroWound-MEASURE** — Clinical Wound Assessment Made Simple
