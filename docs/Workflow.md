# ✅ SUMMARY: Test Users Created

All users have the same password: password123

## REFERRING PRACTICE USERS (Organization 1)

| Role | Email | Name | Description |
|------|-------|------|-------------|
| physician | [physician1@referring.com](mailto:physician1@referring.com) | Dr. Sarah Johnson | Primary physician who creates orders |
| physician | [physician2@referring.com](mailto:physician2@referring.com) | Dr. Michael Chen | Second physician for testing multiple providers |
| admin_staff | [adminstaff1@referring.com](mailto:adminstaff1@referring.com) | Emily Davis | Admin staff who finalizes orders |
| admin_staff | [adminstaff2@referring.com](mailto:adminstaff2@referring.com) | James Wilson | Backup admin staff |
| admin_referring | [admin@referring.com](mailto:admin@referring.com) | Robert Brown | Practice manager for referring organization |
| super_admin | [superadmin@radorderpad.com](mailto:superadmin@radorderpad.com) | System Administrator | System administrator with full access |

## RADIOLOGY GROUP USERS (Organization 2)

| Role | Email | Name | Description |
|------|-------|------|-------------|
| scheduler | [scheduler1@radiology.com](mailto:scheduler1@radiology.com) | Lisa Martinez | Primary scheduler who processes incoming orders |
| scheduler | [scheduler2@radiology.com](mailto:scheduler2@radiology.com) | Kevin Thompson | Backup scheduler |
| radiologist | [radiologist1@radiology.com](mailto:radiologist1@radiology.com) | Dr. Patricia Anderson | Radiologist who reviews orders |
| radiologist | [radiologist2@radiology.com](mailto:radiologist2@radiology.com) | Dr. William Taylor | Interventional radiologist |
| admin_radiology | [admin@radiology.com](mailto:admin@radiology.com) | Jennifer Lee | Radiology practice manager |

## ORDER WORKFLOW TESTING GUIDE

1. **PHYSICIAN creates order**:
   - Login as [physician1@referring.com](mailto:physician1@referring.com)
   - Create and validate an order
   - Save order for admin finalization

2. **ADMIN STAFF finalizes order**:
   - Login as [adminstaff1@referring.com](mailto:adminstaff1@referring.com)
   - Access order queue
   - Add patient demographics and insurance
   - Send to radiology

3. **SCHEDULER processes order**:
   - Login as [scheduler1@radiology.com](mailto:scheduler1@radiology.com)
   - View incoming orders
   - Update order status
   - Export for scheduling

4. **ADMIN users can**:
   - admin@referring.com: Manage referring practice
   - admin@radiology.com: Manage radiology group
   - superadmin@radorderpad.com: System administration

5. **RADIOLOGISTS can**:
   - View orders assigned to them
   - Add clinical notes

## Verifying Login Capability

| Email | Status |
|-------|--------|
| [physician1@referring.com](mailto:physician1@referring.com) | ✅ Can login |
| [physician2@referring.com](mailto:physician2@referring.com) | ✅ Can login |
| [adminstaff1@referring.com](mailto:adminstaff1@referring.com) | ✅ Can login |
| [adminstaff2@referring.com](mailto:adminstaff2@referring.com) | ✅ Can login |
| [admin@referring.com](mailto:admin@referring.com) | ✅ Can login |
| [scheduler1@radiology.com](mailto:scheduler1@radiology.com) | ✅ Can login |
| [scheduler2@radiology.com](mailto:scheduler2@radiology.com) | ✅ Can login |
| [radiologist1@radiology.com](mailto:radiologist1@radiology.com) | ✅ Can login |
| [radiologist2@radiology.com](mailto:radiologist2@radiology.com) | ✅ Can login |
| [admin@radiology.com](mailto:admin@radiology.com) | ✅ Can login |
| [superadmin@radorderpad.com](mailto:superadmin@radorderpad.com) | ✅ Can login |