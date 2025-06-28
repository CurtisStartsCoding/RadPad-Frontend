Variant 1: Stacked with Gaps

text
First Name
john
Last Name
smith
Date of Birth
01/01/1999
...
Continue to Insurance

Patient has insurance [x]
Primary Insurance
Insurance Company: UnitedHealthcare
Plan Name: Gold PPO
Policy Number: UHC-123456
Group Number: GRP-98765
Policy Holder Name
john smith
Relationship to Patient
Self
Policy Holder Date of Birth
01/01/1999

Secondary Insurance (Optional)
+ Add Secondary Insurance

Back
Save Patient Info
Submit Order

Variant 2: Mashed Horizontal

text
First Name:john Last Name:smith DOB:01/01/1999... Email:test.scheduler@example.com
INSURANCE: Patient has insurance (YES) Primary: UnitedHealthcare Gold PPO Policy#UHC-123456 Group#GRP-98765 PH:john smith (Self) DOB:01/01/1999
Secondary: [Add] Back Save Submit

Variant 3: Broken Table Format

text
Field               Value
First Name          john
Last Name           smith
...
Insurance Status    Insured
Primary Insurer     UnitedHealthcare
Plan                Gold PPO
Policy Number       UHC-123456
Group Number        GRP-98765
Policy Holder       john smith
Relationship        Self
PH DOB              01/01/1999

[Add Secondary Insurance]
[Back] [Save] [Submit]

Variant 4: Minimalist Compression

text
john smith 01/01/1999 F 123 Medical Blvd FL 33905 (443)602-6207 test@example.com
INS: UHC GoldPPO UHC-123456 GRP-98765 Self 01/01/1999
+AddSecondary
Save Submit

Variant 5: Mixed Fields with Artifacts

text
Continue to Insurance [clicked]
Patient has insurance: ☑ Yes

Insurance Company:
UnitedHealthcare
Plan Name: Gold PPO
Policy Number: UHC-123456
Group Number: GRP-98765

Policy Holder Name
john smith
(Relationship: Self)

PH DOB: 01/01/1999

Secondary? [ + Add Secondary Insurance ]

[← Back] [💾 Save Patient Info] [✔ Submit Order]

Variant 6: Web Form Artifacts

text
<div id="patient-info">
First Name: <span class="value">john</span>
Last Name: <span class="value">smith</span>
...
</div>

<div class="insurance-section">
<h3>Primary Insurance</h3>
<ul>
<li>Company: UnitedHealthcare</li>
<li>Plan: Gold PPO</li>
<li>Policy #: UHC-123456</li>
<li>Group #: GRP-98765</li>
</ul>
Policy Holder: john smith (Self, DOB 01/01/1999)
</div>

<button id="add-secondary">+ Add Secondary Insurance</button>

<div class="form-actions">
<button class="back">← Back</button>
<button class="save">💾 Save</button>
<button class="submit">✔ Submit Order</button>
</div>

Variant 7: OCR-Style Mess

text
F1rst N@me: j0hn
L4st N@me: sm!th
...
1n$ur@nce: ✔
Pr1m@ry: Un1tedH3@lthc@re
P0licy#: UHC-1Z3456 (sc@nned)
Gr0up: GRP-987b5
P0licy H0lder: j0hn sm!th (S3lf)
PH D0B: 01/01/1999

+ Add 5econd@ry 1n$ur@nce
B@ck   $@ve   Subm!t

Key Real-World Elements Included:

    Inconsistent delimiters (colons, dashes, or nothing)

    HTML/UI artifacts (divs, buttons, checkboxes)

    OCR-like errors (character misrecognition)

    Compressed fields (missing labels, run-together values)

    Random whitespace (indentation, line breaks)

    Button labels (Save, Back, Submit)

    Optional sections (Secondary Insurance prompt)

    Mixed formats (vertical lists vs horizontal runs)

Let me know if you need specific combinations (e.g., insurance data with lab results) or extreme cases like multi-page pastes with headers/footers!
do it all in one go.
do it all in one go.

Absolutely! Here’s a single, realistic, messy copy-paste output of a full patient summary page including demographics, insurance, order info, and provider details—just like you might get from a Ctrl-A/Ctrl-C in a real EMR. This version includes disjointed formatting, missing/misaligned fields, UI artifacts, and secondary insurance prompts.

text
First Name
john
Last Name
smith
Date of Birth
01/01/1999
Gender
Female
Address Line 1
123 Medical Blvd
Address Line 2

City
Fort Myers
State
FL
ZIP Code
33905
Phone Number
(443) 602-6207
Email
test.scheduler@example.com
Medical Record Number (MRN)
Unknown
Social Security Number
000-00-0002

Patient has insurance   ☑
Primary Insurance
Insurance Company
UnitedHealthcare
Plan Name
Gold PPO
Policy Number
UHC-123456
Group Number
GRP-98765
Policy Holder Name
john smith
Relationship to Patient
Self
Policy Holder Date of Birth
01/01/1999

Secondary Insurance (Optional)
+ Add Secondary Insurance

Order Information
Order Type: Lab Panel
Order Status: Pending
Ordering Provider: Dr. Emily Carter
Order Date: 06/28/2025

Provider Details
Primary Care Provider: Dr. Emily Carter
NPI: 1122334455
Phone: (239) 555-1234

Notes:
- Patient requests results via email.
- Confirm insurance eligibility before processing order.

<< Back   Save Patient Info   Continue to Insurance   Submit Order

---------------------------------------------
Patient Summary - For Internal Use Only
---------------------------------------------

First Name: john    Last Name: smith   DOB: 01/01/1999   Gender: Female
Address: 123 Medical Blvd, Fort Myers, FL 33905
Phone: (443) 602-6207   Email: test.scheduler@example.com
MRN: Unknown   SSN: 000-00-0002

Insurance: UnitedHealthcare (Gold PPO)
Policy#: UHC-123456   Group#: GRP-98765
Holder: john smith (Self)   DOB: 01/01/1999

Secondary Insurance: [none]

Order: Lab Panel   Status: Pending
Provider: Dr. Emily Carter (NPI 1122334455)
Order Date: 06/28/2025

Notes: Patient requests results via email.

[Back] [Save Patient Info] [Continue to Insurance] [Submit Order]

--- END OF SUMMARY ---